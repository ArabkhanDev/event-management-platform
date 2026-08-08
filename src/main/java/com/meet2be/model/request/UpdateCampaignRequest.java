package com.meet2be.model.request;

import com.meet2be.model.enums.CampaignStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateCampaignRequest {
    private String subject;
    private String body;
    private CampaignStatus status;
}
