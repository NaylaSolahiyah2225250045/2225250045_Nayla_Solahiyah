"""NoBaku API (Alpha).

Layanan pengecekan notasi ilmiah + akun siswa/guru, kelas VIII-A–E, sinkronisasi ringkasan belajar,
dan laporan guru (17 Nov 2026). Asisten Belajar (Groq, 21 Nov 2026): /api/v1/ai/* — mati secara bawaan,
diaktifkan lewat backend/.env (AI_ENABLED, GROQ_API_KEY, GROQ_MODEL); lihat docs/AI-TUTOR.md.
Skema database dibuat lewat migrasi Alembic:  alembic upgrade head

Jalankan:  uvicorn app.main:app --reload   → dokumentasi di http://localhost:8000/docs
"""

from __future__ import annotations

from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import sci
from .core.config import settings
from .routers import ai, auth, classes, reports

app = FastAPI(title="NoBaku API", version="0.2.0-alpha")

_allowed_origins = list(
    dict.fromkeys(
        [
            *settings.cors_origins,
            "https://2225250045-nayla-solahiyah.netlify.app",
        ]
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
for _router in (auth.router, classes.router, reports.router, ai.router):
    app.include_router(_router, prefix="/api/v1")


class ConvertRequest(BaseModel):
    value: str = Field(..., max_length=60, examples=["0,00032"])


class SciParts(BaseModel):
    a: str = Field(..., max_length=40, examples=["3,2"])
    n: int = Field(..., ge=-99, le=99, examples=[-4])


class CheckRequest(BaseModel):
    type: Literal["to_scientific", "to_standard", "power_of_ten"]
    question: str | SciParts
    answer: str | SciParts


class CheckResponse(BaseModel):
    correct: bool
    error_code: str | None


def _bad(message: str) -> HTTPException:
    return HTTPException(status_code=400, detail={"code": "VALIDATION_ERROR", "message": message})


@app.get("/api/v1/health")
def health() -> dict:
    return {"status": "ok", "version": app.version}


@app.post("/api/v1/sci/to-scientific", response_model=SciParts)
def convert_to_scientific(req: ConvertRequest) -> dict:
    x = sci.parse_standard(req.value)
    if x is None:
        raise _bad("Bilangan tidak valid atau bernilai nol.")
    return sci.to_scientific(x)


@app.post("/api/v1/sci/to-standard")
def convert_to_standard(req: SciParts) -> dict:
    p = sci.parse_scientific(req.a, req.n)
    if p is None:
        raise _bad("Bentuk a × 10ⁿ tidak valid.")
    return {"value": sci.to_standard(p.value), "normalized": p.normalized}


@app.post("/api/v1/sci/check", response_model=CheckResponse)
def check(req: CheckRequest) -> CheckResponse:
    try:
        if req.type == "to_scientific":
            if not isinstance(req.question, str) or not isinstance(req.answer, SciParts):
                raise _bad("Format soal/jawaban tidak sesuai tipe.")
            d = sci.diagnose_to_scientific(req.question, req.answer.a, req.answer.n)
        elif req.type == "to_standard":
            if not isinstance(req.question, SciParts) or not isinstance(req.answer, str):
                raise _bad("Format soal/jawaban tidak sesuai tipe.")
            d = sci.diagnose_to_standard(req.question.a, req.question.n, req.answer)
        else:
            if not isinstance(req.question, str) or not isinstance(req.answer, str):
                raise _bad("Format soal/jawaban tidak sesuai tipe.")
            d = sci.diagnose_power_of_ten(req.question, req.answer)
    except ValueError as exc:
        raise _bad(str(exc)) from exc
    return CheckResponse(correct=d.correct, error_code=d.error_code)
