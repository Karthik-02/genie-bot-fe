# Justo Genie Ingestion

This folder is only for scraping, cleaning, and chunk generation from the static Justo Global website source.

Current state:

```txt
scrape -> clean -> chunk -> chunks.json
```

The retrieval-ready Level 1 knowledge base lives in:

```txt
../genie-bot-be/knowledge/
```

## Setup

Install scraper dependencies:

```bash
npm install
```

## Scrape And Chunk

```bash
npm run scrape
npm run clean
npm run chunk
```

When website content changes, regenerate `chunks.json` here, then copy the updated chunk file into `../genie-bot-be/knowledge/chunks.json` and rebuild ChromaDB from the backend knowledge folder.
