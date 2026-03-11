# Project Status

## Current Version: v0.2

**Date**: 2026-03-11

## Completed

### v0.1 — MVP
- [x] Project scaffolding (Next.js 15 + Python venv)
- [x] STT service (faster-whisper, base.en, CPU int8)
- [x] TTS service (Piper, en_GB-alba-medium)
- [x] Frontend UI (record button, chat messages)
- [x] API client (STT/LLM/TTS calls)
- [x] System prompts (free talk + 3 scenarios)
- [x] Audio recording hook (MediaRecorder API)
- [x] One-click startup script (start.sh)
- [x] End-to-end integration test passed

### v0.2 — Branding + Persistence + UX
- [x] Named the app Parla, designed icon/favicon/logo
- [x] Conversation persistence (PostgreSQL + localStorage dual layer)
- [x] Sidebar conversation history
- [x] Scenario selection when creating new chat (locked after creation)
- [x] Auto-generated conversation titles (LLM) + manual editing
- [x] Hold-spacebar-to-speak shortcut
- [x] LLM performance optimization (disabled thinking, reduced context window)
- [x] Version-based incremental message sync
- [x] Automatic fallback to localStorage when database is unavailable
- [x] Database migration scripts (services/db/migrations/)
- [x] CC BY-NC 4.0 open source license
- [x] Pushed to GitHub

## Fixes

- [x] TTS: Fixed Piper API usage (synthesize returns AudioChunk iterator, requires manual WAV writing)
- [x] LLM: Disabled Qwen3.5 thinking mode (response time from 20s down to 1-7s)
- [x] LLM: Reduced num_ctx to 2048 (prompt processing 11 → 78 tok/s)
- [x] STT: Fixed SOCKS proxy causing startup failure (start.sh clears ALL_PROXY)

## TODO

### v0.3 — Experience
- [ ] AI speech speed control
- [ ] More scenario templates
- [ ] Recording waveform visualization
- [ ] Word-level confidence color coding

### v0.4 — Pronunciation Assessment
- [ ] Common Chinese-accent detection (th/s, l/r, v/w)
- [ ] Shadowing mode (given sentence, user reads aloud, compare)
- [ ] Error vocabulary notebook

### Long-term
- [ ] Phoneme-level pronunciation assessment
- [ ] Multiple voice models (American/British)
- [ ] Mobile-friendly layout
- [ ] Practice statistics (common errors, progress trends)

## Known Limitations

1. **STT auto-corrects pronunciation**: The better Whisper gets, the more it "guesses" the correct word, potentially masking pronunciation errors
2. **LLM correction quality depends on model size**: 9B model may not catch complex grammar issues
3. **TTS naturalness is limited**: Piper offline TTS is less natural than cloud-based alternatives
4. **No VAD**: Requires holding button/spacebar — no automatic speech start/end detection
