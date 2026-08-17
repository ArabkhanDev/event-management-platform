package com.auda.dao.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "game_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private GameQuestion question;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private boolean correct;

    @Column(nullable = false)
    private int orderIndex;
}
