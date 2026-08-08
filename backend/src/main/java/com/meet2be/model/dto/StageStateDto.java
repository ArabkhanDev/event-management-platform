package com.meet2be.model.dto;

import com.meet2be.model.dto.SessionLeaderboardDto;
import com.meet2be.model.dto.PollDto;
import com.meet2be.model.dto.QuestionDto;
import com.meet2be.model.enums.SessionAccessState;
import com.meet2be.model.enums.StageMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StageStateDto {
    private StageMode stageMode;
    private QuestionDto question;
    private PollDto poll;
    private SessionLeaderboardDto leaderboard;

    /**
     * Lets the attendee app render a session it may look at but not act on.
     * Without it a finished session is indistinguishable from a live one until
     * a submission comes back rejected.
     */
    private SessionAccessState accessState;
}
