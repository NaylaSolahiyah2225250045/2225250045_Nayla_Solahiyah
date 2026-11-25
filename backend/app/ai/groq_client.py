"""Klien Groq (API kompatibel OpenAI) memakai httpx.

Keamanan: kunci API hanya dibaca dari pengaturan backend (backend/.env), dikirim sebagai header
Authorization ke api.groq.com, dan TIDAK PERNAH dimasukkan ke log, pesan galat, atau respons ke klien.
Galat httpx diubah menjadi AIProviderError dengan jenis singkat (`from None` agar konteks permintaan tidak ikut).
"""

from __future__ import annotations

from typing import Any, Literal

import httpx

GROQ_BASE_URL = "https://api.groq.com/openai/v1"

ErrorKind = Literal["auth", "rate_limit", "timeout", "unavailable", "bad_response", "model", "truncated", "refusal"]


class AIProviderError(Exception):
    """Kegagalan penyedia AI tanpa detail rahasia. `kind` dipakai untuk memilih pesan cadangan."""

    def __init__(self, kind: ErrorKind) -> None:
        super().__init__(kind)
        self.kind: ErrorKind = kind


def _is_reasoning_model(model: str) -> bool:
    return model.startswith("openai/gpt-oss")


class GroqClient:
    def __init__(
        self,
        api_key: str,
        model: str,
        *,
        base_url: str = GROQ_BASE_URL,
        timeout_seconds: int = 20,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        if not api_key:
            raise ValueError("GROQ_API_KEY kosong")
        self._api_key = api_key
        self.model = model
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout_seconds
        self._transport = transport  # untuk tes (httpx.MockTransport)

    def __repr__(self) -> str:  # jangan pernah menampilkan kunci
        return f"GroqClient(model={self.model!r})"

    def _client(self) -> httpx.Client:
        return httpx.Client(
            base_url=self._base_url,
            timeout=self._timeout,
            headers={"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"},
            transport=self._transport,
        )

    def _request(self, method: str, path: str, json: dict[str, Any] | None = None) -> dict[str, Any]:
        try:
            with self._client() as http:
                res = http.request(method, path, json=json)
        except httpx.TimeoutException:
            raise AIProviderError("timeout") from None
        except httpx.HTTPError:
            raise AIProviderError("unavailable") from None
        if res.status_code in (401, 403):
            raise AIProviderError("auth")
        if res.status_code == 429:
            raise AIProviderError("rate_limit")
        if res.status_code == 404:
            raise AIProviderError("model")
        if res.status_code >= 400:
            raise AIProviderError("unavailable")
        try:
            data = res.json()
        except ValueError:
            raise AIProviderError("bad_response") from None
        if not isinstance(data, dict):
            raise AIProviderError("bad_response")
        return data

    def list_models(self) -> set[str]:
        """ID model yang tersedia untuk kunci ini (GET /models)."""
        data = self._request("GET", "/models")
        return {m.get("id") for m in data.get("data", []) if isinstance(m, dict) and m.get("id")}

    def chat(self, messages: list[dict[str, str]], *, max_completion_tokens: int = 1536) -> str:
        """Kirim percakapan, kembalikan teks jawaban (bagian penalaran model tidak dipakai)."""
        body: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.5,  # sedikit lebih bervariasi agar balasan tidak selalu berpola sama
            "max_completion_tokens": max_completion_tokens,
        }
        if _is_reasoning_model(self.model):
            # Model gpt-oss: penalaran singkat & tidak dikirim balik; anggaran token cukup agar jawaban tidak kosong.
            body["reasoning_effort"] = "low"
            body["include_reasoning"] = False
        data = self._request("POST", "/chat/completions", json=body)
        try:
            choice = data["choices"][0]
            content = choice["message"].get("content")
            finish = choice.get("finish_reason")
        except (KeyError, IndexError, TypeError, AttributeError):
            raise AIProviderError("bad_response") from None
        # Alasan berhenti selalu diperiksa (CLAUDE.md §2b, 26 Nov 2026): jawaban terpotong tidak ditampilkan
        # setengah kalimat, dan penolakan penyedia tidak dibaca sebagai jawaban.
        if finish == "length":
            raise AIProviderError("truncated")
        if finish in ("content_filter", "refusal"):
            raise AIProviderError("refusal")
        if not isinstance(content, str):
            raise AIProviderError("bad_response")
        return content
