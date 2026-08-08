package com.meet2be.service;

import com.meet2be.model.dto.SessionLeaderboardDto;

public interface LeaderboardService {

    SessionLeaderboardDto buildLeaderboard(Long sessionId);
}
