package com.auda.service;

import com.auda.dao.entity.EmailCampaign;
import com.auda.dao.entity.EventAttendee;
import com.auda.model.dto.CampaignAnalyticsDto;
import com.auda.model.enums.AttendeeTag;
import com.auda.model.request.CaptureAttendeeRequest;
import com.auda.model.request.CreateCampaignRequest;
import com.auda.model.request.UpdateAttendeeTagRequest;
import com.auda.model.request.UpdateCampaignRequest;

import java.util.List;
import java.util.Set;

public interface CampaignService {

    EmailCampaign create(Long eventId, Long requesterId, CreateCampaignRequest request);

    List<EmailCampaign> listForEvent(Long eventId, Long requesterId);

    long audienceSize(Long eventId, Long requesterId, Set<AttendeeTag> tags);

    EmailCampaign update(Long id, Long requesterId, UpdateCampaignRequest request);

    void delete(Long id, Long requesterId);

    void captureAttendee(Long eventId, CaptureAttendeeRequest request);

    List<EventAttendee> listAttendees(Long eventId, Long requesterId);

    EventAttendee updateAttendeeTag(Long eventId, Long attendeeId, Long requesterId, UpdateAttendeeTagRequest request);

    CampaignAnalyticsDto getAnalytics(Long campaignId, Long requesterId);

    void recordOpen(String trackingToken);

    String recordClickAndGetRedirectUrl(String trackingToken);
}
