package com.auda.service.handler;

import com.auda.dao.entity.Presentation;
import com.auda.dao.entity.PresentationSource;
import com.auda.dao.repository.PresentationSourceRepository;
import com.auda.exception.ApiException;
import com.auda.model.dto.PresentationFileDto;
import com.auda.service.PresentationStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DatabasePresentationStorageHandler implements PresentationStorageService {

    private final PresentationSourceRepository sourceRepository;

    @Override
    public void store(Presentation presentation, String contentType, byte[] data) {
        // Re-uploading over an existing deck replaces the stored file rather
        // than accumulating orphans.
        sourceRepository.findByPresentationId(presentation.getId())
                .ifPresent(existing -> sourceRepository.deleteByPresentationId(presentation.getId()));

        sourceRepository.save(buildSource(presentation, contentType, data));

        log.info("ActionLog.store : Presentation source retained, presentationId={}, sizeBytes={}",
                presentation.getId(), data.length);
    }

    @Override
    @Transactional(readOnly = true)
    public PresentationFileDto load(Long presentationId) {
        PresentationSource source = sourceRepository.findByPresentationId(presentationId)
                .orElseThrow(() -> ApiException.notFound("error.presentation.sourceNotFound"));

        return PresentationFileDto.builder()
                .filename(source.getPresentation().getOriginalFilename())
                .contentType(source.getContentType())
                .sizeBytes(source.getSizeBytes())
                .data(source.getFileData())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean exists(Long presentationId) {
        return sourceRepository.existsByPresentationId(presentationId);
    }

    @Override
    public void delete(Long presentationId) {
        sourceRepository.deleteByPresentationId(presentationId);
    }

    private PresentationSource buildSource(Presentation presentation, String contentType, byte[] data) {
        return PresentationSource.builder()
                .presentation(presentation)
                .contentType(contentType)
                .sizeBytes(data.length)
                .fileData(data)
                .build();
    }
}
