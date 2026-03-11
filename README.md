# Parla

Fully local English speaking practice app. No cloud APIs, no subscriptions — your voice data never leaves your machine.

Press and hold the microphone button (or spacebar), speak in English, release — get a natural reply with pronunciation playback and grammar corrections.

## How It Works

```
Browser (Next.js :3000)
  ├── Record voice → STT (faster-whisper :8001)
  ├── Conversation  → LLM (Ollama :11434)
  └── Playback     ← TTS (Piper :8002)
```

All four services run on your local machine. An optional PostgreSQL database stores conversation history — without it, conversations are kept in browser localStorage.

## Prerequisites

| Dependency | Version | Install |
|------------|---------|---------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| pnpm | 9+ | `npm i -g pnpm` |
| Python | 3.10+ | [python.org](https://python.org) |
| Ollama | latest | [ollama.com](https://ollama.com) |

**Hardware**: Apple Silicon Mac recommended (M1/M2/M3). Runs on CPU — no GPU required, though Apple Metal accelerates the LLM.

## Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/drooop/parla.git
cd parla

# Frontend
cd app && pnpm install && cd ..

# Python services
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn faster-whisper piper-tts
```

### 2. Download models

```bash
# LLM (Qwen 3.5 9B, ~5.5 GB)
ollama pull qwen3.5:9b

# TTS voice (Piper, ~40 MB)
mkdir -p services/piper-models
cd services/piper-models
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alba/medium/en_GB-alba-medium.onnx
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alba/medium/en_GB-alba-medium.onnx.json
cd ../..
```

The STT model (`base.en`, ~150 MB) downloads automatically on first launch.

### 3. Start all services

```bash
./start.sh
```

Open [http://localhost:3000](http://localhost:3000) in your browser, click **+ New Chat**, pick a scenario, and start speaking.

### 4. (Optional) Set up PostgreSQL for conversation history

Without a database, conversations persist in localStorage only. To enable cross-session storage:

```bash
# Create database
createdb english_coach

# Run migration
psql english_coach < services/db/migrations/001_init.sql

# Configure connection
cp app/.env.local.example app/.env.local
# Edit app/.env.local with your DATABASE_URL
```

## Practice Modes

| Mode | Description |
|------|-------------|
| Free Talk | Open conversation on any topic |
| Coffee Shop | Order drinks from a barista |
| Job Interview | Practice tech interview Q&A |
| Hotel Check-in | Check into a hotel in English |

## Usage Tips

- **Spacebar shortcut**: Hold Space to record, release to send (works anywhere except text inputs)
- **Grammar corrections**: The AI reply shows a natural response, followed by `---` and corrections if any errors were detected
- **Low-confidence words**: Words the STT model is unsure about are highlighted — these may indicate unclear pronunciation
- **Edit titles**: Click the conversation title in the header to rename it

## Ports

| Service | Port |
|---------|------|
| Web UI | 3000 |
| STT (faster-whisper) | 8001 |
| TTS (Piper) | 8002 |
| LLM (Ollama) | 11434 |

## Tech Stack

- **Frontend**: Next.js 15 · React · TypeScript · Tailwind CSS
- **STT**: faster-whisper (`base.en`, CPU int8)
- **LLM**: Ollama + Qwen 3.5 9B (Q4_K_M)
- **TTS**: Piper TTS (`en_GB-alba-medium`)
- **Database**: PostgreSQL (optional)

## License

[CC BY-NC 4.0](LICENSE) — free for personal and educational use, not for commercial purposes.
