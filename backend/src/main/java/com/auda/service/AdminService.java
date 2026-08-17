package com.auda.service;

import com.auda.model.dto.AdminEventDto;
import com.auda.model.dto.AdminUserDto;
import com.auda.model.request.UpdateUserRequest;
import com.auda.model.response.PageResponse;

/**
 * Cross-account support surface. Every method re-checks the caller's ADMIN
 * role against the database rather than trusting the JWT, so revoking admin
 * takes effect immediately instead of at the next login.
 *
 * <p>The listings are paged: they grow with the whole platform rather than with
 * one organiser's data, so they are the two queries here with no natural bound.
 */
public interface AdminService {

    PageResponse<AdminUserDto> listUsers(Long requesterId, int page, int size);

    AdminUserDto updateUser(Long targetUserId, Long requesterId, UpdateUserRequest request);

    PageResponse<AdminEventDto> listEvents(Long requesterId, int page, int size);
}
