import tempfile
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = WhisperModel("small", device="cpu", compute_type="int8")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    audio_bytes = await file.read()

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=True) as tmp:
        tmp.write(audio_bytes)
        tmp.flush()
        segments, info = model.transcribe(
            tmp.name, word_timestamps=True
        )
        words = []
        text_parts = []
        for segment in segments:
            text_parts.append(segment.text)
            if segment.words:
                for w in segment.words:
                    words.append(
                        {
                            "word": w.word.strip(),
                            "start": round(w.start, 2),
                            "end": round(w.end, 2),
                            "probability": round(w.probability, 3),
                        }
                    )

        return {
            "text": "".join(text_parts).strip(),
            "language": info.language,
            "words": words,
        }
