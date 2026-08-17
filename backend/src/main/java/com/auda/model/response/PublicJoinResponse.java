package com.auda.model.response;

import com.auda.model.dto.SessionDto;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.auda.model.dto.EventSummaryDto;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PublicJoinResponse {
    private EventSummaryDto event;
    private List<SessionDto> sessions;
}
