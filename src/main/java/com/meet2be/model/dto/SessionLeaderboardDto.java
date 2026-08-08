package com.meet2be.model.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SessionLeaderboardDto {
    private Long sessionId;
    private List<LeaderboardEntryDto> entries;
}
