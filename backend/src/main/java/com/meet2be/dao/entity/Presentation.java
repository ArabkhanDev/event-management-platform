package com.meet2be.dao.entity;

import com.meet2be.model.enums.PresentationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

/**
 * An uploaded slide deck for one Session. The PDF is rasterised once at upload
 * time into PresentationSlide rows, so serving a slide never re-parses the
 * original file.
 */
@Entity
@Table(name = "presentations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Presentation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false)
    private int slideCount;

    /**
     * 1-based index of the slide currently pushed to attendees. Always within
     * [1, slideCount] once the deck has at least one slide.
     */
    @Column(nullable = false)
    @Builder.Default
    private int currentSlide = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PresentationStatus status = PresentationStatus.DRAFT;

    /**
     * Whether attendees may download the original file. Off by default: slides
     * belong to the speaker, and uploading a deck to drive a room is not the
     * same as agreeing to hand it out.
     *
     * <p>Nullable at the DB level, not {@code nullable = false}: see the note
     * on {@code User.plan} for why combining a NOT NULL constraint with
     * {@code ddl-auto: update} is fragile across boots on a populated table.
     * {@code boolean} (not {@code Boolean}) means the field itself can never
     * hold a Java null regardless of what the relaxed DB constraint allows.
     */
    @Column(name = "download_enabled")
    @ColumnDefault("false")
    @Builder.Default
    private boolean downloadEnabled = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        if (status == null) {
            status = PresentationStatus.DRAFT;
        }
        if (currentSlide < 1) {
            currentSlide = 1;
        }
    }
}
