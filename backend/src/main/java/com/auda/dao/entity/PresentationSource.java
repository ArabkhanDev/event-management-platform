package com.auda.dao.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * The uploaded PDF, kept so a deck can be offered for download later.
 *
 * <p>Deliberately its own table rather than a column on {@link Presentation}:
 * presentations are listed and polled constantly, and a multi-megabyte payload
 * hanging off that row invites accidental loading. Same reasoning as
 * {@link PresentationSlide}.
 *
 * <p>Retention is unconditional — the download flag only controls exposure.
 * A source discarded at upload time cannot be recovered later.
 */
@Entity
@Table(name = "presentation_sources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PresentationSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "presentation_id", nullable = false, unique = true)
    private Presentation presentation;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "file_data", nullable = false)
    private byte[] fileData;
}
