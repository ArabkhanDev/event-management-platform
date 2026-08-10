package com.meet2be.model.dto;

import com.meet2be.dao.entity.Presentation;
import com.meet2be.model.enums.PresentationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PresentationDto {

    private Long id;
    private Long sessionId;
    private String title;
    private String originalFilename;
    private int slideCount;
    private int currentSlide;
    private PresentationStatus status;
    private Instant createdAt;

    /** Whether the organiser has opened this deck up for attendees to download. */
    private boolean downloadEnabled;

    /**
     * Whether the original file is actually on hand. False for decks uploaded
     * before source retention existed — they can be shared only by re-uploading,
     * and the operator UI uses this to explain why the toggle is unavailable.
     */
    private boolean sourceAvailable;

    public static PresentationDto from(Presentation presentation, boolean sourceAvailable) {
        return baseBuilder(presentation)
                .sourceAvailable(sourceAvailable)
                .build();
    }

    private static PresentationDtoBuilder baseBuilder(Presentation presentation) {
        return PresentationDto.builder()
                .id(presentation.getId())
                .sessionId(presentation.getSession().getId())
                .title(presentation.getTitle())
                .originalFilename(presentation.getOriginalFilename())
                .slideCount(presentation.getSlideCount())
                .currentSlide(presentation.getCurrentSlide())
                .status(presentation.getStatus())
                .createdAt(presentation.getCreatedAt())
                .downloadEnabled(presentation.isDownloadEnabled());
    }
}
