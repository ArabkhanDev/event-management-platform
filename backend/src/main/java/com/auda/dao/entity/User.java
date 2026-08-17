package com.auda.dao.entity;

import com.auda.model.enums.PlanTier;
import com.auda.model.enums.UserRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    /**
     * Nullable at the DB level on purpose, even though the app never persists
     * a null: {@code ddl-auto: update} cannot express "add column, backfill
     * existing rows, then tighten to NOT NULL" as three ordered steps — on
     * every boot it emits one ALTER for whatever mismatch it currently sees
     * against the entity, and packing a DEFAULT into a type-only ALTER
     * COLUMN ... SET DATA TYPE is not valid Postgres syntax (which is exactly
     * what crashed startup here: "syntax error at or near default"). A plain
     * {@code nullable = false} would trade that for a different failure mode
     * the moment ddl-auto decides to emit SET NOT NULL against a row it
     * doesn't know is already backfilled. Relying on nullable + the DB
     * default (via {@link ColumnDefault}, kept separate from the type so it
     * can never be fused into a broken ALTER) plus the {@code @PrePersist}
     * fallback below is what stays correct regardless of the column's exact
     * prior state — this is a `ddl-auto: update` limitation, not a one-off;
     * see DEPLOYMENT.md's note on replacing it with Flyway.
     *
     * <p>No self-serve upgrade path exists yet — every account starts and
     * stays FREE until a payment integration lands. Changing an account's tier
     * today is a manual database update.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @ColumnDefault("'FREE'")
    @Builder.Default
    private PlanTier plan = PlanTier.FREE;

    /** Same reasoning as {@link #plan} — see the note above it. */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @ColumnDefault("'USER'")
    @Builder.Default
    private UserRole role = UserRole.USER;

    /**
     * Defaulted to {@code true} at the DB level, not {@code false}, so that
     * {@code ADD COLUMN} backfills every account that registered before email
     * verification existed as already-verified — otherwise this migration
     * would lock every existing user out at their next login. New
     * registrations override this explicitly to {@code false} in
     * AuthServiceHandler; the {@code @Builder.Default} below only covers a
     * caller that forgets to set it.
     */
    @Column(nullable = false)
    @ColumnDefault("true")
    @Builder.Default
    private boolean emailVerified = false;

    @Column(name = "verification_token", length = 64)
    private String verificationToken;

    @Column(name = "verification_token_expires_at")
    private Instant verificationTokenExpiresAt;

    @Column(name = "reset_token", length = 64)
    private String resetToken;

    @Column(name = "reset_token_expires_at")
    private Instant resetTokenExpiresAt;

    /**
     * Admin-only kill switch, checked at login and on every authenticated
     * request thereafter (see JwtAuthFilter) — a JWT stays valid for up to
     * seven days, so a login-only check would let a block take up to a week
     * to actually take effect. Defaults to {@code false} on both the Java
     * side and the DB backfill: unlike {@code emailVerified}, the safe
     * direction for an existing row here is "not blocked".
     */
    @Column(nullable = false)
    @ColumnDefault("false")
    @Builder.Default
    private boolean blocked = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        if (plan == null) {
            plan = PlanTier.FREE;
        }
        if (role == null) {
            role = UserRole.USER;
        }
    }
}
