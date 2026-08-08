package com.meet2be.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time, idempotent data backfills for columns added after rows already
 * existed. ddl-auto:update only adds columns, it never populates them, so a
 * column added nullable (to avoid failing ALTER TABLE on non-empty tables)
 * needs its legacy rows filled in here on boot. Safe to run every startup —
 * each statement only touches rows still left at its default/NULL state.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StartupBackfillRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        int updated = jdbcTemplate.update("UPDATE event_attendees SET tag = 'ATTENDEE' WHERE tag IS NULL");
        if (updated > 0) {
            log.info("ActionLog.run : Backfilled legacy attendee rows with default tag, rowsUpdated={}", updated);
        }
    }
}
