package com.meet2be.model.request;

import com.meet2be.model.enums.PollStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdatePollStatusRequest {
    private PollStatus status;
}
