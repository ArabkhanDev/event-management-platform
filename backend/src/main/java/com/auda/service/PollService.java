package com.auda.service;

import com.auda.dao.entity.Poll;
import com.auda.model.dto.PollDto;
import com.auda.model.enums.PollStatus;
import com.auda.model.request.CreatePollRequest;

import java.util.List;

public interface PollService {

    Poll create(Long sessionId, Long requesterId, CreatePollRequest request);

    Poll setStatus(Long id, Long requesterId, PollStatus newStatus);

    PollDto vote(Long pollId, String voterToken, Long optionId);

    PollDto getResults(Long pollId);

    List<PollDto> listForSession(Long sessionId, Long requesterId);
}
