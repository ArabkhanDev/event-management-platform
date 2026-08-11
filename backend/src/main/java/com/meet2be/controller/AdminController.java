package com.meet2be.controller;

import com.meet2be.model.dto.AdminEventDto;
import com.meet2be.model.dto.AdminUserDto;
import com.meet2be.model.request.UpdateUserRequest;
import com.meet2be.model.response.PageResponse;
import com.meet2be.service.AdminService;
import com.meet2be.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Every method is guarded inside AdminService rather than here, so the ADMIN
 * check lives with the business rule and cannot be bypassed by another caller
 * reaching the service directly.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<PageResponse<AdminUserDto>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.listUsers(CurrentUser.id(), page, size));
    }

    @PatchMapping("/users/{id}")
    public ResponseEntity<AdminUserDto> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(adminService.updateUser(id, CurrentUser.id(), request));
    }

    @GetMapping("/events")
    public ResponseEntity<PageResponse<AdminEventDto>> listEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.listEvents(CurrentUser.id(), page, size));
    }
}
