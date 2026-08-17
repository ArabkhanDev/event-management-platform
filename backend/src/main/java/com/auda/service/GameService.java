package com.auda.service;

import com.auda.dao.entity.GameQuestion;
import com.auda.model.dto.GameQuestionDto;
import com.auda.model.dto.SessionLeaderboardDto;
import com.auda.model.enums.GameStatus;
import com.auda.model.request.CreateGameQuestionRequest;

import java.util.List;

public interface GameService {

    GameQuestion create(Long sessionId, Long requesterId, CreateGameQuestionRequest request);

    GameQuestion setStatus(Long id, Long requesterId, GameStatus newStatus);

    GameQuestionDto answer(Long questionId, String voterToken, Long optionId, String playerName);

    /**
     * Removes a question with its options and every answer given to it. Points
     * earned on that question leave the leaderboard with it.
     */
    void delete(Long id, Long requesterId);

    GameQuestionDto getResults(Long questionId);

    List<GameQuestionDto> listForSession(Long sessionId, Long requesterId);

    SessionLeaderboardDto getLeaderboard(Long sessionId);

    GameQuestionDto getActiveForSession(Long sessionId);
}
