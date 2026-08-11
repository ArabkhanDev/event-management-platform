package com.meet2be.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One rendered slide on its way to a viewer.
 *
 * <p>Carries the content type because the encoding is chosen per slide rather
 * than per deck — the controller cannot assume PNG any more.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SlideImageDto {

    private String contentType;
    private byte[] data;
}
