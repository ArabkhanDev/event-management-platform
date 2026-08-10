package com.meet2be.controller;

import com.meet2be.dao.entity.User;
import com.meet2be.dao.repository.UserRepository;
import com.meet2be.exception.ApiException;
import com.meet2be.model.dto.AccountUsageDto;
import com.meet2be.model.enums.PlanTier;
import com.meet2be.service.EventService;
import com.meet2be.util.CurrentUser;
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
