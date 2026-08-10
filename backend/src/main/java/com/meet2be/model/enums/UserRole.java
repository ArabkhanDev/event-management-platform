package com.meet2be.model.enums;

/**
 * Platform-level role. Deliberately not the same axis as event ownership:
 * every organiser owns their own events regardless of role, and ADMIN only
 * adds the ability to act on events owned by someone else.
 */
public enum UserRole {

    USER,

    /** Platform operator: may view and edit any account's events and sessions. */
    ADMIN
}
