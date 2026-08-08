package com.meet2be.service;

import com.meet2be.dao.entity.Poll;
import com.meet2be.model.dto.PollDto;
import com.meet2be.model.enums.PollStatus;
import com.meet2be.model.request.CreatePollRequest;

import java.util.List;

public interface PollService {

    Poll create(Long sessionId, Long requesterId, CreatePollRequest request);

    Poll setStatus(Long id, Long requesterId, PollStatus newStatus);

    PollDto vote(Long pollId, String voterToken, Long optionId);

    PollDto getResults(Long pollId);

    List<PollDto> listForSession(Long sessionId, Long requesterId);
}
