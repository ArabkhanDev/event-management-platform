package com.meet2be.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EventBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastQuestions(Long sessionId, Object payload) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/questions", payload);
    }

    public void broadcastPolls(Long sessionId, Object payload) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/polls", payload);
    }

    public void broadcastStage(Long sessionId, Object payload) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/stage", payload);
    }

    public void broadcastGame(Long sessionId, Object payload) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/game", payload);
    }

    public void broadcastPresentation(Long sessionId, Object payload) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/presentation", payload);
    }
}
