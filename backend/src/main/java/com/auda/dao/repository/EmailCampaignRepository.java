package com.auda.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.auda.dao.entity.EmailCampaign;

public interface EmailCampaignRepository extends JpaRepository<EmailCampaign, Long> {
    List<EmailCampaign> findByEventIdOrderByCreatedAtDesc(Long eventId);
}
