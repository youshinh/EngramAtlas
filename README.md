# EngramAtlas

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Hackathon%202026-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-MCP%20Integrated-00ED64?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-8E75B2?logo=google&logoColor=white)](https://ai.google.dev)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)

> **Google Cloud Rapid Agent Hackathon 2026 — MongoDB Track**

---

## Demo

| | |
|---|---|
| **Demo Video** | *(coming soon)* |
| **Devpost** | *(coming soon)* |

---

## Overview

EngramAtlas is a self-organizing knowledge engine that accepts unstructured thought inputs — text, images, PDFs, or web URLs — and autonomously builds a semantic memory network in MongoDB Atlas.

Rather than storing information in static folders, EngramAtlas treats each new input as a node in a living graph. The system computes vector embeddings via the Gemini API, searches past entries for semantic similarity, and writes bidirectional relationship links between related memories — all without human intervention at each step.

The project is built on the philosophy that the *relationships between ideas* are more valuable than the ideas themselves.

---

## Architecture

```
[ User Input: text / image / PDF / URL ]
                │
                ▼  POST /api/sendNoise
[ Node.js + Express (server.js) ]
                │
        ┌───────┴────────┐
        ▼                ▼
[ Gemini API ]    [ MongoDB Atlas ]
  - Text generation     - engrams collection
  - Embeddings (3,072d) - Vector similarity search
  - Multimodal Vision   - Bidirectional related_links
  - URL summarization   - Evolution history log
```

**Key design decisions:**
- No external orchestration layer; the agent logic runs directly in Node.js
- MongoDB is used both as a document store and as the semantic graph backbone
- The system falls back to an in-memory mock store when MongoDB is unavailable, so it runs without any external dependencies for local testing

---

## Features

### Multimodal Input Translation
Images and PDFs are passed through Gemini's multimodal API, which extracts the semantic content as structured text. Web URLs are fetched server-side and summarized. All modalities are merged into a single text representation before embedding, enabling cross-modal similarity search.

### Semantic Self-Organization
Each new input is embedded into a 3,072-dimensional vector using `gemini-embedding-2-preview`. The system scans past entries for cosine similarity above a configurable threshold (default: 0.55) and writes bidirectional `related_links` entries to both documents, including an AI-generated explanation of why the two memories are connected.

### Autonomous Forget
Inputs containing deletion intent keywords (e.g., "forget", "delete", "忘却") trigger an autonomous forget flow: the system identifies the most semantically similar recent entry and removes it from the database, cleaning up all dangling references from connected nodes via MongoDB's `$pull` operator.

### Resilience and Self-Healing
Transient errors (rate limits, network timeouts) are classified and handled with exponential backoff retries (up to 3 attempts, starting at 500ms). Fatal errors are propagated immediately. The self-healing trace is included in the response for observability.

---

## Document Schema

Each memory (Engram) is stored as a flexible JSON document in the `engrams` collection:

```json
{
  "_id": "ObjectId",
  "content": "The merged text representation of the input",
  "raw_input_type": "text | image | pdf | url | mixed",
  "created_at": "ISODate",
  "metadata": {
    "scope": "PERSONAL",
    "tags": ["..."],
    "entropy_score": 0.5,
    "attachment": { "name": "...", "mimeType": "..." },
    "linkUrl": "https://..."
  },
  "vector_embeddings": [0.012, -0.045, "...(3072 values)"],
  "related_links": [
    {
      "to_engram_id": "ObjectId",
      "strength": 0.82,
      "reason_of_connection": "AI-generated explanation"
    }
  ],
  "evolution_history": [
    {
      "timestamp": "ISODate",
      "action": "create | self_organize_link | self_heal_success",
      "comment": "..."
    }
  ]
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serves the web UI |
| `POST` | `/api/sendNoise` | Ingest a new thought, run self-organization |
| `POST` | `/api/updateEngram` | Refine an existing Engram by ID |
| `POST` | `/api/forgetEngram` | Delete an Engram and clean up references |
| `GET` | `/api/getAllEngrams` | Retrieve all Engrams (for visualization) |

**`POST /api/sendNoise` — request body:**
```json
{
  "userInput": "Your raw thought text",
  "lang": "en | ja",
  "attachment": { "name": "sketch.png", "mimeType": "image/png", "data": "<base64>" },
  "linkUrl": "https://example.com",
  "simulateError": "transient"
}
```

---

## Quick Start

### 1. Configure environment variables

Copy `.env.example` to `.env` and fill in your credentials:

```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_atlas_connection_string_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2-preview
```

MongoDB is optional for local testing — the system uses an in-memory store as a fallback.

### 2. Install and run

Requires Node.js v18 or later.

```bash
npm install
npm start
```

The server starts at [http://localhost:3000](http://localhost:3000).

### 3. Run the evaluation suite

This project uses Evaluation Driven Development (EDD). The automated eval suite tests all core behaviors against the spec:

```bash
npm run eval
```

A score of 100/100 indicates full spec compliance.

---

## License

Apache License, Version 2.0. See [LICENSE](./LICENSE) for details.
