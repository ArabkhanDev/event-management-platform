package com.auda.model.constants;

public final class WsMessageType {
    public static final String QUESTION_CREATED = "QUESTION_CREATED";
    public static final String QUESTION_UPDATED = "QUESTION_UPDATED";
    public static final String POLL_UPDATED = "POLL_UPDATED";
    public static final String GAME_QUESTION_UPDATED = "GAME_QUESTION_UPDATED";
    public static final String GAME_QUESTION_DELETED = "GAME_QUESTION_DELETED";
    public static final String LEADERBOARD_UPDATED = "LEADERBOARD_UPDATED";
    public static final String STAGE_STATE = "STAGE_STATE";
    public static final String PRESENTATION_UPDATED = "PRESENTATION_UPDATED";

    private WsMessageType() {
    }
}
