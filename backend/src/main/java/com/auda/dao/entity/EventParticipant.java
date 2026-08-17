package com.auda.dao.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One row per distinct browser that has joined an event, used only to count
 * against the owner's attendee cap.
 *
 * <p>Deliberately separate from {@link EventAttendee}: that table only gains a
 * row when someone voluntarily leaves an email at /join, so it undercounts —
 * most attendees never do. This table gets a row for every join, email or not,
 * because capacity has to reflect who is actually in the room.
 *
 * <p>The cap this backs is fair-use, not a security boundary: voterToken is a
 * client-generated UUID an attendee can regenerate by clearing storage. The
 * same caveat applies to every voterToken-keyed count in this codebase (poll
 * dedup, game answers) — good enough to stop a plan being trivially exceeded
 * by ordinary use, not proof against someone deliberately working around it.
 */
@Entity
@Table(
        name = "event_participants",
        uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "voter_token"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "voter_token", nullable = false)
    private String voterToken;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
