package com.meet2be.model.dto;

import com.meet2be.dao.entity.User;
import com.meet2be.model.enums.PlanTier;
import com.meet2be.model.enums.UserRole;
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
