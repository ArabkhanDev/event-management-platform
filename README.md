# meet2be-backend

Spring Boot 3.3.4 / Java 21 backend for the meet2be.com clone: event management,
live Q&A, keypad polling, surveys, and a live stage-screen state broadcast over
WebSocket (STOMP/SockJS).

## 1. Start local PostgreSQL

This spins up a Postgres container with a database, user, and password matching
the `application.yml` defaults (`meet2be` / `meet2be` / `meet2be`):

```bash
docker run --name meet2be-postgres \
  -e POSTGRES_DB=meet2be \
  -e POSTGRES_USER=meet2be \
  -e POSTGRES_PASSWORD=meet2be \
  -p 5432:5432 \
  -d postgres:16
```

Tables are created/updated automatically on startup (`ddl-auto: update`) — no
migration step is required.

## 2. Run the app

```bash
./gradlew bootRun
```

The API listens on `http://localhost:8080`. Override datasource/JWT/CORS
settings via env vars if needed: `DB_URL`, `DB_USER`, `DB_PASSWORD`,
`JWT_SECRET`, `JWT_EXPIRATION_MS`, `CORS_ORIGINS` (comma-separated origins,
defaults to `http://localhost:5173`).

## 3. Try it out

Register a user and capture the JWT:

```bash
curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"hunter22"}'
```

Log in:

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"hunter22"}'
```

Use the returned `token` for authenticated calls:

```bash
curl -s -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Annual Conference","description":"Our flagship event"}'
```

## WebSocket

Connect with STOMP/SockJS at `/ws`. Server pushes (no client publishing is
required) land on:

- `/topic/session/{sessionId}/questions` — `QUESTION_CREATED` / `QUESTION_UPDATED`
- `/topic/session/{sessionId}/polls` — `POLL_UPDATED`
- `/topic/session/{sessionId}/stage` — `STAGE_STATE` (full snapshot: current
  stage mode, the on-screen question if any, the active poll if any)
