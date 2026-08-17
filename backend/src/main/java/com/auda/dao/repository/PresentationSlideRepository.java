package com.auda.dao.repository;

import com.auda.dao.entity.PresentationSlide;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PresentationSlideRepository extends JpaRepository<PresentationSlide, Long> {

    Optional<PresentationSlide> findByPresentationIdAndSlideNumber(Long presentationId, int slideNumber);

    void deleteByPresentationId(Long presentationId);
}
