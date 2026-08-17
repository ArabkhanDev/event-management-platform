package com.auda.model.dto;

import com.auda.model.enums.AttendeeTag;
import com.auda.model.enums.CampaignStatus;
import com.auda.dao.entity.EmailCampaign;
import java.time.Instant;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmailCampaignDto {
    private Long id;
    private Long eventId;
    private String subject;
    private String body;
    private CampaignStatus status;
    private Set<AttendeeTag> targetTags;
    private Integer recipientCount;
    private Instant sentAt;
    private Instant createdAt;

    public static EmailCampaignDto from(EmailCampaign campaign) {
        return new EmailCampaignDto(
                campaign.getId(),
                campaign.getEvent().getId(),
                campaign.getSubject(),
                campaign.getBody(),
                campaign.getStatus(),
                campaign.getTargetTags(),
                campaign.getRecipientCount(),
                campaign.getSentAt(),
                campaign.getCreatedAt()
        );
    }
}
