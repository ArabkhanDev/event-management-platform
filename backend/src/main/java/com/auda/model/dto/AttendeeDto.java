package com.auda.model.dto;

import com.auda.dao.entity.EventAttendee;
import com.auda.model.enums.AttendeeTag;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AttendeeDto {
    private Long id;
    private String email;
    private AttendeeTag tag;
    private Instant createdAt;

    public static AttendeeDto from(EventAttendee attendee) {
        return new AttendeeDto(
                attendee.getId(),
                attendee.getEmail(),
                attendee.getTag(),
                attendee.getCreatedAt()
        );
    }
}
