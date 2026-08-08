package com.meet2be.dao.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.meet2be.model.enums.SurveyQuestionType;

@Entity
@Table(name = "survey_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveyQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @Column(nullable = false)
    private String prompt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SurveyQuestionType type;

    /**
     * Comma-joined choice labels for SINGLE_CHOICE/DROPDOWN questions.
     * Null for RATING/TEXT types.
     */
    @Column(length = 2000)
    private String optionsCsv;

    @Column(nullable = false)
    private int orderIndex;
}
