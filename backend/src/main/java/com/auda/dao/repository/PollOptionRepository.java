package com.auda.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.auda.dao.entity.PollOption;

public interface PollOptionRepository extends JpaRepository<PollOption, Long> {
    List<PollOption> findByPollIdOrderByOrderIndexAsc(Long pollId);
}
