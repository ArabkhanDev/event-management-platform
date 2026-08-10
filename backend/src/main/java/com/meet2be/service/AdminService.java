package com.meet2be.service;

import com.meet2be.model.dto.AdminEventDto;
import com.meet2be.model.dto.AdminUserDto;
import com.meet2be.model.request.UpdateUserRequest;

import java.util.List;

/**
 * Cross-account support surface. Every method re-checks the caller's ADMIN
 * role against the database rather than trusting the JWT, so revoking admin
 * takes effect immediately instead of at the next login.
 */
public interface AdminService {

    List<AdminUserDto> listUsers(Long requesterId);

    AdminUserDto updateUser(Long targetUserId, Long requesterId, UpdateUserRequest request);

    List<AdminEventDto> listEvents(Long requesterId);
}
