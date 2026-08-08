package com.meet2be.controller;

import com.meet2be.dao.entity.Presentation;
import com.meet2be.model.dto.PresentationDto;
import com.meet2be.model.request.UpdatePresentationRequest;
import com.meet2be.service.PresentationService;
import com.meet2be.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class PresentationController {

    private final PresentationService presentationService;

    @PostMapping("/api/sessions/{sessionId}/presentations")
    public ResponseEntity<PresentationDto> upload(@PathVariable Long sessionId,
                                                  @RequestParam("file") MultipartFile file) {
        Presentation presentation = presentationService.upload(sessionId, CurrentUser.id(), file);
        return ResponseEntity.status(HttpStatus.CREATED).body(PresentationDto.from(presentation));
    }

    @GetMapping("/api/sessions/{sessionId}/presentations")
    public ResponseEntity<List<PresentationDto>> listForSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(presentationService.listForSession(sessionId, CurrentUser.id()));
    }

    @PatchMapping("/api/presentations/{id}")
    public ResponseEntity<PresentationDto> update(@PathVariable Long id,
                                                  @RequestBody UpdatePresentationRequest request) {
        return ResponseEntity.ok(presentationService.update(id, CurrentUser.id(), request));
    }

    @DeleteMapping("/api/presentations/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        presentationService.delete(id, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/public/sessions/{sessionId}/active-presentation")
    public ResponseEntity<PresentationDto> getActiveForSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(presentationService.getActiveForSession(sessionId));
    }

    /**
     * Slide images are immutable once rendered, so they are safe to cache hard
     * on the attendee's device — this is what keeps slide changes feeling
     * instant on a crowded conference network.
     */
    @GetMapping("/api/public/presentations/{id}/slides/{slideNumber}")
    public ResponseEntity<byte[]> getSlideImage(@PathVariable Long id, @PathVariable int slideNumber) {
        byte[] image = presentationService.getSlideImage(id, slideNumber);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                .body(image);
    }
}
