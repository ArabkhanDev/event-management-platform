# auda — frontend

React + TypeScript + Vite frontend for the auda event-engagement platform
(live Q&A, keypad voting, surveys, and stage-screen control for conferences
and congresses).

## Getting started

```bash
npm install
npm run dev
```

The dev server runs on **http://localhost:5173**.

By default the app talks to a backend at `http://localhost:8080/api` and a
WebSocket (SockJS/STOMP) endpoint at `http://localhost:8080/ws`. Override this
by setting `VITE_API_BASE` in a `.env` (or `.env.local`) file — see
`.env.example`:

```
VITE_API_BASE=http://localhost:8080/api
```

The backend (Spring Boot) is developed separately; the frontend expects it to
implement the API contract described in the project spec exactly. With no
backend running, the app still builds and renders, but any network call
(login, event/session data, Q&A, polls, surveys, WebSocket topics) will fail.

## Scripts

- `npm run dev` — start the Vite dev server (port 5173)
- `npm run build` — type-check (`tsc -b`) and build a production bundle to `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — type-check only, no emit

## Routes

- `/` — marketing landing page
- `/login`, `/register` — organizer auth
- `/dashboard` — organizer's events list + create-event form (requires login)
- `/dashboard/events/:eventId` — event detail: join code, status, sessions
- `/operator/:sessionId` — operator board: question queue, poll launcher, survey panel (requires login)
- `/stage/:sessionId` — public, chrome-less stage/projector display
- `/join` — public attendee entry point (join code → session picker)
- `/event/:sessionId` — public attendee session view (ask questions, vote, feedback)

## Notes on the API contract

A couple of spots in the given contract don't expose a way to fetch data the
UI needs, so the frontend works around them pragmatically:

- **No `GET /sessions/{id}`.** The Operator Board hydrates its header by
  calling `PATCH /sessions/{id}` with an empty body (a no-op update that
  still returns the full current `SessionDto`).
- **No endpoint to list polls/surveys for a session.** The Operator Board
  keeps polls/surveys it creates (or receives via the `polls` WebSocket
  topic) in local component state rather than fetching a list from the
  server.
- **No public endpoint for an attendee to discover an active survey or its
  question definitions.** `POST /public/surveys/{id}/responses` assumes the
  client already knows the survey's questions. As a stopgap, the attendee
  session page (`/event/:sessionId`) accepts a base64-encoded survey
  definition in a `?survey=` query parameter (`{id, title, questions}`) that
  an organizer link can include; without it, the Feedback tab is simply
  hidden. A future backend revision adding a public `GET /public/surveys/{id}`
  would remove the need for this.
