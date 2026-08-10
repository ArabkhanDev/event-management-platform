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
import com.meet2be.service.AdminService;
import com.meet2be.service.OwnershipService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceHandler implements AdminService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final SessionRepository sessionRepository;
    private final OwnershipService ownershipService;

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserDto> listUsers(Long requesterId) {
        ownershipService.requireAdmin(requesterId);

        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toUserDto)
                .toList();
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

        return toUserDto(userRepository.save(target));
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
    public List<AdminEventDto> listEvents(Long requesterId) {
        ownershipService.requireAdmin(requesterId);

        return eventRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toEventDto)
                .toList();
    }

    private AdminUserDto toUserDto(User user) {
        return AdminUserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .plan(user.getPlan())
                .role(user.getRole())
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
