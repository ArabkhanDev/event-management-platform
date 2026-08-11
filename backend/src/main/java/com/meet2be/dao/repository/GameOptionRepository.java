package com.meet2be.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import com.meet2be.dao.entity.GameOption;

public interface GameOptionRepository extends JpaRepository<GameOption, Long> {
    List<GameOption> findByQuestionIdOrderByOrderIndexAsc(Long questionId);

    void deleteByQuestionId(Long questionId);
}
