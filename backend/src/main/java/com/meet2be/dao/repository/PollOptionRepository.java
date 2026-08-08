package com.meet2be.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.meet2be.dao.entity.PollOption;

public interface PollOptionRepository extends JpaRepository<PollOption, Long> {
    List<PollOption> findByPollIdOrderByOrderIndexAsc(Long pollId);
}
