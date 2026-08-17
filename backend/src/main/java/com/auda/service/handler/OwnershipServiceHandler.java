package com.auda.service.handler;

import com.auda.dao.entity.Event;
import com.auda.dao.entity.User;
import com.auda.dao.repository.UserRepository;
import com.auda.exception.ApiException;
import com.auda.model.enums.UserRole;
import com.auda.service.OwnershipService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OwnershipServiceHandler implements OwnershipService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public void requireOwnerOrAdmin(Event event, Long requesterId) {
        if (event.getOwner().getId().equals(requesterId)) {
            return;
        }

        // Only reached when the ownership check already failed, so ordinary
        // requests never pay for this lookup. Read live rather than from the
        // JWT so promoting someone to admin takes effect immediately instead
        // of after their next login.
        if (isAdmin(requesterId)) {
            log.info("ActionLog.requireOwnerOrAdmin : Admin acting on another account's event, "
                            + "adminId={}, eventId={}, ownerId={}",
                    requesterId, event.getId(), event.getOwner().getId());
            return;
        }

        throw ApiException.forbidden("error.event.notOwner");
    }

    @Override
    @Transactional(readOnly = true)
    public User requireAdmin(Long requesterId) {
        User user = userRepository.findById(requesterId)
                .orElseThrow(() -> ApiException.notFound("error.user.notFound"));

        if (user.getRole() != UserRole.ADMIN) {
            log.warn("ActionLog.requireAdmin : Rejected non-admin access to the admin API, userId={}", requesterId);
            throw ApiException.forbidden("error.admin.forbidden");
        }

        return user;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isAdmin(Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getRole() == UserRole.ADMIN)
                .orElse(false);
    }
}
