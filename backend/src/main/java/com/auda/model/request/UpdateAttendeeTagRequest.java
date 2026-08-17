package com.auda.model.request;

import com.auda.model.enums.AttendeeTag;
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
