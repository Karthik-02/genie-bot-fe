# Justo Genie Iframe Embed

Use this page when embedding Justo Genie into a static website.

## Development URL

```html
<iframe
  src="http://127.0.0.1:5173/iframe.html?backendUrl=/api&brandColor=%230f4c81"
  title="Justo Genie"
  style="position:fixed;right:20px;bottom:20px;width:min(560px,calc(100vw - 40px));height:min(640px,calc(100vh - 40px));border:0;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.18);"
></iframe>
```

## Query Parameters

- `backendUrl`: backend API base URL. Use `/api` when Vite or the host proxies to `genie-bot-be`.
- `brandColor`: URL-encoded CSS color, for example `%230f4c81`.
- `welcomeMessage`: optional first message after email capture.
- `prompts`: comma-separated suggested prompts.

## Static Host Test

Run the frontend and open:

```txt
http://127.0.0.1:5173/test-embed.html
```

The iframe is responsive and keeps the widget usable on desktop and mobile viewports.

## Session Behavior

The widget asks for email before the first business question. After that, `conversationId`, `sessionId`, and visitor email are stored in local storage and sent to the backend for memory, lead tracking, and recommendation behavior.
