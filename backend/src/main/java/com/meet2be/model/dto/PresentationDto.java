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

    public static PresentationDto from(Presentation presentation) {
        return PresentationDto.builder()
                .id(presentation.getId())
                .sessionId(presentation.getSession().getId())
                .title(presentation.getTitle())
                .originalFilename(presentation.getOriginalFilename())
                .slideCount(presentation.getSlideCount())
                .currentSlide(presentation.getCurrentSlide())
                .status(presentation.getStatus())
                .createdAt(presentation.getCreatedAt())
                .build();
    }
}
