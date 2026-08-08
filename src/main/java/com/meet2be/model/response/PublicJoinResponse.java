package com.meet2be.model.response;

import com.meet2be.model.dto.SessionDto;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.meet2be.model.dto.EventSummaryDto;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PublicJoinResponse {
    private EventSummaryDto event;
    private List<SessionDto> sessions;
}
