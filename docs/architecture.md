# Technical Architecture

## System Diagram

```
┌─────────────────────────────────────────────────┐
│              Browser (localhost:3000)            │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │ Sidebar   │ │ Chat Msgs│ │ Record / Space  │  │
│  └──────────┘ └──────────┘ └────────┬────────┘  │
│       │                  audio blob (webm/opus) │
│  localStorage                       │           │
│  (cache layer)                      │           │
└───────┼─────────────────────────────┼───────────┘
        │                             │
        ▼                             ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │  STT :8001   │    │  TTS :8002   │
│  (optional)  │    │ faster-whisper│    │ Piper        │
│              │    │ base.en      │    │ alba-medium  │
│  conversations│    │              │    │              │
│  messages    │    │ Python/FastAPI│    │ Python/FastAPI│
└──────────────┘    └──────┬───────┘    └──────────────┘
                           │ text              ▲
                           ▼                   │ text
                    ┌──────────────┐           │
                    │  LLM :11434  │───────────┘
                    │ Ollama       │
                    │ Qwen3.5-9B   │
                    └──────────────┘
```

## Data Flow

```
1. User holds button/spacebar → MediaRecorder starts recording
2. User releases → audio Blob obtained (webm/opus)
3. POST /transcribe → faster-whisper → { text, words[{word, probability}] }
4. POST ollama/api/chat → Qwen3.5-9B → reply text (with corrections)
5. POST /synthesize → Piper TTS → audio/wav
6. AudioContext plays wav
7. Messages persisted to PostgreSQL (async, non-blocking for TTS playback)
8. After first message, fire-and-forget title generation via LLM
```

## Component Responsibilities

### Frontend (Next.js 15)

| File | Responsibility |
|------|----------------|
| `page.tsx` | Main page — orchestrates record → STT → LLM → TTS flow, conversation management |
| `use-audio-recorder.ts` | Wraps MediaRecorder API |
| `api.ts` | STT/LLM/TTS service calls |
| `conversations-api.ts` | Conversation CRUD + message read/write API |
| `cache.ts` | localStorage cache management with version checking |
| `prompts.ts` | System prompts and scenario definitions |
| `db.ts` | PostgreSQL connection pool (server-side) |
| `chat-message.tsx` | Message bubble — separates reply and corrections |
| `record-button.tsx` | Record button (hold to speak) |
| `conversation-list.tsx` | Sidebar conversation list |
| `new-chat-dialog.tsx` | New conversation dialog (scenario selection) |

### API Routes (Next.js)

| Route | Methods | Responsibility |
|-------|---------|----------------|
| `/api/conversations` | GET/POST | List / create conversations |
| `/api/conversations/[id]` | GET/PATCH/DELETE | Details / rename / delete |
| `/api/conversations/[id]/messages` | GET/POST | Fetch messages (supports incremental) / append |
| `/api/conversations/[id]/title` | POST | Auto-generate title via LLM |

### STT Service (services/stt/)

- faster-whisper base.en model, CPU int8 inference
- Accepts webm audio, returns transcribed text + word-level confidence
- `word_timestamps=True` enables word-level timestamps and probabilities

### TTS Service (services/tts/)

- Piper TTS, en_GB-alba-medium voice model
- Accepts text, returns wav audio
- Manually builds WAV header, iterates AudioChunk to write frame data

### LLM (Ollama)

- Calls Ollama REST API directly — no wrapper service needed
- Model: Qwen3.5-9B (Q4_K_M)
- `stream: false` (waits for full reply before returning)
- `think: false` (disables chain-of-thought, significantly reduces latency)
- `num_ctx: 2048` (reduced context window, improves prompt processing speed)

### Data Persistence

- **PostgreSQL** (optional): Stores conversations and messages, supports version-based incremental sync
- **localStorage**: Browser-side cache with per-conversation version numbers
- **Fallback strategy**: All DB calls wrapped in try/catch — automatically falls back to localStorage mode on failure

## Design Decisions

### Why faster-whisper over OpenAI Whisper
- faster-whisper is based on CTranslate2, 4x faster inference
- Supports int8 quantization, runs fast on CPU
- Native word_timestamps support for word-level confidence

### Why non-streaming LLM
- Speaking practice replies are short (2-3 sentences)
- Full reply needed to split "conversation" and "correction" sections
- Full text needed before sending to TTS

### Why Piper over edge-tts
- Piper is fully offline, meets the all-local requirement
- edge-tts is free but requires internet access to Microsoft API

### Why PostgreSQL is optional
- Lowers the barrier to entry — no mandatory database setup
- localStorage cache is sufficient for personal practice
- Enable PostgreSQL when cross-device or long-term storage is needed

### Why version numbers over timestamps for sync
- Version numbers are monotonically increasing, unaffected by clock drift
- Combined with `after_seq` parameter for precise incremental fetching
- Atomically incremented within transactions, avoids concurrency conflicts
