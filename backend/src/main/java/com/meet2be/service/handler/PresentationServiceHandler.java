package com.meet2be.service.handler;

import com.meet2be.dao.entity.Presentation;
import com.meet2be.dao.entity.PresentationSlide;
import com.meet2be.dao.entity.Session;
import com.meet2be.dao.repository.PresentationRepository;
import com.meet2be.dao.repository.PresentationSlideRepository;
import com.meet2be.dao.repository.SessionRepository;
import com.meet2be.exception.ApiException;
import com.meet2be.model.constants.WsMessageType;
import com.meet2be.model.dto.PresentationFileDto;
import com.meet2be.model.dto.PresentationDto;
import com.meet2be.model.dto.WsMessage;
import com.meet2be.model.enums.PresentationStatus;
import com.meet2be.model.request.UpdatePresentationRequest;
import com.meet2be.service.OwnershipService;
import com.meet2be.service.EventBroadcaster;
import com.meet2be.service.PresentationService;
import com.meet2be.service.PresentationStorageService;
import com.meet2be.service.SessionAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PresentationServiceHandler implements PresentationService {

    private static final String PDF_CONTENT_TYPE = "application/pdf";
    private static final float RENDER_DPI = 110f;
    private static final int MAX_SLIDES = 200;

    private final PresentationRepository presentationRepository;
    private final PresentationSlideRepository slideRepository;
    private final SessionRepository sessionRepository;
    private final EventBroadcaster eventBroadcaster;
    private final SessionAccessService sessionAccessService;
    private final PresentationStorageService presentationStorageService;
    private final OwnershipService ownershipService;

    @Override
    @Transactional
    public PresentationDto upload(Long sessionId, Long requesterId, MultipartFile file) {
        Session session = requireOwnedSession(sessionId, requesterId);
        validateUpload(file);

        Presentation presentation = presentationRepository.save(buildPresentation(session, file));
        byte[] source = readBytes(file);
        int slideCount = renderAndStoreSlides(presentation, source);

        // Retained regardless of the download flag: exposure is a decision the
        // organiser can revisit, discarding the file is not.
        presentationStorageService.store(presentation, resolveContentType(file), source);

        presentation.setSlideCount(slideCount);
        presentation = presentationRepository.save(presentation);

        log.info("ActionLog.upload : Presentation uploaded successfully, presentationId={}, sessionId={}, slideCount={}",
                presentation.getId(), sessionId, slideCount);
        return toDto(presentation);
    }

    private void validateUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("error.presentation.fileRequired");
        }
        if (!isPdf(file)) {
            throw ApiException.badRequest("error.presentation.pdfOnly");
        }
    }

    private boolean isPdf(MultipartFile file) {
        String filename = file.getOriginalFilename();
        boolean pdfName = filename != null && filename.toLowerCase().endsWith(".pdf");
        return pdfName || PDF_CONTENT_TYPE.equalsIgnoreCase(file.getContentType());
    }

    private Presentation buildPresentation(Session session, MultipartFile file) {
        String filename = file.getOriginalFilename() == null ? "presentation.pdf" : file.getOriginalFilename();
        return Presentation.builder()
                .session(session)
                .title(stripExtension(filename))
                .originalFilename(filename)
                .slideCount(0)
                .currentSlide(1)
                .status(PresentationStatus.DRAFT)
                .build();
    }

    private String stripExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(0, dot) : filename;
    }

    /**
     * Rasterises every PDF page to PNG up front so serving a slide is a single
     * indexed row read rather than a repeated parse of the source document.
     */
    private int renderAndStoreSlides(Presentation presentation, byte[] source) {
        try (PDDocument document = Loader.loadPDF(source)) {
            int pageCount = document.getNumberOfPages();
            if (pageCount == 0) {
                throw ApiException.badRequest("error.presentation.emptyPdf");
            }
            if (pageCount > MAX_SLIDES) {
                throw ApiException.badRequest("error.presentation.tooManySlides", MAX_SLIDES);
            }

            PDFRenderer renderer = new PDFRenderer(document);
            List<PresentationSlide> slides = new ArrayList<>();
            for (int page = 0; page < pageCount; page++) {
                slides.add(renderSlide(presentation, renderer, page));
            }
            slideRepository.saveAll(slides);

            return pageCount;
        } catch (IOException e) {
            log.error("ActionLog.renderAndStoreSlides : Failed to read PDF, presentationId={}", presentation.getId(), e);
            throw ApiException.badRequest("error.presentation.unreadablePdf");
        }
    }

    private PresentationSlide renderSlide(Presentation presentation, PDFRenderer renderer, int pageIndex)
            throws IOException {
        BufferedImage image = renderer.renderImageWithDPI(pageIndex, RENDER_DPI, ImageType.RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);

        return PresentationSlide.builder()
                .presentation(presentation)
                .slideNumber(pageIndex + 1)
                .imageData(out.toByteArray())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PresentationDto> listForSession(Long sessionId, Long requesterId) {
        requireOwnedSession(sessionId, requesterId);
        return presentationRepository.findBySessionIdOrderByCreatedAtDesc(sessionId).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional
    public PresentationDto update(Long id, Long requesterId, UpdatePresentationRequest request) {
        Presentation presentation = getOwned(id, requesterId);
        Long sessionId = presentation.getSession().getId();

        if (request.getStatus() != null) {
            applyStatus(presentation, request.getStatus(), sessionId);
        }
        if (request.getCurrentSlide() != null) {
            applyCurrentSlide(presentation, request.getCurrentSlide());
        }
        if (request.getDownloadEnabled() != null) {
            applyDownloadEnabled(presentation, request.getDownloadEnabled());
        }

        presentation = presentationRepository.save(presentation);

        PresentationDto dto = toDto(presentation);
        eventBroadcaster.broadcastPresentation(sessionId,
                WsMessage.of(WsMessageType.PRESENTATION_UPDATED, dto));
        return dto;
    }

    private void applyStatus(Presentation presentation, PresentationStatus newStatus, Long sessionId) {
        if (newStatus == PresentationStatus.ACTIVE) {
            activateExclusively(sessionId, presentation.getId());
        }
        log.info("ActionLog.update : Presentation status changed, presentationId={}, oldStatus={}, newStatus={}",
                presentation.getId(), presentation.getStatus(), newStatus);
        presentation.setStatus(newStatus);
    }

    /** Only one presentation may be ACTIVE per session at a time. */
    private void activateExclusively(Long sessionId, Long presentationId) {
        presentationRepository.findFirstBySessionIdAndStatus(sessionId, PresentationStatus.ACTIVE)
                .filter(other -> !other.getId().equals(presentationId))
                .ifPresent(other -> {
                    other.setStatus(PresentationStatus.CLOSED);
                    presentationRepository.save(other);
                });
    }

    private void applyDownloadEnabled(Presentation presentation, boolean enabled) {
        if (enabled && !presentationStorageService.exists(presentation.getId())) {
            throw ApiException.badRequest("error.presentation.sourceNotFound");
        }
        log.info("ActionLog.update : Presentation download permission changed, presentationId={}, enabled={}",
                presentation.getId(), enabled);
        presentation.setDownloadEnabled(enabled);
    }

    private PresentationDto toDto(Presentation presentation) {
        return PresentationDto.from(presentation, presentationStorageService.exists(presentation.getId()));
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            log.error("ActionLog.readBytes : Failed to read uploaded file", e);
            throw ApiException.badRequest("error.presentation.unreadablePdf");
        }
    }

    private String resolveContentType(MultipartFile file) {
        return file.getContentType() == null ? PDF_CONTENT_TYPE : file.getContentType();
    }

    private void applyCurrentSlide(Presentation presentation, int requestedSlide) {
        if (requestedSlide < 1 || requestedSlide > presentation.getSlideCount()) {
            throw ApiException.badRequest("error.presentation.slideOutOfRange", presentation.getSlideCount());
        }
        presentation.setCurrentSlide(requestedSlide);
    }

    @Override
    @Transactional
    public void delete(Long id, Long requesterId) {
        Presentation presentation = getOwned(id, requesterId);
        slideRepository.deleteByPresentationId(presentation.getId());
        presentationStorageService.delete(presentation.getId());
        presentationRepository.delete(presentation);
        log.info("ActionLog.delete : Presentation deleted successfully, presentationId={}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public PresentationDto getActiveForSession(Long sessionId) {
        sessionAccessService.requireReadable(sessionId);
        return presentationRepository.findFirstBySessionIdAndStatus(sessionId, PresentationStatus.ACTIVE)
                .map(this::toDto)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] getSlideImage(Long presentationId, int slideNumber) {
        Presentation presentation = presentationRepository.findById(presentationId)
                .orElseThrow(() -> ApiException.notFound("error.presentation.notFound"));
        sessionAccessService.requireReadable(presentation.getSession().getId());

        return slideRepository.findByPresentationIdAndSlideNumber(presentationId, slideNumber)
                .map(PresentationSlide::getImageData)
                .orElseThrow(() -> ApiException.notFound("error.presentation.slideNotFound"));
    }

    @Override
    @Transactional(readOnly = true)
    public PresentationFileDto download(Long presentationId) {
        Presentation presentation = presentationRepository.findById(presentationId)
                .orElseThrow(() -> ApiException.notFound("error.presentation.notFound"));

        Session session = sessionAccessService.requireReadable(presentation.getSession().getId());

        // The flag protects the speaker's material from the audience, not from
        // the organiser hosting it.
        if (!presentation.isDownloadEnabled() && !sessionAccessService.isCurrentUserOwner(session)) {
            log.warn("ActionLog.download : Rejected download of a deck that is not shared, presentationId={}",
                    presentationId);
            throw ApiException.of(HttpStatus.FORBIDDEN, "DOWNLOAD_DISABLED", "error.presentation.downloadDisabled");
        }

        return presentationStorageService.load(presentationId);
    }

    private Presentation getOwned(Long id, Long requesterId) {
        Presentation presentation = presentationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("error.presentation.notFound"));
        requireOwnedSession(presentation.getSession().getId(), requesterId);
        return presentation;
    }

    private Session requireOwnedSession(Long sessionId, Long requesterId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> ApiException.notFound("error.session.notFound"));
        ownershipService.requireOwnerOrAdmin(session.getEvent(), requesterId);
        return session;
    }
}
