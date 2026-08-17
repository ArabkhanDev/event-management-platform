package com.auda.service.handler;

import com.auda.dao.entity.SessionPlayer;
import com.auda.dao.repository.SessionPlayerRepository;
import com.auda.exception.ApiException;
import com.auda.model.dto.SessionPlayerDto;
import com.auda.service.SessionAccessService;
import com.auda.service.SessionPlayerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SessionPlayerServiceHandler implements SessionPlayerService {

    /** Stable code so the attendee app can single out "pick another name". */
    public static final String NAME_TAKEN_CODE = "PLAYER_NAME_TAKEN";

    private static final int MIN_LENGTH = 2;
    /** Well inside the column's 60, leaving room for a leaderboard row to stay readable. */
    private static final int MAX_LENGTH = 40;

    private final SessionPlayerRepository sessionPlayerRepository;
    private final SessionAccessService sessionAccessService;

    @Override
    public SessionPlayerDto claim(Long sessionId, String voterToken, String name) {
        if (voterToken == null || voterToken.isBlank()) {
            throw ApiException.badRequest("error.common.voterTokenRequired");
        }
        sessionAccessService.requireInteractive(sessionId);

        var displayName = normalise(name);
        var nameLower = displayName.toLowerCase(Locale.ROOT);

        var existing = sessionPlayerRepository.findBySessionIdAndVoterToken(sessionId, voterToken).orElse(null);

        // Re-claiming a name you already hold has to succeed: the attendee app
        // revalidates its remembered name every time the game tab opens, and a
        // second visit must not read as a collision with your own first one.
        if (existing != null && existing.getNameLower().equals(nameLower)) {
            existing.setDisplayName(displayName);
            return toDto(sessionPlayerRepository.save(existing));
        }

        requireNameAvailable(sessionId, voterToken, nameLower);

        var player = existing != null ? existing : newPlayer(sessionId, voterToken);
        player.setDisplayName(displayName);
        player.setNameLower(nameLower);

        return toDto(persist(player, sessionId));
    }

    @Override
    @Transactional(readOnly = true)
    public String findClaimedName(Long sessionId, String voterToken) {
        if (voterToken == null || voterToken.isBlank()) {
            return null;
        }
        return sessionPlayerRepository.findBySessionIdAndVoterToken(sessionId, voterToken)
                .map(SessionPlayer::getDisplayName)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> namesBySession(Long sessionId) {
        return sessionPlayerRepository.findBySessionId(sessionId).stream()
                .collect(Collectors.toMap(SessionPlayer::getVoterToken, SessionPlayer::getDisplayName,
                        (first, second) -> first));
    }

    private void requireNameAvailable(Long sessionId, String voterToken, String nameLower) {
        sessionPlayerRepository.findBySessionIdAndNameLower(sessionId, nameLower)
                .filter(other -> !other.getVoterToken().equals(voterToken))
                .ifPresent(other -> {
                    throw nameTaken();
                });
    }

    private SessionPlayer persist(SessionPlayer player, Long sessionId) {
        try {
            // Flushed here rather than at commit so the unique constraint — the
            // only thing standing between two attendees who hit submit on the
            // same name at the same moment — fails inside this try, not on the
            // way out of the transaction where it would surface as a 500.
            var saved = sessionPlayerRepository.saveAndFlush(player);
            log.info("ActionLog.claim : Player name claimed successfully, sessionId={}, playerId={}",
                    sessionId, saved.getId());
            return saved;
        } catch (DataIntegrityViolationException e) {
            log.info("ActionLog.claim : Player name collision, sessionId={}", sessionId);
            throw nameTaken();
        }
    }

    private SessionPlayer newPlayer(Long sessionId, String voterToken) {
        return SessionPlayer.builder()
                .sessionId(sessionId)
                .voterToken(voterToken)
                .build();
    }

    private ApiException nameTaken() {
        return ApiException.of(HttpStatus.CONFLICT, NAME_TAKEN_CODE, "error.game.playerNameTaken");
    }

    /** Trims, collapses runs of whitespace, and enforces the length bounds. */
    private String normalise(String name) {
        if (name == null || name.isBlank()) {
            throw ApiException.badRequest("error.game.playerNameRequired");
        }

        var collapsed = name.trim().replaceAll("\\s+", " ");
        if (collapsed.length() < MIN_LENGTH) {
            throw ApiException.badRequest("error.game.playerNameTooShort", MIN_LENGTH);
        }
        if (collapsed.length() > MAX_LENGTH) {
            throw ApiException.badRequest("error.game.playerNameTooLong", MAX_LENGTH);
        }

        return collapsed;
    }

    private SessionPlayerDto toDto(SessionPlayer player) {
        return new SessionPlayerDto(player.getSessionId(), player.getDisplayName());
    }
}
