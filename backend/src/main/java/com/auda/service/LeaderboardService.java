package com.auda.service;

import com.auda.model.dto.SessionLeaderboardDto;

public interface LeaderboardService {

    SessionLeaderboardDto buildLeaderboard(Long sessionId);
}
