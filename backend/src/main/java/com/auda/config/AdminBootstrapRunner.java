package com.auda.config;

import com.auda.dao.repository.UserRepository;
import com.auda.model.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Promotes the account named by {@code ADMIN_BOOTSTRAP_EMAIL} to ADMIN on
 * startup.
 *
 * <p>Solves the chicken-and-egg problem of the first admin: there is no signup
 * path to an admin account, and only an admin can promote anyone. Driving it
 * from an environment variable means the same mechanism works in every
 * environment without hand-editing production data.
 *
 * <p>Idempotent, and deliberately does NOT create the account — the person
 * still registers normally with their own password, so this can never mint a
 * usable login on its own. If the email has not registered yet, this logs and
 * does nothing; the next restart after they register promotes them.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrapRunner implements ApplicationRunner {

    private final UserRepository userRepository;

    @Value("${auda.admin.bootstrap-email:}")
    private String bootstrapEmail;

    @Override
    public void run(ApplicationArguments args) {
        if (bootstrapEmail == null || bootstrapEmail.isBlank()) {
            return;
        }

        userRepository.findByEmail(bootstrapEmail.trim()).ifPresentOrElse(
                user -> {
                    if (user.getRole() == UserRole.ADMIN) {
                        return;
                    }
                    user.setRole(UserRole.ADMIN);
                    userRepository.save(user);
                    log.info("ActionLog.run : Promoted bootstrap account to ADMIN, userId={}", user.getId());
                },
                () -> log.warn("ActionLog.run : ADMIN_BOOTSTRAP_EMAIL is set but no such account exists yet — "
                        + "register it, then restart to be promoted"));
    }
}
