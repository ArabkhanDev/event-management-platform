package com.meet2be.dao.repository;

import com.meet2be.dao.entity.CampaignRecipient;
import com.meet2be.model.enums.RecipientStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CampaignRecipientRepository extends JpaRepository<CampaignRecipient, Long> {
    Optional<CampaignRecipient> findByTrackingToken(String trackingToken);

    long countByCampaignId(Long campaignId);

    long countByCampaignIdAndStatus(Long campaignId, RecipientStatus status);

    long countByCampaignIdAndOpenedAtIsNotNull(Long campaignId);

    long countByCampaignIdAndClickedAtIsNotNull(Long campaignId);
}
