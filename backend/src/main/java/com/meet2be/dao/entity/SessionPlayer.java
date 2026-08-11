package com.meet2be.dao.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * The display name an attendee claims before playing the score game, so the
 * leaderboard shows people rather than "Player A3F9".
 *
 * Names are claimed rather than sent with each answer because they must be
 * unique within a session: a claim needs a row to reserve against, and a player
 * who has not answered anything yet has no GameAnswer to hold that reservation.
 *
 * nameLower is stored alongside the display name purely to back the
 * case-insensitive unique constraint — "Ali" and "ali" are the same person to
 * anyone reading the leaderboard, and Postgres cannot enforce that through a
 * plain column constraint without a normalised column to point at.
 */
@Entity
@Table(name = "session_players", uniqueConstraints = {
        @UniqueConstraint(name = "uk_session_player_token", columnNames = {"session_id", "voter_token"}),
        @UniqueConstraint(name = "uk_session_player_name", columnNames = {"session_id", "name_lower"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionPlayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "voter_token", nullable = false)
    private String voterToken;

    @Column(name = "display_name", nullable = false, length = 60)
    private String displayName;

    @Column(name = "name_lower", nullable = false, length = 60)
    private String nameLower;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
