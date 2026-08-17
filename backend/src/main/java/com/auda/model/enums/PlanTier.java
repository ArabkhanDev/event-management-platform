package com.auda.model.enums;

/**
 * What an organiser's account is allowed, priced on scale rather than module
 * access: every tier gets the full product, and tiers differ only in events
 * per year and attendees per event. See DEPLOYMENT.md / the pricing page for
 * why — gating features instead of scale made the entry tier unable to
 * demonstrate the product's core promise (keypad voting was Congress-only).
 */
public enum PlanTier {

    // -1 is the UNLIMITED sentinel (see below) — spelled out here as a literal
    // because Java forbids an enum constant from forward-referencing a static
    // field declared later in the same class.
    FREE(1, 50),
    STARTER(4, 300),
    PROFESSIONAL(15, 1500),
    ENTERPRISE(-1, -1);

    /** Sentinel rather than a nullable Integer: enums can't hold null constants cleanly. */
    public static final int UNLIMITED = -1;

    private final int eventsPerYear;
    private final int attendeesPerEvent;

    PlanTier(int eventsPerYear, int attendeesPerEvent) {
        this.eventsPerYear = eventsPerYear;
        this.attendeesPerEvent = attendeesPerEvent;
    }

    public int getEventsPerYear() {
        return eventsPerYear;
    }

    public int getAttendeesPerEvent() {
        return attendeesPerEvent;
    }

    public boolean hasUnlimitedEvents() {
        return eventsPerYear == UNLIMITED;
    }

    public boolean hasUnlimitedAttendees() {
        return attendeesPerEvent == UNLIMITED;
    }
}
