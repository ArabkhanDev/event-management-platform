package com.meet2be.service.handler;

import com.meet2be.dao.entity.GameAnswer;
import com.meet2be.dao.repository.GameAnswerRepository;
import com.meet2be.model.dto.LeaderboardEntryDto;
import com.meet2be.model.dto.SessionLeaderboardDto;
import com.meet2be.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Pure leaderboard aggregation, kept as a leaf component with no dependency on
 * GameService or StageStateService: GameService needs it (to broadcast an
 * updated leaderboard after every answer) and StageStateService needs it (to
 * show the leaderboard on stage during GAME mode) — if it depended on either
 * of those in turn, we'd have a circular bean dependency.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class LeaderboardServiceHandler implements LeaderboardService {

    private static final int MAX_ENTRIES = 20;

    private final GameAnswerRepository gameAnswerRepository;

    @Override
    public SessionLeaderboardDto buildLeaderboard(Long sessionId) {
        Map<String, List<GameAnswer>> byPlayer = gameAnswerRepository.findBySessionId(sessionId).stream()
                .collect(Collectors.groupingBy(GameAnswer::getVoterToken));

        List<LeaderboardEntryDto> entries = byPlayer.values().stream()
                .map(this::toEntry)
                .sorted(Comparator.comparingInt(LeaderboardEntryDto::getTotalPoints).reversed()
                        .thenComparing(Comparator.comparingInt(LeaderboardEntryDto::getCorrectAnswers).reversed()))
                .limit(MAX_ENTRIES)
                .toList();

        return new SessionLeaderboardDto(sessionId, entries);
    }

    private LeaderboardEntryDto toEntry(List<GameAnswer> answers) {
        String voterToken = answers.get(0).getVoterToken();
        int totalPoints = answers.stream().mapToInt(GameAnswer::getPointsAwarded).sum();
        int correctAnswers = (int) answers.stream().filter(GameAnswer::isCorrect).count();
        String playerName = answers.stream()
                .max(Comparator.comparing(GameAnswer::getCreatedAt))
                .map(GameAnswer::getPlayerName)
                .filter(name -> name != null && !name.isBlank())
                .orElse("Player " + voterToken.substring(0, Math.min(4, voterToken.length())).toUpperCase());

        return new LeaderboardEntryDto(voterToken, playerName, totalPoints, correctAnswers, answers.size());
    }
}
