import io
import wave
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from piper import PiperVoice

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

VOICE_PATH = Path(__file__).parent.parent / "piper-models" / "en_GB-alba-medium.onnx"
voice = PiperVoice.load(str(VOICE_PATH))


class SynthRequest(BaseModel):
    text: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/synthesize")
async def synthesize(req: SynthRequest):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(voice.config.sample_rate)
        for chunk in voice.synthesize(req.text):
            wav_file.writeframes(chunk.audio_int16_bytes)
    buf.seek(0)
    return Response(content=buf.read(), media_type="audio/wav")
