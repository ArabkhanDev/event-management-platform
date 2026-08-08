package com.meet2be.dao.repository;

import com.meet2be.dao.entity.Presentation;
import com.meet2be.model.enums.PresentationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PresentationRepository extends JpaRepository<Presentation, Long> {

    List<Presentation> findBySessionIdOrderByCreatedAtDesc(Long sessionId);

    Optional<Presentation> findFirstBySessionIdAndStatus(Long sessionId, PresentationStatus status);
}
