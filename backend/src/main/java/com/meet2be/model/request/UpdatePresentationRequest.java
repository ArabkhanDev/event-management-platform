package com.meet2be.model.request;

import com.meet2be.model.enums.PresentationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdatePresentationRequest {

    private PresentationStatus status;

    /**
     * 1-based slide to push to attendees. Null when the request only changes
     * status.
     */
    private Integer currentSlide;

    /** Null when the request does not touch download permission. */
    private Boolean downloadEnabled;
}
