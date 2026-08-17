package com.auda.model.request;

import com.auda.model.enums.CampaignStatus;
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
