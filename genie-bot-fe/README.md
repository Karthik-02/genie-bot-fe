# Justo Genie Frontend

React + Vite iframe-ready chat widget for Justo Genie.

The widget is designed for Level 4 and Level 5 of the roadmap:

- floating assistant button
- animated chat panel
- streaming `/stream` integration
- thinking states
- suggested prompts
- source references
- grounded recommendation cards from backend Level 9 metadata
- local conversation/session IDs
- visitor email capture for backend lead metadata
- iframe entry point
- email-first session flow

## Setup

```bash
npm install
cp .env.example .env
```

Default `.env`:

```env
VITE_BACKEND_URL=/api
VITE_PROXY_TARGET=http://127.0.0.1:8080
```

When using Vite dev server, browser calls to `/api` are proxied to `VITE_PROXY_TARGET`.

## Run

Start the backend first from `../genie-bot-be`.

Then start the frontend:

```bash
npm run dev
```

Open:

```txt
http://127.0.0.1:5173
```

Iframe widget route:

```txt
http://127.0.0.1:5173/iframe.html
```

Static host test page:

```txt
http://127.0.0.1:5173/test-embed.html
```

Example iframe with config:

```txt
http://127.0.0.1:5173/iframe.html?backendUrl=/api&brandColor=%230f4c81&welcomeMessage=Hi%20from%20Justo%20Genie
```

## Build

```bash
npm run build
```

## Backend Contract

The frontend integrates with:

- `POST /stream` for streaming chat
- `POST /chat` as a non-streaming backend capability
- `GET /health` for backend verification outside the widget

See `../genie-bot-be/apidoc.md` for the full API contract.

See [embed.md](embed.md) for the iframe embed snippet and configuration options.

## Notes

- `conversationId` and `sessionId` are stored in `localStorage`.
- Email is required at the beginning of a new widget session, then sent as `metadata.visitor.email` on all backend requests.
- The visible lead form is disabled; lead capture runs through chat metadata and backend persistence instead.
- Level 10 iframe configuration supports `backendUrl`, `brandColor`, `welcomeMessage`, and comma-separated `prompts` query parameters.
