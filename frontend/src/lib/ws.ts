import { useEffect, useRef } from "react";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE } from "./api";

export type TopicName = "questions" | "polls" | "game" | "stage" | "presentation";

const TOPIC_PATHS: Record<TopicName, (sessionId: string) => string> = {
  questions: (sessionId) => `/topic/session/${sessionId}/questions`,
  polls: (sessionId) => `/topic/session/${sessionId}/polls`,
  game: (sessionId) => `/topic/session/${sessionId}/game`,
  stage: (sessionId) => `/topic/session/${sessionId}/stage`,
  presentation: (sessionId) => `/topic/session/${sessionId}/presentation`,
};

function wsBaseUrl(): string {
  // API_BASE is like "http://localhost:8080/api" — the ws endpoint lives at
  // the server root, so strip a trailing /api if present.
  const trimmed = API_BASE.replace(/\/api\/?$/, "");
  return `${trimmed}/ws`;
}

/**
 * Opens a single STOMP-over-SockJS connection for a session route and
 * subscribes to the requested topics. Every frame body is parsed as JSON
 * `{ type, payload }` and handed to onMessage along with the topic name it
 * arrived on. Reconnects automatically on drop; cleans up on unmount or when
 * sessionId/topics change.
 */
export function useSessionSocket(
  sessionId: string | undefined,
  topics: TopicName[],
  onMessage: (topic: TopicName, type: string, payload: unknown) => void
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const topicsKey = topics.join(",");

  useEffect(() => {
    if (!sessionId || topics.length === 0) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsBaseUrl()) as unknown as WebSocket,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    const subscriptions: StompSubscription[] = [];

    client.onConnect = () => {
      for (const topic of topics) {
        const dest = TOPIC_PATHS[topic](sessionId);
        const sub = client.subscribe(dest, (message: IMessage) => {
          try {
            const frame = JSON.parse(message.body) as { type: string; payload: unknown };
            onMessageRef.current(topic, frame.type, frame.payload);
          } catch {
            // ignore malformed frames
          }
        });
        subscriptions.push(sub);
      }
    };

    client.activate();

    return () => {
      subscriptions.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch {
          // no-op — connection may already be closed
        }
      });
      client.deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, topicsKey]);
}
