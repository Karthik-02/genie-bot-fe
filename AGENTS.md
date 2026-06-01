# Justo Genie Agent Instructions

## Project Goal

Build Justo Genie as a fast, semi-autonomous enterprise AI engagement agent, not a generic chatbot. The system should answer from static Justo Global website knowledge, guide visitors toward relevant services, extract lead signals, and run as a polished iframe chat widget.

Justo Genie is a friendly AI chatbot trained on all Justo Global website content: services, industries, case studies, and the Elevate product. It answers visitor questions, engages them in a helpful business conversation, identifies their intent, guides them to the right solution, and stores visitor details plus interests as a lead in the background.

Primary business outcome:

- Visitors get instant, helpful answers 24/7 instead of leaving the site.
- Every useful conversation becomes a tracked lead.
- Sales can see who to follow up with and what each visitor cares about.

Do not treat this as a toy AI demo, PDF Q&A bot, or generic chatbot. Treat it as a low-latency enterprise engagement agent using static knowledge, proactive conversation, lead extraction, agent-like behavior, and iframe deployment.

The architecture follows three coordinated tracks:

1. `ingestion/` prepares static website knowledge.
2. `genie-bot-be/` serves the RAG, streaming, memory, and lead APIs.
3. `genie-bot-fe/` provides the embeddable React chat experience.

Optimize for speed, simple architecture, and demo reliability. Avoid unnecessary frameworks or abstractions that add latency or debugging cost.

Because the website data is static, precompute aggressively: embeddings, chunk metadata, category mapping, and summaries where useful. Runtime should stay small: query embedding, vector similarity search, compact prompt assembly, one streaming LLM generation, and persistence.

## Final Tech Stack

- Frontend: React, Vite, Framer Motion, `react-markdown`, `react-icons`.
- Backend: Node.js, Fastify.
- Chat UI: floating assistant widget with streaming text, typing animation, suggested prompts, and smooth transitions.
- UI style: Intercom + ChatGPT hybrid, not a hackathon chatbot.
- LLM option 1: Ollama with Llama 3 8B or Mistral for local/private demos.
- LLM option 2: Gemini Flash API when fastest hosted responses are preferred.
- Vector database: ChromaDB.
- Embeddings: `sentence-transformers` using `all-MiniLM-L6-v2`.
- Scraping: Cheerio + Axios.
- Database: PostgreSQL for primary persistence; SQLite only as a local fallback.

## Non-Negotiable Capabilities

- Intent classification: detect visitor intent such as education, healthcare, donor, enterprise, technology service, media/video, Elevate product interest, support, pricing, or partnership.
- Interest capture: continuously infer services/products/industries the visitor cares about and attach them to the lead.
- Email-based identity: there is no widget login, so the visitor's email is the primary user identifier across devices and sessions.
- Clarifying questions: ask one useful follow-up when the requirement is broad or ambiguous.
- Recommendation engine: suggest relevant Justo services, products, case studies, or next steps based on intent and retrieved knowledge.
- Lead extraction: store visitor details, interest, business domain, urgency, and score.
- Context memory: keep the conversation coherent without overloading the prompt.
- Streaming responses: mandatory for perceived speed.
- Thinking pipeline: optionally show `Analyzing requirement...`, `Searching relevant solutions...`, and `Preparing recommendations...` while backend work is happening.

## Current State

- `ingestion/chunks.json` already contains chunked website content.
- The next ingestion stage is embedding those chunks and storing them in ChromaDB.
- `genie-bot-be/` is the backend folder.
- `genie-bot-fe/` is the frontend folder.

## Core Architecture Flow

Static knowledge flow:

```txt
Justo website content
  -> scrape
  -> clean
  -> chunk
  -> embed with sentence-transformers/all-MiniLM-L6-v2
  -> store chunks, embeddings, and metadata in ChromaDB
```

Runtime chat flow:

```txt
Visitor message
  -> frontend iframe widget
  -> Fastify API
  -> intent/context handling
  -> query embedding
  -> ChromaDB top-K retrieval
  -> RAG prompt construction
  -> LLM streaming response
  -> lead extraction/scoring
  -> database persistence
```

Core RAG and lead flow:

```txt
User query
  -> intent detection
  -> vector search
  -> top 3-5 chunks
  -> LLM answer
  -> structured lead extraction
```

## Engineering Principles

- Keep RAG manual and explicit. Do not add LangChain unless the user specifically asks.
- Precompute everything possible because the source data is static.
- Keep runtime work minimal: query embedding, vector search, prompt assembly, one LLM call, persistence.
- Prefer clear modules over clever abstractions.
- Preserve source metadata on every chunk so answers can cite or reference the origin.
- Stream responses as early as possible; perceived latency matters.
- Treat lead extraction as part of the single response pipeline where practical.
- Keep data contracts between backend and frontend stable and documented.
- Prefer one LLM generation that produces both answer and final structured metadata instead of separate calls for intent, answer, and lead extraction.
- Optimize for speed + polish + autonomous behavior illusion rather than complex AI internals.

## Ingestion Process

Work inside `ingestion/` for scraping, cleaning, chunking, and embedding scripts.

Expected pipeline:

1. Scrape Justo website pages with Cheerio/Axios.
2. Clean raw HTML into structured text.
3. Chunk text into retrieval-sized records.
4. Generate embeddings for each chunk using `all-MiniLM-L6-v2`.
5. Store records in ChromaDB with ids, content, and metadata.
6. Re-run ingestion only when website content changes.

Embedding records should preserve:

- `id`
- `content`
- `source`
- page/category metadata when available
- section/title metadata when available

Do not mutate `chunks.json` destructively unless the chunking strategy itself changes.

## Backend Process (`genie-bot-be/`)

Use Node.js with Fastify. The backend owns retrieval, prompt construction, LLM orchestration, streaming, conversation memory, lead extraction, and persistence.

Backend documentation rules:

- Maintain `genie-bot-be/apidoc.md` for every backend API.
- Whenever an API endpoint is created, changed, or removed, update `apidoc.md` in the same work.
- Each API entry must include URL, method/type, purpose, request body or query/path parameters, response shape, streaming event format when applicable, and example request/response.
- Maintain `genie-bot-be/setup.md` with fresh setup instructions so a developer cloning from GitHub knows how to install dependencies, prepare the knowledge base, configure environment variables, and run the backend before using `npm start`.
- When backend commands, env vars, or startup requirements change, update `setup.md` in the same work.

Recommended API surface:

- `POST /chat` for normal chat requests.
- `POST /stream` or `GET /stream` for streaming responses.
- `GET /history/:conversationId` for conversation history.
- `POST /lead` for explicit lead capture forms.
- `GET /health` for service status.

Recommended backend modules:

- `server` initializes Fastify, plugins, CORS, and routes.
- `routes` defines API endpoints only.
- `services/retrieval` embeds the query and fetches top-K ChromaDB chunks.
- `services/prompt` builds compact RAG prompts with system instructions and retrieved context.
- `services/llm` wraps Gemini Flash or Ollama streaming.
- `services/memory` maintains short conversation context and summaries.
- `services/leads` extracts structured lead data and computes score.
- `db` stores chats, messages, leads, users, and analytics.
- `config` centralizes environment variables and provider selection.

Backend response behavior:

- Start streaming quickly.
- Use retrieved Justo context before general model knowledge.
- Ask clarifying questions when the visitor intent is broad or ambiguous.
- Recommend relevant Justo services, products, or case studies when confidence is high.
- Never fabricate Justo-specific claims that are not supported by retrieved context.
- Include source references in the response payload when supported by the frontend.

Identity and session rules:

- The widget has no login/authentication.
- Ask for the visitor's email when a new chat session starts, regardless of frontend, browser, or device.
- Treat email as the primary stable user identity.
- One email can have any number of chat sessions.
- One session can contain multiple intents/interests.
- One email can accumulate multiple interests across multiple sessions.
- Do not overwrite prior interests for the same email; append, merge, and update confidence/urgency over time.
- If the visitor refuses to provide email, continue helping and store the session as anonymous until an email is provided.

Lead extraction should track:

- visitor name, email, company, phone when provided
- detected intent
- industry/domain
- interested services/products as a list, not a single value
- urgency
- budget signals when available
- lead score
- conversation summary
- session-level interests
- user-level accumulated interests across all sessions for the same email

Prefer PostgreSQL for production-style persistence. SQLite is acceptable for a local demo fallback.

## Frontend Process (`genie-bot-fe/`)

Use React + Vite. The frontend is an embeddable iframe chat widget, not a full-page application by default.

The widget should provide:

- floating assistant button
- polished open/close animation
- streaming message rendering
- typing/thinking states
- suggested prompts
- source references when backend returns them
- lead capture fields for name, email, and company
- conversation memory through `conversationId`
- mobile-friendly responsive layout

On each new chat session, the widget/backend flow should prompt for email early because email is the only cross-device identity. Do not block all assistance forever if the visitor skips email, but keep asking naturally after providing value.

Recommended frontend modules:

- `components/ChatWidget` controls the embedded widget shell.
- `components/MessageList` renders conversation history.
- `components/MessageBubble` renders user/assistant messages.
- `components/SuggestedPrompts` renders quick-start questions.
- `components/LeadCapture` collects visitor details.
- `hooks/useChatStream` manages streaming API calls.
- `services/api` contains backend API clients.
- `state` or a lightweight store tracks widget state and conversation id.

Frontend UX requirements:

- Show useful progress states such as `Analyzing requirement...`, `Searching relevant solutions...`, and `Preparing recommendations...`.
- Render partial streamed tokens immediately.
- Keep the UI closer to an Intercom + ChatGPT hybrid than a basic hackathon chatbot.
- Avoid blocking the visitor with a form before they receive value.
- Ask for lead details only after intent or interest is established, unless the user volunteers them.

## Backend-Frontend Contract

Use a stable message shape similar to:

```json
{
  "conversationId": "string",
  "sessionId": "string",
  "message": "string",
  "metadata": {
    "visitor": {
      "name": "string",
      "email": "string",
      "company": "string"
    }
  }
}
```

Assistant responses should support:

```json
{
  "conversationId": "string",
  "sessionId": "string",
  "answer": "string",
  "sources": [
    {
      "id": "string",
      "source": "string",
      "title": "string"
    }
  ],
  "lead": {
    "email": "string",
    "intent": "string",
    "industry": "string",
    "sessionInterests": ["string"],
    "accumulatedInterests": ["string"],
    "urgency": "string",
    "score": 0
  },
  "suggestedQuestions": ["string"]
}
```

For streaming, send token/content events separately from final metadata. The final event should include sources, lead extraction, and suggested follow-ups.

Lead persistence should model identity separately from sessions:

- `users`: keyed by email where available.
- `sessions`: many sessions can belong to one email/user.
- `messages`: many messages belong to one session.
- `leads`: lead profile for an email/user, updated across sessions.
- `lead_interests`: multiple interests per lead, including source session, confidence, urgency, and timestamps.
- `analytics`: events tied to session and email when available.

## Prompting Rules

The backend system prompt should enforce:

- You are Justo Genie, an AI assistant for Justo Global.
- Answer using retrieved Justo context first.
- Be concise, specific, and business-oriented.
- Ask one clarifying question when needed.
- Recommend relevant Justo services when the query maps clearly to an offering.
- Capture lead intent naturally; do not sound like a form.
- Do not invent case studies, prices, timelines, or guarantees.

Keep RAG context small: use top 3-5 chunks unless there is a clear reason to include more.

## Performance Targets

Aim for:

- intent/context handling under 50 ms
- vector search under 100 ms
- LLM first token under 1 second when provider allows it
- immediate frontend streaming once backend generation starts

Avoid separate LLM calls for intent, answer generation, and lead extraction unless quality requires it. Prefer one generation path plus structured final metadata.

## Implementation Roadmap

Complete the project in levels. Do not skip foundational levels unless they already exist and are verified.

### Level 1: Knowledge Base Ready

- Validate `ingestion/chunks.json` structure: `id`, `source`, and `content`.
- Add an embedding script in `ingestion/`.
- Generate embeddings with `sentence-transformers/all-MiniLM-L6-v2`.
- Store chunks, embeddings, and metadata into ChromaDB.
- Add a semantic search smoke test.
- Completion target: user query -> query embedding -> ChromaDB top chunks.

### Level 2: Basic Backend RAG

- Scaffold `genie-bot-be/` with Node.js + Fastify.
- Add centralized environment config.
- Add `GET /health`.
- Add `POST /chat`.
- Connect backend retrieval to ChromaDB.
- Convert user query into an embedding.
- Retrieve top 3-5 chunks.
- Build a compact RAG prompt.
- Send the prompt to Gemini Flash or Ollama.
- Completion target: `POST /chat` -> retrieve chunks -> LLM answer.

### Level 3: Streaming Backend

- Add `POST /stream` for streaming chat.
- Stream LLM tokens to the client as soon as possible.
- Send final metadata after streaming completes.
- Include sources, detected intent, lead signals, and suggested follow-up questions in the final event.
- Handle provider, retrieval, and network errors with graceful responses.
- Completion target: visitor asks -> backend streams answer token by token.

### Level 4: Basic Frontend Widget

- Scaffold `genie-bot-fe/` with React + Vite.
- Build the floating assistant button.
- Build the chat panel.
- Build message list and message bubbles.
- Build the input box.
- Connect to backend `/chat` first.
- Display assistant responses and basic errors.
- Completion target: visitor opens widget -> sends message -> sees AI answer.

### Level 5: Streaming Frontend UX

- Connect the widget to `/stream`.
- Render partial tokens immediately.
- Add typing and thinking states.
- Add suggested prompts.
- Add source references when returned by backend.
- Keep layout stable during streaming.
- Completion target: frontend feels fast, polished, and responsive.

### Level 6: Conversation Memory

- Generate and persist `conversationId`.
- Generate a unique `sessionId` for every new widget chat session.
- Ask for email at the start of a new session because there is no login.
- Link the session to the existing user/lead when the same email is provided.
- Store recent messages per conversation.
- Include short conversation context in the prompt.
- Summarize longer conversations when needed.
- Avoid sending unnecessary history to the LLM.
- Completion target: Justo Genie remembers the current conversation.

### Level 7: Intent And Lead Extraction

- Detect intent continuously from messages and conversation context.
- Extract lead signals: name, email, company, phone, intent, industry, interested services/products, urgency, budget signals, and score.
- Store inferred interests even when the visitor does not fill a form.
- Use email as the only stable identity for known visitors.
- Allow the same email/user to have unlimited sessions.
- Allow each session to contain multiple intents/interests.
- Accumulate interests across all sessions for the same email instead of replacing earlier lead data.
- Store each interest with source session, confidence, urgency, and last-mentioned timestamp.
- Add explicit lead capture flow only after value is delivered or when the visitor volunteers details.
- Prefer final structured metadata from the same LLM response pipeline.
- Completion target: every useful conversation becomes a tracked lead with clear interests.

### Level 8: Database Persistence

- Add PostgreSQL persistence.
- Use SQLite only as a local fallback when PostgreSQL is unavailable.
- Store users keyed by email, sessions, conversations, messages, leads, lead interests, visitor info, and analytics events.
- Add `GET /history/:conversationId`.
- Add lookup/update logic that merges new session interests into the existing lead profile for the same email.
- Verify chat and lead data survives reloads.
- Completion target: chats and leads persist beyond a browser session.

### Level 9: Recommendation Engine

- Map detected intent to Justo services, industries, case studies, and Elevate product content.
- Recommend relevant offerings based on retrieved chunks and visitor context.
- Ask one clarifying question when confidence is low.
- Suggest next actions such as booking a consultation or sharing contact details.
- Keep all recommendations grounded in retrieved Justo knowledge.
- Completion target: Justo Genie guides visitors toward the right solution, not just answers questions.

### Level 10: Iframe Deployment

- Build the frontend as an embeddable iframe widget.
- Add an iframe-compatible route or static page.
- Support configuration for backend API URL, theme, welcome message, and initial prompts.
- Test the iframe on a static host page.
- Ensure mobile behavior remains usable.
- Completion target: Justo website can embed Justo Genie through an iframe.

### Level 11: Advanced Agentic Behavior

- Add stronger intent categories for services, industries, donors, enterprise buyers, Elevate, case studies, and support.
- Add proactive follow-up prompts based on user behavior.
- Add lead-score-based behavior:
  - low score: answer normally.
  - medium score: ask a qualifying follow-up.
  - high score: invite contact capture or consultation booking.
- Add conversation summaries for sales handoff.
- Completion target: Justo Genie behaves like an engagement agent, not a passive chatbot.

### Level 12: Demo Polish

- Add branded visual design and smooth Framer Motion animations.
- Add polished fallback messages.
- Add seed suggested prompts for Justo services, industries, case studies, and Elevate.
- Add basic analytics logs or a simple admin-readable lead output.
- Optimize top-K, prompt length, and source formatting.
- Run end-to-end smoke tests across ingestion, backend, and frontend.
- Completion target: fast, polished, reliable internal showcase demo.

Recommended execution order:

```txt
1. ChromaDB embeddings
2. Backend /chat RAG
3. Backend streaming
4. Frontend basic widget
5. Frontend streaming UI
6. Conversation memory
7. Intent and lead extraction
8. Database persistence
9. Recommendations
10. Iframe deployment and polish
```

## Validation Expectations

When changing ingestion:

- Verify `chunks.json` can be read.
- Verify embeddings are generated for every chunk.
- Verify ChromaDB collection count matches expected chunk count.
- Test at least one semantic query against ChromaDB.

When changing backend:

- Run the most specific available backend test or smoke command.
- Verify `/health`.
- Verify a chat request retrieves context.
- Verify streaming works if touched.
- Verify lead metadata is produced or persisted if touched.

When changing frontend:

- Run the configured build or lint command if available.
- Verify the widget opens/closes.
- Verify messages stream without layout jumps.
- Verify mobile layout remains usable.
- Verify API errors show a graceful fallback.

## Do Not Do

- Do not introduce LangChain by default.
- Do not build a generic chatbot persona.
- Do not optimize for complex agent internals over speed and polish.
- Do not require a lead form before answering basic questions.
- Do not remove source metadata from chunks.
- Do not hardcode secrets or API keys.
- Do not commit generated vector database files unless explicitly requested.
