package com.meet2be.dao.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * surveyId is denormalized (duplicated from survey.id) purely so the
 * (survey_id, voter_token) unique constraint can reference a direct column,
 * matching the same pattern used by PollVote. Since the denormalized column
 * needs the name "survey_id" for the unique constraint, the @ManyToOne join
 * column is renamed to "survey_ref_id" to avoid a naming collision.
 */
@Entity
@Table(name = "survey_responses", uniqueConstraints = @UniqueConstraint(columnNames = {"survey_id", "voter_token"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveyResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_ref_id", nullable = false)
    private Survey survey;

    @Column(name = "survey_id", nullable = false)
    private Long surveyId;

    @Column(name = "voter_token", nullable = false)
    private String voterToken;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
