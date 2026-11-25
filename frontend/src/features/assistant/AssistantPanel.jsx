import { useEffect, useMemo, useRef, useState } from 'react';
import { askAssistant, assistantStatus, assistantVisuals, buildAssistantContext, historyForServer, MAX_MESSAGE_CHARS } from '../../lib/assistant.js';
import AssistantText from './AssistantText.jsx';
import { STARTERS } from '../../content/visuals.js';
import AssistantVisual from './AssistantVisual.jsx';

/**
 * Asisten Belajar di bawah soal latihan (bukan di kuis) — docs/AI-TUTOR.md.
 * Tidak tampil sama sekali bila asisten tidak tersedia (mode lokal, AI dimatikan, belum masuk lewat server).
 * Terlipat secara bawaan; satu panel ringkas (Cognitive Load). Percakapan hanya di memori halaman ini.
 * Balasan AI bisa disertai VISUAL matematika (contoh serupa yang dihitung lib/sci, dipilih AI lewat id).
 * Tidak memengaruhi penilaian, XP, progres, atau jumlah petunjuk.
 */
export default function AssistantPanel({ q, topicId = null }) {
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // {role, content, visual?, source?}
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const alive = useRef(true);
  const logRef = useRef(null);
  const visuals = useMemo(() => assistantVisuals(q, topicId), [q, topicId]);
  const byId = useMemo(() => Object.fromEntries(visuals.map((v) => [v.id, v])), [visuals]);
  // Visual deterministik: id di konteks = id di `byId`. Ke server hanya id + ringkasan; data gambar tetap di perangkat.
  const context = useMemo(() => buildAssistantContext(q, topicId), [q, topicId]);

  useEffect(() => {
    alive.current = true;
    assistantStatus().then((s) => {
      if (!alive.current) return;
      setStatus(s);
      setRemaining(s.remaining);
    });
    return () => {
      alive.current = false;
    };
  }, []);

  // Gulir ke pesan terbaru setiap ada pesan baru.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, open]);

  if (!status?.available) return null;

  const sendText = async (raw) => {
    const text = raw.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setError(null);
    setBusy(true);
    // Jendela riwayat terakhir + penanda visual & asal balasan (lib/assistant.js historyForServer).
    const r = await askAssistant(context, historyForServer(next));
    if (!alive.current) return;
    setBusy(false);
    if (r.ok) {
      setMessages([...next, { role: 'assistant', content: r.reply, visual: byId[r.visual] ? r.visual : null, source: r.source }]);
      setRemaining(r.remaining);
    } else {
      setError(r.error);
      if (r.code === 'AI_LIMIT') setRemaining(0);
    }
  };
  const send = (e) => {
    e.preventDefault();
    sendText(input);
  };

  if (!open) {
    return (
      <button type="button" className="btn btn--ghost assist-open" onClick={() => setOpen(true)}>
        <span aria-hidden="true">💬</span> Tanya Asisten Belajar
      </button>
    );
  }

  const outOfQuota = remaining === 0;
  return (
    <section className="assist card" aria-label="Asisten Belajar">
      <div className="assist__head">
        <p className="assist__title">
          Asisten Belajar <span className="assist__badge">program komputer</span>
        </p>
        <button type="button" className="btn btn--ghost assist__close" onClick={() => setOpen(false)} aria-label="Tutup Asisten Belajar">
          Tutup
        </button>
      </div>
      <p className="small muted">Asisten membantumu berpikir langkah demi langkah, tidak memberi jawaban akhir. Jangan tulis nama atau data pribadi.</p>

      <ol className="assist__log" aria-live="polite" ref={logRef}>
        <li className="assist__msg assist__msg--ai">Hai! Bagian mana dari soal ini yang membuatmu bingung? Ceritakan dengan kata-katamu sendiri, atau pilih salah satu di bawah.</li>
        {messages.map((m, i) => [
          <li key={i} className={`assist__msg assist__msg--${m.role === 'user' ? 'me' : 'ai'}`}>
            {m.role === 'user' ? m.content : <AssistantText text={m.content} />}
          </li>,
          m.visual && byId[m.visual] ? (
            <li key={`${i}-v`} className="assist__visual">
              <AssistantVisual v={byId[m.visual]} />
            </li>
          ) : null,
        ])}
        {busy && <li className="assist__msg assist__msg--ai assist__msg--wait">Asisten sedang berpikir…</li>}
      </ol>

      {messages.length === 0 && !outOfQuota && (
        <div className="assist__starters" role="group" aria-label="Contoh pertanyaan">
          {STARTERS.map((s) => (
            <button key={s} type="button" className="assist__starter" onClick={() => sendText(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="assist__error" role="alert">
          {error}
        </p>
      )}

      <form className="assist__form" onSubmit={send}>
        <input
          type="text"
          aria-label="Pertanyaanmu untuk Asisten Belajar"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={MAX_MESSAGE_CHARS}
          placeholder={outOfQuota ? 'Kuota hari ini habis' : 'Tulis pertanyaanmu…'}
          disabled={busy || outOfQuota}
          autoComplete="off"
        />
        <button type="submit" className="btn btn--primary" disabled={busy || outOfQuota || !input.trim()}>
          Kirim
        </button>
      </form>
      {remaining !== null && <p className="small muted">Sisa pertanyaan hari ini: {remaining}</p>}
    </section>
  );
}
