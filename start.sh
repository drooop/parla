#!/bin/bash
# Start all English Coach services

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting English Coach..."

# Check Ollama
if ! ollama list | grep -q "qwen3.5"; then
  echo "Error: qwen3.5:9b not found. Run: ollama pull qwen3.5:9b"
  exit 1
fi

# Start STT service (unset SOCKS proxy to avoid socksio dependency during model download)
echo "Starting STT service on :8001..."
(cd "$SCRIPT_DIR/services/stt" && source ../../.venv/bin/activate && ALL_PROXY="" all_proxy="" SOCKS_PROXY="" socks_proxy="" uvicorn server:app --host 0.0.0.0 --port 8001) &
STT_PID=$!

# Start TTS service
echo "Starting TTS service on :8002..."
(cd "$SCRIPT_DIR/services/tts" && source ../../.venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8002) &
TTS_PID=$!

# Start Next.js
echo "Starting web app on :3000..."
(cd "$SCRIPT_DIR/app" && pnpm dev) &
WEB_PID=$!

echo ""
echo "All services started:"
echo "  Web:  http://localhost:3000"
echo "  STT:  http://localhost:8001"
echo "  TTS:  http://localhost:8002"
echo "  LLM:  http://localhost:11434 (Ollama)"
echo ""
echo "Press Ctrl+C to stop all services"

cleanup() {
  echo "Stopping services..."
  kill $STT_PID $TTS_PID $WEB_PID 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM
wait
