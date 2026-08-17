package com.auda.controller;

import com.auda.dao.entity.User;
import com.auda.dao.repository.UserRepository;
import com.auda.exception.ApiException;
import com.auda.model.dto.AccountUsageDto;
import com.auda.model.enums.PlanTier;
import com.auda.service.EventService;
import com.auda.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final UserRepository userRepository;
    private final EventService eventService;

    @GetMapping("/usage")
    public ResponseEntity<AccountUsageDto> getUsage() {
        User user = userRepository.findById(CurrentUser.id())
                .orElseThrow(() -> ApiException.notFound("error.user.notFound"));
        PlanTier plan = user.getPlan();
        long usedThisYear = eventService.countCreatedThisYear(user.getId());

        return ResponseEntity.ok(AccountUsageDto.builder()
                .plan(plan)
                .eventsUsedThisYear(usedThisYear)
                .eventsPerYear(plan.hasUnlimitedEvents() ? null : plan.getEventsPerYear())
                .attendeesPerEvent(plan.hasUnlimitedAttendees() ? null : plan.getAttendeesPerEvent())
                .build());
    }
}
