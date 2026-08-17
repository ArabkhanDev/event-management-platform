package com.auda.model.request;

import com.auda.model.enums.AttendeeTag;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateCampaignRequest {
    private String subject;
    private String body;
    private Set<AttendeeTag> targetTags;
}
