package com.meet2be.service;

import com.meet2be.model.dto.PresentationDto;
import com.meet2be.model.dto.PresentationFileDto;
import com.meet2be.model.request.UpdatePresentationRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PresentationService {

    PresentationDto upload(Long sessionId, Long requesterId, MultipartFile file);

    List<PresentationDto> listForSession(Long sessionId, Long requesterId);

    PresentationDto update(Long id, Long requesterId, UpdatePresentationRequest request);

    void delete(Long id, Long requesterId);

    PresentationDto getActiveForSession(Long sessionId);

    byte[] getSlideImage(Long presentationId, int slideNumber);

    /**
     * The original PDF, for attendees. Requires the session to be readable and
     * the organiser to have turned downloads on; the event's owner is exempt
     * from the flag, since it is their own file.
     */
    PresentationFileDto download(Long presentationId);
}
