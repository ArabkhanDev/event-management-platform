package com.meet2be.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CampaignAnalyticsDto {
    private long totalRecipients;
    private long delivered;
    private long bounced;
    private long opened;
    private long clicked;
    private double openRate;
    private double clickRate;
    private double bounceRate;
}
