package com.auda.dao.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * pollId is denormalized (duplicated from option.poll.id) purely so the
 * (poll_id, voter_token) unique constraint can reference a direct column,
 * since a unique constraint cannot easily span through the option's FK chain.
 */
@Entity
@Table(name = "poll_votes", uniqueConstraints = @UniqueConstraint(columnNames = {"poll_id", "voter_token"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PollVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_id", nullable = false)
    private PollOption option;

    @Column(name = "poll_id", nullable = false)
    private Long pollId;

    @Column(name = "voter_token", nullable = false)
    private String voterToken;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
