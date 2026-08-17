package com.auda.model.dto;

import com.auda.dao.entity.User;
import com.auda.model.enums.PlanTier;
import com.auda.model.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private PlanTier plan;
    private UserRole role;

    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getPlan(), user.getRole());
    }
}
