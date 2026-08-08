package com.meet2be.dao.entity;

import com.meet2be.dao.entity.Event;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import com.meet2be.model.enums.SessionStatus;
import com.meet2be.model.enums.StageMode;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private String title;

    private String speakerName;

    private String hallName;

    private Instant startTime;

    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SessionStatus status = SessionStatus.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StageMode stageMode = StageMode.IDLE;

    @PrePersist
    void onCreate() {
        if (status == null) {
            status = SessionStatus.SCHEDULED;
        }
        if (stageMode == null) {
            stageMode = StageMode.IDLE;
        }
    }
}
