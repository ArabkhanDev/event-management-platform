package com.meet2be.service.handler;

import com.meet2be.config.CampaignLinksProperties;
import com.meet2be.dao.entity.CampaignRecipient;
import com.meet2be.dao.entity.EmailCampaign;
import com.meet2be.dao.entity.Event;
import com.meet2be.dao.entity.EventAttendee;
import com.meet2be.dao.repository.CampaignRecipientRepository;
import com.meet2be.dao.repository.EmailCampaignRepository;
import com.meet2be.dao.repository.EventAttendeeRepository;
import com.meet2be.dao.repository.EventRepository;
import com.meet2be.exception.ApiException;
import com.meet2be.model.dto.CampaignAnalyticsDto;
import com.meet2be.model.enums.AttendeeTag;
import com.meet2be.model.enums.CampaignStatus;
import com.meet2be.model.enums.RecipientStatus;
import com.meet2be.model.request.CaptureAttendeeRequest;
import com.meet2be.model.request.CreateCampaignRequest;
import com.meet2be.model.request.UpdateAttendeeTagRequest;
import com.meet2be.model.request.UpdateCampaignRequest;
import com.meet2be.service.CampaignService;
import com.meet2be.service.EmailSender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CampaignServiceHandler implements CampaignService {

    private final EmailCampaignRepository campaignRepository;
    private final EventAttendeeRepository attendeeRepository;
    private final EventRepository eventRepository;
    private final CampaignRecipientRepository recipientRepository;
    private final EmailSender emailSender;
    private final CampaignLinksProperties linksProperties;

    @Override
    public EmailCampaign create(Long eventId, Long requesterId, CreateCampaignRequest request) {
        Event event = requireOwnedEvent(eventId, requesterId);

        if (request.getSubject() == null || request.getSubject().isBlank()) {
            throw ApiException.badRequest("error.campaign.subjectRequired");
        }
        if (request.getBody() == null || request.getBody().isBlank()) {
            throw ApiException.badRequest("error.common.bodyRequired");
        }

        EmailCampaign campaign = EmailCampaign.builder()
                .event(event)
                .subject(request.getSubject())
                .body(request.getBody())
                .status(CampaignStatus.DRAFT)
                .targetTags(request.getTargetTags() == null ? Set.of() : request.getTargetTags())
                .build();

        campaign = campaignRepository.save(campaign);
        log.info("ActionLog.create : Campaign created successfully, campaignId={}, eventId={}", campaign.getId(), eventId);
        return campaign;
    }

    @Override
    public List<EmailCampaign> listForEvent(Long eventId, Long requesterId) {
        requireOwnedEvent(eventId, requesterId);
        return campaignRepository.findByEventIdOrderByCreatedAtDesc(eventId);
    }

    @Override
    public long audienceSize(Long eventId, Long requesterId, Set<AttendeeTag> tags) {
        requireOwnedEvent(eventId, requesterId);
        return (tags == null || tags.isEmpty())
                ? attendeeRepository.countByEventIdAndEmailIsNotNull(eventId)
                : attendeeRepository.countByEventIdAndEmailIsNotNullAndTagIn(eventId, tags);
    }

    @Override
    public EmailCampaign update(Long id, Long requesterId, UpdateCampaignRequest request) {
        EmailCampaign campaign = getOwned(id, requesterId);

        if (request.getSubject() != null || request.getBody() != null) {
            applyEdits(campaign, request);
        }

        if (request.getStatus() == CampaignStatus.SENT) {
            markSent(campaign);
        }

        return campaignRepository.save(campaign);
    }

    @Override
    public void delete(Long id, Long requesterId) {
        EmailCampaign campaign = getOwned(id, requesterId);
        if (campaign.getStatus() == CampaignStatus.SENT) {
            throw ApiException.badRequest("error.campaign.sentCannotBeDeleted");
        }
        campaignRepository.delete(campaign);
    }

    @Override
    public void captureAttendee(Long eventId, CaptureAttendeeRequest request) {
        if (request.getVoterToken() == null || request.getVoterToken().isBlank()) {
            throw ApiException.badRequest("error.campaign.voterTokenFieldRequired");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return;
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("error.event.notFound"));

        EventAttendee attendee = attendeeRepository.findByEventIdAndVoterToken(eventId, request.getVoterToken())
                .orElseGet(() -> EventAttendee.builder().event(event).voterToken(request.getVoterToken()).build());
        attendee.setEmail(request.getEmail().trim());
        attendeeRepository.save(attendee);
        log.info("ActionLog.captureAttendee : Attendee email captured successfully, eventId={}", eventId);
    }

    @Override
    public List<EventAttendee> listAttendees(Long eventId, Long requesterId) {
        requireOwnedEvent(eventId, requesterId);
        return attendeeRepository.findByEventIdOrderByCreatedAtDesc(eventId);
    }

    @Override
    public EventAttendee updateAttendeeTag(Long eventId, Long attendeeId, Long requesterId, UpdateAttendeeTagRequest request) {
        requireOwnedEvent(eventId, requesterId);
        if (request.getTag() == null) {
            throw ApiException.badRequest("error.campaign.tagRequired");
        }

        EventAttendee attendee = attendeeRepository.findById(attendeeId)
                .orElseThrow(() -> ApiException.notFound("error.campaign.attendeeNotFound"));
        if (!attendee.getEvent().getId().equals(eventId)) {
            throw ApiException.notFound("error.campaign.attendeeNotFound");
        }

        attendee.setTag(request.getTag());
        attendee = attendeeRepository.save(attendee);
        log.info("ActionLog.updateAttendeeTag : Attendee tag updated successfully, eventId={}, attendeeId={}, tag={}",
                eventId, attendeeId, request.getTag());
        return attendee;
    }

    @Override
    public CampaignAnalyticsDto getAnalytics(Long campaignId, Long requesterId) {
        EmailCampaign campaign = getOwned(campaignId, requesterId);

        long total = recipientRepository.countByCampaignId(campaign.getId());
        long delivered = recipientRepository.countByCampaignIdAndStatus(campaign.getId(), RecipientStatus.SENT);
        long bounced = recipientRepository.countByCampaignIdAndStatus(campaign.getId(), RecipientStatus.BOUNCED);
        long opened = recipientRepository.countByCampaignIdAndOpenedAtIsNotNull(campaign.getId());
        long clicked = recipientRepository.countByCampaignIdAndClickedAtIsNotNull(campaign.getId());

        return CampaignAnalyticsDto.builder()
                .totalRecipients(total)
                .delivered(delivered)
                .bounced(bounced)
                .opened(opened)
                .clicked(clicked)
                .openRate(rate(opened, delivered))
                .clickRate(rate(clicked, delivered))
                .bounceRate(rate(bounced, total))
                .build();
    }

    @Override
    public void recordOpen(String trackingToken) {
        recipientRepository.findByTrackingToken(trackingToken).ifPresent(recipient -> {
            if (recipient.getOpenedAt() == null) {
                recipient.setOpenedAt(Instant.now());
            }
            recipient.setOpenCount(recipient.getOpenCount() + 1);
            recipientRepository.save(recipient);
        });
    }

    @Override
    public String recordClickAndGetRedirectUrl(String trackingToken) {
        String joinUrl = UriComponentsBuilder.fromHttpUrl(linksProperties.getAppBaseUrl()).path("/join").toUriString();

        return recipientRepository.findByTrackingToken(trackingToken)
                .map(recipient -> {
                    if (recipient.getClickedAt() == null) {
                        recipient.setClickedAt(Instant.now());
                    }
                    recipient.setClickCount(recipient.getClickCount() + 1);
                    recipientRepository.save(recipient);
                    return joinUrl;
                })
                .orElse(joinUrl);
    }

    private double rate(long numerator, long denominator) {
        return denominator == 0 ? 0.0 : (double) numerator / denominator;
    }

    private void applyEdits(EmailCampaign campaign, UpdateCampaignRequest request) {
        if (campaign.getStatus() != CampaignStatus.DRAFT) {
            throw ApiException.badRequest("error.campaign.onlyDraftEditable");
        }
        if (request.getSubject() != null) {
            if (request.getSubject().isBlank()) {
                throw ApiException.badRequest("error.campaign.subjectBlank");
            }
            campaign.setSubject(request.getSubject());
        }
        if (request.getBody() != null) {
            if (request.getBody().isBlank()) {
                throw ApiException.badRequest("error.campaign.bodyBlank");
            }
            campaign.setBody(request.getBody());
        }
    }

    private void markSent(EmailCampaign campaign) {
        if (campaign.getStatus() == CampaignStatus.SENT) {
            throw ApiException.conflict("error.campaign.alreadySent");
        }

        List<EventAttendee> targetAttendees = resolveTargetAttendees(campaign);
        int sentCount = dispatchToRecipients(campaign, targetAttendees);

        if (!targetAttendees.isEmpty() && sentCount == 0) {
            throw ApiException.serviceUnavailable("error.campaign.smtpFailure");
        }

        campaign.setStatus(CampaignStatus.SENT);
        campaign.setRecipientCount(sentCount);
        campaign.setSentAt(Instant.now());
        log.info("ActionLog.markSent : Campaign sent successfully, campaignId={}, recipientCount={}, attempted={}",
                campaign.getId(), sentCount, targetAttendees.size());
    }

    private List<EventAttendee> resolveTargetAttendees(EmailCampaign campaign) {
        Set<AttendeeTag> tags = campaign.getTargetTags();
        Long eventId = campaign.getEvent().getId();
        return (tags == null || tags.isEmpty())
                ? attendeeRepository.findByEventIdAndEmailIsNotNull(eventId)
                : attendeeRepository.findByEventIdAndEmailIsNotNullAndTagIn(eventId, tags);
    }

    private int dispatchToRecipients(EmailCampaign campaign, List<EventAttendee> attendees) {
        List<CampaignRecipient> recipients = attendees.stream()
                .map(attendee -> buildRecipientRow(campaign, attendee))
                .toList();

        List<CompletableFuture<Boolean>> pendingSends = recipients.stream()
                .map(recipient -> emailSender.sendAsync(
                        recipient.getEmailSnapshot(), campaign.getSubject(), buildHtmlBody(campaign, recipient)))
                .toList();

        int sentCount = 0;
        for (int i = 0; i < recipients.size(); i++) {
            boolean success = pendingSends.get(i).join();
            recipients.get(i).setStatus(success ? RecipientStatus.SENT : RecipientStatus.BOUNCED);
            if (success) {
                sentCount++;
            }
        }
        recipientRepository.saveAll(recipients);
        return sentCount;
    }

    private CampaignRecipient buildRecipientRow(EmailCampaign campaign, EventAttendee attendee) {
        return CampaignRecipient.builder()
                .campaign(campaign)
                .attendee(attendee)
                .emailSnapshot(attendee.getEmail())
                .trackingToken(UUID.randomUUID().toString())
                .status(RecipientStatus.BOUNCED)
                .sentAt(Instant.now())
                .build();
    }

    private String buildHtmlBody(EmailCampaign campaign, CampaignRecipient recipient) {
        String escapedBody = HtmlUtils.htmlEscape(campaign.getBody()).replace("\n", "<br>");
        String clickUrl = UriComponentsBuilder.fromHttpUrl(linksProperties.getApiBaseUrl())
                .path("/api/public/campaigns/track/click/{token}")
                .buildAndExpand(recipient.getTrackingToken())
                .toUriString();
        String openPixelUrl = UriComponentsBuilder.fromHttpUrl(linksProperties.getApiBaseUrl())
                .path("/api/public/campaigns/track/open/{token}")
                .buildAndExpand(recipient.getTrackingToken())
                .toUriString();

        return """
                <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#141414;max-width:520px;">
                  <p>%s</p>
                  <p>
                    <a href="%s" style="display:inline-block;padding:10px 22px;background:#FF4B26;color:#ffffff;
                       text-decoration:none;border-radius:4px;font-weight:bold;">View event details</a>
                  </p>
                  <img src="%s" width="1" height="1" alt="" style="display:none;">
                </div>
                """.formatted(escapedBody, clickUrl, openPixelUrl);
    }

    private EmailCampaign getOwned(Long id, Long requesterId) {
        EmailCampaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("error.campaign.notFound"));
        if (!campaign.getEvent().getOwner().getId().equals(requesterId)) {
            throw ApiException.forbidden("error.campaign.notOwner");
        }
        return campaign;
    }

    private Event requireOwnedEvent(Long eventId, Long requesterId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("error.event.notFound"));
        if (!event.getOwner().getId().equals(requesterId)) {
            throw ApiException.forbidden("error.event.notOwner");
        }
        return event;
    }
}
