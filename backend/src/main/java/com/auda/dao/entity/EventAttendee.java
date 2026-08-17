package com.auda.dao.entity;

import com.auda.dao.entity.Event;
import com.auda.model.enums.AttendeeTag;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * An optional email capture for an anonymous attendee, scoped to one Event.
 * Attendees never register — this row only exists when someone voluntarily
 * left an email at /join, keyed by their existing voterToken so re-joining
 * updates rather than duplicates the row.
 */
@Entity
@Table(name = "event_attendees", uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "voter_token"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventAttendee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "voter_token", nullable = false)
    private String voterToken;

    private String email;

    /**
     * Nullable at the DB level so adding this column never fails an ALTER TABLE
     * against pre-existing rows under ddl-auto:update (no default clause is
     * emitted). Always non-null in practice: PrePersist defaults it on create,
     * and StartupBackfillRunner backfills any legacy rows left over from before
     * this column existed.
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AttendeeTag tag = AttendeeTag.ATTENDEE;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        if (tag == null) {
            tag = AttendeeTag.ATTENDEE;
        }
    }
}
