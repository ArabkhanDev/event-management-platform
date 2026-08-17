package com.auda.dao.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

/**
 * One rasterised page of a Presentation, stored as encoded image bytes.
 *
 * <p>The image is a plain {@code byte[]} rather than {@code @Lob} on purpose:
 * under Hibernate 6 + PostgreSQL a plain byte array maps to {@code bytea},
 * whereas {@code @Lob} maps to an {@code oid} large object that needs its own
 * lifecycle management and breaks on a read-only transaction.
 */
@Entity
@Table(
        name = "presentation_slides",
        uniqueConstraints = @UniqueConstraint(columnNames = {"presentation_id", "slide_number"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PresentationSlide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "presentation_id", nullable = false)
    private Presentation presentation;

    @Column(name = "slide_number", nullable = false)
    private int slideNumber;

    @Column(name = "image_data", nullable = false)
    private byte[] imageData;

    /**
     * Encoding actually chosen for this slide — PNG for text and vector art,
     * JPEG for photographic pages. Picked per slide by measuring both, so it
     * varies within a single deck and cannot be inferred from the deck alone.
     *
     * <p>Nullable at the DB level with a default rather than {@code nullable =
     * false}: every row written before this column existed is PNG, and under
     * {@code ddl-auto: update} a NOT NULL addition against a populated table is
     * what crashed startup twice already. Readers treat null as PNG, which is
     * correct for exactly those legacy rows. See the note on {@code User.plan}.
     */
    @Column(name = "content_type", length = 30)
    @ColumnDefault("'image/png'")
    @Builder.Default
    private String contentType = "image/png";
}
