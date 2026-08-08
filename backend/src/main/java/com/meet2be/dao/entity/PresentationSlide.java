package com.meet2be.dao.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One rasterised page of a Presentation, stored as PNG bytes.
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
}
