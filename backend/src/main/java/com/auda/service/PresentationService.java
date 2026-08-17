package com.auda.service;

import com.auda.model.dto.PresentationDto;
import com.auda.model.dto.PresentationFileDto;
import com.auda.model.dto.SlideImageDto;
import com.auda.model.request.UpdatePresentationRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PresentationService {

    PresentationDto upload(Long sessionId, Long requesterId, MultipartFile file);

    List<PresentationDto> listForSession(Long sessionId, Long requesterId);

    PresentationDto update(Long id, Long requesterId, UpdatePresentationRequest request);

    void delete(Long id, Long requesterId);

    PresentationDto getActiveForSession(Long sessionId);

    SlideImageDto getSlideImage(Long presentationId, int slideNumber);

    /**
     * The original PDF, for attendees. Requires the session to be readable and
     * the organiser to have turned downloads on; the event's owner is exempt
     * from the flag, since it is their own file.
     */
    PresentationFileDto download(Long presentationId);
}
