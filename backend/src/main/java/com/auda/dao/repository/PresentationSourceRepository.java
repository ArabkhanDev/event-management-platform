package com.auda.dao.repository;

import com.auda.dao.entity.PresentationSource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PresentationSourceRepository extends JpaRepository<PresentationSource, Long> {

    Optional<PresentationSource> findByPresentationId(Long presentationId);

    boolean existsByPresentationId(Long presentationId);

    void deleteByPresentationId(Long presentationId);
}
