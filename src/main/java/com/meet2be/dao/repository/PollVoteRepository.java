package com.meet2be.dao.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.meet2be.dao.entity.PollVote;

public interface PollVoteRepository extends JpaRepository<PollVote, Long> {
    boolean existsByPollIdAndVoterToken(Long pollId, String voterToken);

    long countByOptionId(Long optionId);
}
