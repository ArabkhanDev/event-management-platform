package com.auda.dao.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * questionId and sessionId are denormalized (duplicated from option.question and
 * option.question.session) so the (question_id, voter_token) unique constraint can
 * reference a direct column, and so the leaderboard can be aggregated per-session
 * without joining through GameOption/GameQuestion for every row — same pattern as
 * PollVote.pollId.
 *
 * correct/pointsAwarded are snapshotted at answer time so the leaderboard reflects
 * what the player actually earned even if a question's configuration is inspected
 * later.
 */
@Entity
@Table(name = "game_answers", uniqueConstraints = @UniqueConstraint(columnNames = {"question_id", "voter_token"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_id", nullable = false)
    private GameOption option;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "voter_token", nullable = false)
    private String voterToken;

    @Column(length = 60)
    private String playerName;

    @Column(nullable = false)
    private boolean correct;

    @Column(nullable = false)
    private int pointsAwarded;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
