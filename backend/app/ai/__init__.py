"""Asisten Belajar NoBaku (Groq lewat backend). Lihat docs/AI-TUTOR.md.

- groq_client : panggilan HTTP ke Groq (kunci hanya dari backend/.env, tidak pernah di-log)
- prompts     : system prompt pedagogis (Mathematical Literacy, RMT, Cognitive Load Theory, PMSTP)
- guardrails  : sensor data pribadi, saringan angka & kunci jawaban (AI tidak menghitung)
- tutor       : menyusun percakapan, memanggil penyedia, menyaring, cadangan bila gagal
"""
