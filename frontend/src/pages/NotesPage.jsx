import { useState } from 'react';
import { FORMULAS, MISTAKES, NOTE_SECTIONS, QUICK_EXAMPLES, SUMMARY, TIPS } from '../content/notes.js';
import { answerKey, parseStandard, sciText, toScientific, workedSteps } from '../lib/sci/index.js';
import { Sci } from '../components/Sci.jsx';
import MascotLive from '../components/MascotLive.jsx';
import Decor from '../components/Decor.jsx';
import { IconNote } from '../components/NavIcons.jsx';
import { IconBulb, IconCheck, IconX } from '../components/Icons.jsx';

/** Catatan Pintar: rangkuman, rumus, contoh singkat, tips, dan kesalahan umum. */
export default function NotesPage() {
  const [filter, setFilter] = useState('semua');
  const show = (id) => filter === 'semua' || filter === id;

  return (
    <main className="page page--wide stack">
      <header className="page-hero page-hero--lab page-hero--decor">
        <Decor set="notes" />
        <span className="page-hero__icon" aria-hidden="true">
          <IconNote />
        </span>
        <div className="page-hero__text">
          <h1>Catatan Pintar</h1>
          <p>Semua yang penting dalam satu tempat. Baca ulang sebelum latihan atau kuis.</p>
        </div>
        <div className="page-hero__mascot">
          <MascotLive poses={['idea', 'wink', 'point']} size={72} bubble="none" />
        </div>
      </header>

      <div className="chip-filter" role="group" aria-label="Tampilkan bagian">
        {[{ id: 'semua', label: 'Semua' }, ...NOTE_SECTIONS].map((s) => (
          <button key={s.id} type="button" aria-pressed={filter === s.id} className={filter === s.id ? 'is-on' : ''} onClick={() => setFilter(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {show('ringkasan') && (
        <section className="notes-sec notes-sec--learn" aria-labelledby="n-ringkasan">
          <h2 id="n-ringkasan">Rangkuman</h2>
          <div className="notes-grid">
            {SUMMARY.map((s, i) => (
              <article key={s.title} className="note-card">
                <span className="note-card__no">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {show('rumus') && (
        <section className="notes-sec notes-sec--lab" aria-labelledby="n-rumus">
          <h2 id="n-rumus">Rumus Penting</h2>
          <div className="formula-grid">
            {FORMULAS.map((f) => (
              <div key={f.formula} className="formula-card">
                <p className="formula-card__f">{f.formula}</p>
                <p className="small muted">{f.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {show('contoh') && (
        <section className="notes-sec notes-sec--progress" aria-labelledby="n-contoh">
          <h2 id="n-contoh">Contoh Penyelesaian Singkat</h2>
          <div className="notes-grid">
            {QUICK_EXAMPLES.map((v) => {
              const { a, n } = toScientific(parseStandard(v));
              return (
                <article key={v} className="note-card note-card--example">
                  <p className="note-card__eq">
                    <span className="sci">{v}</span> = <Sci a={a} n={n} />
                  </p>
                  <ol>
                    {workedSteps(v)
                      .slice(0, 3)
                      .map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                  </ol>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {show('tips') && (
        <section className="notes-sec notes-sec--install" aria-labelledby="n-tips">
          <h2 id="n-tips">Tips</h2>
          <ul className="tip-list">
            {TIPS.map((t) => (
              <li key={t}>
                <IconBulb /> <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {show('kesalahan') && (
        <section className="notes-sec notes-sec--account" aria-labelledby="n-kesalahan">
          <h2 id="n-kesalahan">Kesalahan yang Sering Terjadi</h2>
          <div className="notes-grid">
            {MISTAKES.map((m) => {
              const key = answerKey({ type: 'to_scientific', value: m.value });
              return (
                <article key={m.code} className="mistake-card">
                  <h3>{m.title}</h3>
                  <p className="small muted">
                    Soal: tulis <b className="sci">{m.value}</b> dalam bentuk baku
                  </p>
                  <p className="mistake-card__row is-bad">
                    <IconX /> <span className="sci">{sciText(m.wrong.a, m.wrong.n)}</span>
                  </p>
                  <p className="mistake-card__row is-ok">
                    <IconCheck /> <Sci a={key.a} n={key.n} />
                  </p>
                  <p className="small">{m.why}</p>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
