package com.auda.dao.entity;

import com.auda.dao.entity.Event;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import com.auda.model.enums.AttendeeTag;
import com.auda.model.enums.CampaignStatus;

@Entity
@Table(name = "email_campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, length = 8000)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CampaignStatus status = CampaignStatus.DRAFT;

    /**
     * Audience segments this campaign targets. Empty means "everyone who left an email".
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "campaign_target_tags", joinColumns = @JoinColumn(name = "campaign_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "tag", nullable = false)
    @Builder.Default
    private Set<AttendeeTag> targetTags = new HashSet<>();

    private Integer recipientCount;

    private Instant sentAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        if (status == null) {
            status = CampaignStatus.DRAFT;
        }
    }
}
