package com.auda.dao.repository;

import com.auda.dao.entity.CampaignRecipient;
import com.auda.model.enums.RecipientStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CampaignRecipientRepository extends JpaRepository<CampaignRecipient, Long> {
    Optional<CampaignRecipient> findByTrackingToken(String trackingToken);

    long countByCampaignId(Long campaignId);

    long countByCampaignIdAndStatus(Long campaignId, RecipientStatus status);

    long countByCampaignIdAndOpenedAtIsNotNull(Long campaignId);

    long countByCampaignIdAndClickedAtIsNotNull(Long campaignId);
}
