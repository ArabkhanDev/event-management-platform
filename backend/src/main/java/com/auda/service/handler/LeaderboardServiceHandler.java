package com.auda.service.handler;

import com.auda.dao.entity.GameAnswer;
import com.auda.dao.repository.GameAnswerRepository;
import com.auda.model.dto.LeaderboardEntryDto;
import com.auda.model.dto.SessionLeaderboardDto;
import com.auda.model.enums.GameStatus;
import com.auda.service.LeaderboardService;
import com.auda.service.SessionPlayerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Leaderboard aggregation, kept free of any dependency on GameService or
 * StageStateService: GameService needs it (to broadcast an updated leaderboard
 * after every answer) and StageStateService needs it (to show the leaderboard
 * on stage during GAME mode) — if it depended on either of those in turn, we'd
 * have a circular bean dependency. SessionPlayerService is safe to depend on
 * because it sits below both, reaching no further than its own repository.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class LeaderboardServiceHandler implements LeaderboardService {

    private static final int MAX_ENTRIES = 20;

    private final GameAnswerRepository gameAnswerRepository;
    private final SessionPlayerService sessionPlayerService;

    /**
     * Only answers to CLOSED questions count. A score that moved the instant
     * someone answered told the whole room they had got it right, before the
     * host ever revealed anything — so points are held back until the reveal
     * and the board jumps then.
     */
    @Override
    public SessionLeaderboardDto buildLeaderboard(Long sessionId) {
        Map<String, List<GameAnswer>> byPlayer = gameAnswerRepository
                .findBySessionIdAndQuestionStatus(sessionId, GameStatus.CLOSED).stream()
                .collect(Collectors.groupingBy(GameAnswer::getVoterToken));
        Map<String, String> claimedNames = sessionPlayerService.namesBySession(sessionId);

        List<LeaderboardEntryDto> entries = byPlayer.values().stream()
                .map(answers -> toEntry(answers, claimedNames))
                .sorted(Comparator.comparingInt(LeaderboardEntryDto::getTotalPoints).reversed()
                        .thenComparing(Comparator.comparingInt(LeaderboardEntryDto::getCorrectAnswers).reversed()))
                .limit(MAX_ENTRIES)
                .toList();

        return new SessionLeaderboardDto(sessionId, entries);
    }

    /**
     * The claimed name wins over the one snapshotted onto each answer: it is the
     * single row a rename updates, so the board cannot end up showing a player's
     * old name just because their most recent answer predates the change.
     * Falling back to the snapshot keeps answers from before names were claimed
     * (and any left by an older client) on the board under the name they used.
     */
    private LeaderboardEntryDto toEntry(List<GameAnswer> answers, Map<String, String> claimedNames) {
        String voterToken = answers.get(0).getVoterToken();
        int totalPoints = answers.stream().mapToInt(GameAnswer::getPointsAwarded).sum();
        int correctAnswers = (int) answers.stream().filter(GameAnswer::isCorrect).count();
        String playerName = Optional.ofNullable(claimedNames.get(voterToken))
                .or(() -> answers.stream()
                        .max(Comparator.comparing(GameAnswer::getCreatedAt))
                        .map(GameAnswer::getPlayerName)
                        .filter(name -> name != null && !name.isBlank()))
                .orElseGet(() -> "Player " + voterToken.substring(0, Math.min(4, voterToken.length())).toUpperCase());

        return new LeaderboardEntryDto(voterToken, playerName, totalPoints, correctAnswers, answers.size());
    }
}
