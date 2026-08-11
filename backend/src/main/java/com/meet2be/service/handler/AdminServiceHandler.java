package com.meet2be.service.handler;

import com.meet2be.dao.entity.Event;
import com.meet2be.dao.entity.User;
import com.meet2be.dao.repository.EventRepository;
import com.meet2be.dao.repository.SessionRepository;
import com.meet2be.dao.repository.UserRepository;
import com.meet2be.exception.ApiException;
import com.meet2be.model.dto.AdminEventDto;
import com.meet2be.model.dto.AdminUserDto;
import com.meet2be.model.enums.UserRole;
import com.meet2be.model.request.UpdateUserRequest;
import com.meet2be.model.response.PageResponse;
import com.meet2be.service.AdminService;
import com.meet2be.service.OwnershipService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceHandler implements AdminService {

    /** Ceiling on ?size= so one request cannot ask for the entire table. */
    private static final int MAX_PAGE_SIZE = 100;

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final SessionRepository sessionRepository;
    private final OwnershipService ownershipService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminUserDto> listUsers(Long requesterId, int page, int size) {
        ownershipService.requireAdmin(requesterId);

        Page<User> users = userRepository.findAllByOrderByCreatedAtDesc(toPageable(page, size));

        return PageResponse.of(users, users.getContent().stream()
                .map(this::toUserDto)
                .toList());
    }

    @Override
    @Transactional
    public AdminUserDto updateUser(Long targetUserId, Long requesterId, UpdateUserRequest request) {
        ownershipService.requireAdmin(requesterId);

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> ApiException.notFound("error.user.notFound"));

        if (request.getPlan() != null) {
            log.info("ActionLog.updateUser : Admin changed plan, adminId={}, targetUserId={}, from={}, to={}",
                    requesterId, targetUserId, target.getPlan(), request.getPlan());
            target.setPlan(request.getPlan());
        }
        if (request.getRole() != null) {
            applyRoleChange(target, requesterId, request.getRole());
        }
        if (request.getBlocked() != null) {
            applyBlockedChange(target, requesterId, request.getBlocked());
        }

        return toUserDto(userRepository.save(target));
    }

    /**
     * Same reasoning as {@link #applyRoleChange}: an admin blocking themselves
     * would lock them out of the panel with no one left to reverse it.
     */
    private void applyBlockedChange(User target, Long requesterId, boolean blocked) {
        if (target.getId().equals(requesterId) && blocked) {
            throw ApiException.badRequest("error.admin.cannotBlockSelf");
        }

        log.info("ActionLog.updateUser : Admin changed block status, adminId={}, targetUserId={}, blocked={}",
                requesterId, target.getId(), blocked);
        target.setBlocked(blocked);
    }

    /**
     * An admin demoting themselves would leave the panel unreachable if they
     * were the only one, so that is rejected rather than silently allowed —
     * removing your own access should be a deliberate act by someone else.
     */
    private void applyRoleChange(User target, Long requesterId, UserRole newRole) {
        if (target.getId().equals(requesterId) && newRole != UserRole.ADMIN) {
            throw ApiException.badRequest("error.admin.cannotDemoteSelf");
        }

        log.info("ActionLog.updateUser : Admin changed role, adminId={}, targetUserId={}, from={}, to={}",
                requesterId, target.getId(), target.getRole(), newRole);
        target.setRole(newRole);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminEventDto> listEvents(Long requesterId, int page, int size) {
        ownershipService.requireAdmin(requesterId);

        Page<Event> events = eventRepository.findAllByOrderByCreatedAtDesc(toPageable(page, size));

        return PageResponse.of(events, events.getContent().stream()
                .map(this::toEventDto)
                .toList());
    }

    /**
     * Clamped rather than rejected: page controls are a navigation aid, and a
     * stale link or hand-edited query string should land on a sane page instead
     * of an error. The size ceiling is what stops {@code ?size=1000000} turning
     * a listing into a full table scan.
     */
    private Pageable toPageable(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return PageRequest.of(safePage, safeSize);
    }

    private AdminUserDto toUserDto(User user) {
        return AdminUserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .plan(user.getPlan())
                .role(user.getRole())
                .blocked(user.isBlocked())
                .eventCount(eventRepository.countByOwnerId(user.getId()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AdminEventDto toEventDto(Event event) {
        User owner = event.getOwner();
        return AdminEventDto.builder()
                .id(event.getId())
                .name(event.getName())
                .joinCode(event.getJoinCode())
                .status(event.getStatus())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .createdAt(event.getCreatedAt())
                .ownerId(owner.getId())
                .ownerName(owner.getName())
                .ownerEmail(owner.getEmail())
                .sessionCount((int) sessionRepository.countByEventId(event.getId()))
                .build();
    }
}
