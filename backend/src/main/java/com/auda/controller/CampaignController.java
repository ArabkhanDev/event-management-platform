package com.auda.controller;

import com.auda.util.CurrentUser;
import com.auda.model.dto.AttendeeDto;
import com.auda.model.dto.AudienceSizeDto;
import com.auda.model.dto.CampaignAnalyticsDto;
import com.auda.model.enums.AttendeeTag;
import com.auda.model.request.CaptureAttendeeRequest;
import com.auda.model.request.CreateCampaignRequest;
import com.auda.model.dto.EmailCampaignDto;
import com.auda.model.request.UpdateAttendeeTagRequest;
import com.auda.model.request.UpdateCampaignRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import com.auda.service.CampaignService;
import com.auda.dao.entity.EmailCampaign;

@RestController
@RequiredArgsConstructor
public class CampaignController {

    private static final byte[] TRANSPARENT_PIXEL_GIF =
            Base64.getDecoder().decode("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==");

    private final CampaignService campaignService;

    @PostMapping("/api/events/{eventId}/campaigns")
    public ResponseEntity<EmailCampaignDto> create(@PathVariable Long eventId, @RequestBody CreateCampaignRequest request) {
        EmailCampaign campaign = campaignService.create(eventId, CurrentUser.id(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(EmailCampaignDto.from(campaign));
    }

    @GetMapping("/api/events/{eventId}/campaigns")
    public ResponseEntity<List<EmailCampaignDto>> listForEvent(@PathVariable Long eventId) {
        List<EmailCampaignDto> campaigns = campaignService.listForEvent(eventId, CurrentUser.id()).stream()
                .map(EmailCampaignDto::from)
                .toList();
        return ResponseEntity.ok(campaigns);
    }

    @GetMapping("/api/events/{eventId}/campaigns/audience-size")
    public ResponseEntity<AudienceSizeDto> audienceSize(
            @PathVariable Long eventId, @RequestParam(required = false) Set<AttendeeTag> tags) {
        return ResponseEntity.ok(new AudienceSizeDto(campaignService.audienceSize(eventId, CurrentUser.id(), tags)));
    }

    @GetMapping("/api/events/{eventId}/campaigns/attendees")
    public ResponseEntity<List<AttendeeDto>> listAttendees(@PathVariable Long eventId) {
        List<AttendeeDto> attendees = campaignService.listAttendees(eventId, CurrentUser.id()).stream()
                .map(AttendeeDto::from)
                .toList();
        return ResponseEntity.ok(attendees);
    }

    @PatchMapping("/api/events/{eventId}/attendees/{attendeeId}")
    public ResponseEntity<AttendeeDto> updateAttendeeTag(
            @PathVariable Long eventId, @PathVariable Long attendeeId, @RequestBody UpdateAttendeeTagRequest request) {
        var attendee = campaignService.updateAttendeeTag(eventId, attendeeId, CurrentUser.id(), request);
        return ResponseEntity.ok(AttendeeDto.from(attendee));
    }

    @GetMapping("/api/campaigns/{campaignId}/analytics")
    public ResponseEntity<CampaignAnalyticsDto> analytics(@PathVariable Long campaignId) {
        return ResponseEntity.ok(campaignService.getAnalytics(campaignId, CurrentUser.id()));
    }

    @PatchMapping("/api/campaigns/{id}")
    public ResponseEntity<EmailCampaignDto> update(@PathVariable Long id, @RequestBody UpdateCampaignRequest request) {
        EmailCampaign campaign = campaignService.update(id, CurrentUser.id(), request);
        return ResponseEntity.ok(EmailCampaignDto.from(campaign));
    }

    @DeleteMapping("/api/campaigns/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        campaignService.delete(id, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/public/events/{eventId}/attendees")
    public ResponseEntity<Void> captureAttendee(@PathVariable Long eventId, @RequestBody CaptureAttendeeRequest request) {
        campaignService.captureAttendee(eventId, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/public/campaigns/track/open/{token}")
    public ResponseEntity<byte[]> trackOpen(@PathVariable String token) {
        campaignService.recordOpen(token);
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("image/gif"))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(TRANSPARENT_PIXEL_GIF);
    }

    @GetMapping("/api/public/campaigns/track/click/{token}")
    public ResponseEntity<Void> trackClick(@PathVariable String token) {
        String redirectUrl = campaignService.recordClickAndGetRedirectUrl(token);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(redirectUrl))
                .build();
    }
}
