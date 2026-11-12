"""KomaKu API (Alpha).

Alpha hanya menyediakan layanan pengecekan notasi ilmiah. Login, kelas, progres,
dan Asisten AI menyusul sesuai docs/ROADMAP.md.

Jalankan:  uvicorn app.main:app --reload   → dokumentasi di http://localhost:8000/docs
"""

from __future__ import annotations

import os
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import sci

app = FastAPI(title="KomaKu API", version="0.1.0-alpha")

_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:4173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


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
