package com.meet2be.dao.entity;

import com.meet2be.model.enums.RecipientStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * One row per attendee a campaign was dispatched to. Tracks delivery outcome
 * plus real open/click activity via the recipient's unique trackingToken,
 * which is embedded in the pixel and CTA link of the email actually sent.
 */
@Entity
@Table(name = "campaign_recipients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignRecipient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private EmailCampaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attendee_id")
    private EventAttendee attendee;

    @Column(nullable = false)
    private String emailSnapshot;

    @Column(nullable = false, unique = true)
    private String trackingToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecipientStatus status;

    @Column(nullable = false)
    private Instant sentAt;

    private Instant openedAt;

    @Column(nullable = false)
    @Builder.Default
    private int openCount = 0;

    private Instant clickedAt;

    @Column(nullable = false)
    @Builder.Default
    private int clickCount = 0;
}
