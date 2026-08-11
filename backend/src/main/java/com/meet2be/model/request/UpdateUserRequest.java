package com.meet2be.model.request;

import com.meet2be.model.enums.PlanTier;
import com.meet2be.model.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Admin-only changes to another account. Null fields are left untouched. */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateUserRequest {

    /**
     * Until a payment integration exists, this is how a paid plan is actually
     * granted.
     */
    private PlanTier plan;

    private UserRole role;

    /** Null leaves the current block state untouched, same as the fields above. */
    private Boolean blocked;
}
