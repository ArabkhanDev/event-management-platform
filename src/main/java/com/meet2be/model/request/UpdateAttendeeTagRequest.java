package com.meet2be.model.request;

import com.meet2be.model.enums.AttendeeTag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateAttendeeTagRequest {
    private AttendeeTag tag;
}
