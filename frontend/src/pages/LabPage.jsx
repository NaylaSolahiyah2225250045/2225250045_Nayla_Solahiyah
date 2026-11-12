import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fmtSigned, prepareLab, randomLabNumber, readAt, sciSpeech } from '../lib/sci/index.js';
import { LAB_INPUT_ERRORS, LAB_PRESETS, LAB_RULES, LAB_TEXT } from '../content/lab.js';
import PageHero from '../components/PageHero.jsx';
import Decor from '../components/Decor.jsx';
import { logActivity } from '../lib/activity.js';
import MascotLive from '../components/MascotLive.jsx';
import { IconLeft, IconReset, IconRight } from '../components/Icons.jsx';
import { IconFlask, IconShuffle, IconWand } from '../components/NavIcons.jsx';

const AUTO_MS = 650;

/** Koma besar (SVG) agar jelas di semua ukuran layar. */
const CommaShape = () => (
  <svg viewBox='0 0 20 38' aria-hidden='true' focusable='false'>
    <circle cx='10' cy='10' r='9' fill='currentColor' />
    <path d='M18.6 12c.6 9.6-4.6 19.6-13.4 24.4 4.4-5.4 6.2-11 5.6-16.6z' fill='currentColor' />
  </svg>
);
const DEFAULT = '4.500.000';

function loadInitial(q) {
  const r = q ? prepareLab(q) : null;
  return r?.ok ? r.lab : prepareLab(DEFAULT).lab;
}

/** Beberapa bintang hias (berkilau pelan; diam bila Animasi nonaktif). Posisi diatur lewat CSS nth-child. */
const Sparkles = ({ count, className }) => (
  <span className={`lab-sparkles ${className}`} aria-hidden="true">
    {Array.from({ length: count }, (_, i) => (
      <svg key={i} className="lab-sparkle" viewBox="0 0 24 24">
        <path d="M12 1.5l2.3 7.2 7.2 2.3-7.2 2.3L12 22.5l-2.3-9.2L2.5 11l7.2-2.3z" fill="currentColor" />
      </svg>
    ))}
  </span>
);

const dirWord = (k) => (k > 0 ? 'ke kiri' : 'ke kanan');

/** Persamaan "bilangan × 10ᵏ" dengan pangkat berwarna (biru = positif, magenta = negatif). */
function Equation({ text, k, state }) {
  return (
    <span className="lab-eq__main" role="img" aria-label={sciSpeech(text, k)}>
      <span key={text} className={`lab-eq__a is-${state}`} aria-hidden="true">
        {text}
      </span>
      <span className="lab-eq__times" aria-hidden="true">
        ×
      </span>
      <span className="lab-eq__pow" aria-hidden="true">
        10<sup key={k} className={k < 0 ? 'c-neg' : 'c-pos'}>{fmtSigned(k)}</sup>
      </span>
    </span>
  );
}

/**
 * Lab Koma: alat eksplorasi pergeseran koma. Siswa menyeret/menggeser koma pada bilangan
 * berukuran besar dan langsung melihat bilangan baru × 10ᵏ (nilai tetap), jumlah lompatan,
 * posisi a terhadap 1 ≤ a < 10, umpan balik, dan riwayat langkah.
 * Semua angka dihitung lib/sci/lab.js (tanpa floating point).
 */
export default function LabPage() {
  const [params, setParams] = useSearchParams();
  const [lab, setLab] = useState(() => loadInitial(params.get('n')));
  const [p, setP] = useState(lab.originalComma);
  const pRef = useRef(p);
  const [history, setHistory] = useState([]); // [{p, dir}]
  const [last, setLast] = useState(null); // 'left' | 'right' | null
  const [playing, setPlaying] = useState(false);
  const [drag, setDrag] = useState(null); // posisi x (px) koma saat diseret
  const [draft, setDraft] = useState('');
  const [inputError, setInputError] = useState(null);
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const historyRef = useRef(null);

  const n = lab.cells.length;
  const o = lab.originalComma;
  const r = readAt(lab, p);
  const best = Math.abs(o - lab.targetComma);
  const moves = history.length;

  /** Pindahkan koma ke celah t, satu langkah demi satu langkah (dicatat di riwayat). */
  const go = (t, fromAuto = false) => {
    const cur = pRef.current;
    const target = Math.max(0, Math.min(n, t));
    if (!fromAuto) setPlaying(false);
    if (target === cur) return;
    const dir = target < cur ? -1 : 1;
    const steps = [];
    for (let x = cur + dir; ; x += dir) {
      steps.push({ p: x, dir: dir < 0 ? 'left' : 'right' });
      if (x === target) break;
    }
    pRef.current = target;
    setP(target);
    setLast(dir < 0 ? 'left' : 'right');
    setHistory((h) => [...h, ...steps]);
    logActivity('lab', { count: steps.length, label: lab.value });
  };

  const resetTo = (nextLab) => {
    pRef.current = nextLab.originalComma;
    setP(nextLab.originalComma);
    setHistory([]);
    setLast(null);
    setPlaying(false);
    dragging.current = false;
    setDrag(null);
  };

  const loadNumber = (value) => {
    const res = prepareLab(value);
    if (!res.ok) {
      setInputError(LAB_INPUT_ERRORS[res.error]);
      return false;
    }
    setInputError(null);
    setLab(res.lab);
    resetTo(res.lab);
    setParams({ n: res.lab.value }, { replace: true });
    return true;
  };

  // "Tunjukkan caranya": koma melompat sendiri satu langkah per ketukan waktu menuju bentuk baku.
  useEffect(() => {
    if (!playing) return undefined;
    if (p === lab.targetComma) {
      setPlaying(false);
      return undefined;
    }
    const t = setTimeout(() => go(p + Math.sign(lab.targetComma - p), true), AUTO_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, p, lab]);

  // Riwayat: gulir ke langkah terbaru.
  useEffect(() => {
    const el = historyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history.length]);

  /* ---------- Seret koma (sentuh & mouse) ---------- */
  const nearestGap = (clientX) => {
    const gaps = trackRef.current?.querySelectorAll('[data-gap]') ?? [];
    let bestI = pRef.current;
    let bestD = Infinity;
    gaps.forEach((g, i) => {
      const b = g.getBoundingClientRect();
      const d = Math.abs(b.left + b.width / 2 - clientX);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    });
    return bestI;
  };

  const dragXFor = (clientX) => {
    const b = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(b.width, clientX - b.left));
  };

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* penunjuk sintetis/tidak aktif */
    }
    dragging.current = true;
    setPlaying(false);
    setDrag(dragXFor(e.clientX));
    go(nearestGap(e.clientX));
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    setDrag(dragXFor(e.clientX));
    const g = nearestGap(e.clientX);
    if (g !== pRef.current) go(g);
  };

  const endDrag = () => {
    dragging.current = false;
    setDrag(null);
  };

  const onKeyDown = (e) => {
    const map = { ArrowLeft: p - 1, ArrowRight: p + 1, Home: 0, End: n };
    if (e.key in map) {
      e.preventDefault();
      go(map[e.key]);
    }
  };

  /* ---------- Umpan balik ---------- */
  let fbTitle;
  let fbText;
  let fbExtra = null;
  if (r.state === 'normal') {
    fbTitle = LAB_TEXT.normal(r.text);
    if (r.k === 0) fbText = LAB_TEXT.alreadyNormal;
    else {
      fbText = LAB_TEXT.why(Math.abs(r.k), dirWord(r.k), fmtSigned(r.k));
      if (moves > 0) fbExtra = moves === best ? LAB_TEXT.efficient(moves) : LAB_TEXT.detour(moves, best);
    }
  } else {
    fbTitle = r.state === 'big' ? LAB_TEXT.big(r.text, r.stepsLeft) : LAB_TEXT.small(r.text, -r.stepsLeft);
    fbText = last === 'left' ? LAB_TEXT.moveLeft : last === 'right' ? LAB_TEXT.moveRight : LAB_TEXT.start;
  }

  const lo = Math.min(o, p);
  const hi = Math.max(o, p);
  const arcs = [];
  for (let j = lo; j < hi; j++) arcs.push({ j, num: p < o ? o - j : j - o + 1 });
  const arcDir = p < o ? 'left' : 'right';
  const preset = LAB_PRESETS.find((x) => x.value === lab.value);

  return (
    <main className="page page--lab stack">
      <PageHero tone="lab" Icon={IconFlask} title="Lab Koma" decor={<Decor set="lab" />}>
        Geser koma sesukamu. Lihat bagaimana bilangan dan pangkat 10 berubah — nilainya tetap sama!
      </PageHero>

      <section className={`lab-stage is-${r.state}`} aria-labelledby="lab-stage-title">
        {/* Hiasan bintang hanya di sudut luar panggung, jauh dari angka & koma. */}
        <Sparkles count={3} className="lab-sparkles--stage" />
        <div className="lab-stage__top">
          <div>
            <p className="lab-stage__eyebrow">{preset && preset.label !== 'Latihan' ? preset.label : 'Bilangan yang dicoba'}</p>
            <h2 id="lab-stage-title" className="lab-stage__value">
              {lab.value}
            </h2>
          </div>
          <div className="a-meter" role="img" aria-label={`a = ${r.text}: ${r.state === 'normal' ? 'antara 1 dan 10' : r.state === 'big' ? '10 atau lebih' : 'kurang dari 1'}`}>
            <span className={r.state === 'small' ? 'is-on' : ''}>a &lt; 1</span>
            <span className={`a-meter__ok${r.state === 'normal' ? ' is-on' : ''}`}>1 ≤ a &lt; 10</span>
            <span className={r.state === 'big' ? 'is-on' : ''}>a ≥ 10</span>
          </div>
        </div>

        <div className="lab-track-wrap">
          <div
            ref={trackRef}
            className={`lab-track${drag !== null ? ' is-dragging' : ''}${r.state === 'normal' ? ' is-normal' : ''}`}
            style={{ '--n': n, '--p': p, '--o': o }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div className="lab-arcs" aria-hidden="true">
              {arcs.map((a) => (
                <span key={`${arcDir}-${a.j}`} className={`lab-arc lab-arc--${arcDir}`} style={{ '--j': a.j }}>
                  <b>{a.num}</b>
                </span>
              ))}
            </div>
            <div className="lab-row" aria-hidden="true">
              {lab.cells.map((c, i) => (
                <span key={i} className="lab-row__unit">
                  <span className="lab-gap" data-gap={i} />
                  <span className={`lab-cell${i === lab.firstIndex ? ' is-first' : ''}${i < p ? ' is-int' : ''}`} data-kind={c.kind}>
                    {c.d}
                  </span>
                </span>
              ))}
              <span className="lab-gap" data-gap={n} />
            </div>
            {p !== o && (
              <span className="lab-comma lab-comma--ghost" aria-hidden="true">
                <span className="lab-comma__glyph">
                  <CommaShape />
                </span>
              </span>
            )}
            <span
              className="lab-comma"
              role="slider"
              tabIndex={0}
              aria-label="Koma. Geser dengan panah kiri atau kanan"
              aria-valuemin={0}
              aria-valuemax={n}
              aria-valuenow={p}
              aria-valuetext={`${r.text} kali 10 pangkat ${r.k}`}
              onKeyDown={onKeyDown}
              style={drag !== null ? { left: `${drag}px`, transition: 'none' } : undefined}
            >
              <span className="lab-comma__glyph">
                <CommaShape />
              </span>
              <span className="lab-comma__grip" aria-hidden="true" />
            </span>
          </div>
        </div>
        <p className="lab-stage__hint">
          <span aria-hidden="true">↔</span> Seret koma oranye, atau ketuk di antara angka
        </p>

        <div className="lab-eq" aria-live="polite">
          <span className="lab-eq__orig">{lab.value} =</span>
          <Equation text={r.text} k={r.k} state={r.state} />
        </div>

        <ul className="lab-counters" aria-label="Penghitung">
          <li className={r.k > 0 ? 'is-pos' : r.k < 0 ? 'is-neg' : ''}>
            <span>Koma bergeser</span>
            <b>{r.k === 0 ? '0 langkah' : `${Math.abs(r.k)} ${dirWord(r.k)}`}</b>
          </li>
          <li className={r.k > 0 ? 'is-pos' : r.k < 0 ? 'is-neg' : ''}>
            <span>Pangkat 10</span>
            <b>{fmtSigned(r.k)}</b>
          </li>
          <li className={r.state === 'normal' ? 'is-ok' : ''}>
            <span>Ke bentuk baku</span>
            <b>{r.stepsLeft === 0 ? 'Sampai! ✓' : `${Math.abs(r.stepsLeft)} ${r.stepsLeft > 0 ? 'ke kiri' : 'ke kanan'}`}</b>
          </li>
        </ul>

        <div className="lab-controls">
          <button type="button" className="btn btn--outline btn--lg lab-controls__dir" onClick={() => go(p - 1)} disabled={p === 0}>
            <IconLeft /> Geser kiri
          </button>
          <button type="button" className="btn btn--outline btn--lg lab-controls__dir" onClick={() => go(p + 1)} disabled={p === n}>
            Geser kanan <IconRight />
          </button>
          <button type="button" className="btn btn--ghost btn--lg" onClick={() => resetTo(lab)} disabled={p === o && moves === 0}>
            <IconReset /> Reset
          </button>
          <button
            type="button"
            className="btn btn--cta btn--lg btn--pop"
            onClick={() => {
              if (playing) setPlaying(false);
              else {
                if (p === lab.targetComma) resetTo(lab);
                setPlaying(true);
              }
            }}
          >
            <IconWand /> {playing ? 'Jeda' : 'Tunjukkan caranya'}
          </button>
        </div>
      </section>

      <div className="lab-grid">
        <section className={`lab-feedback is-${r.state}`} aria-labelledby="lab-fb-title">
          <div aria-live="polite">
            <p className="lab-feedback__label">Umpan balik</p>
            <h2 id="lab-fb-title">{fbTitle}</h2>
            <p>{fbText}</p>
            {fbExtra && <p className="lab-feedback__extra">{fbExtra}</p>}
          </div>
          {/* Maskot kecil di sudut kartu umpan balik: memberi petunjuk, merayakan saat bentuk baku tercapai.
              Tidak pernah di panggung visualisasi (CLAUDE.md §2). */}
          <div className="lab-feedback__mascot">
            <MascotLive
              key={r.state === 'normal' ? 'yay' : 'hint'}
              variant={r.state === 'normal' ? 'thumb' : 'head'}
              size={r.state === 'normal' ? 66 : 58}
              celebrate={r.state === 'normal'}
              bubble="none"
            />
          </div>
        </section>

        <section className="card lab-picker stack-s" aria-labelledby="lab-pick-title">
          <h2 id="lab-pick-title">Coba bilangan lain</h2>
          {['besar', 'kecil'].map((g) => (
            <div key={g}>
              <p className="small muted lab-picker__group">Bilangan {g}</p>
              <div className="lab-chips">
                {LAB_PRESETS.filter((x) => x.group === g).map((x) => (
                  <button
                    key={x.value}
                    type="button"
                    className={`lab-chip${x.value === lab.value ? ' is-on' : ''}`}
                    aria-pressed={x.value === lab.value}
                    onClick={() => loadNumber(x.value)}
                  >
                    <b>{x.value}</b>
                    {x.label !== 'Latihan' && <span>{x.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <form
            className="lab-input"
            onSubmit={(e) => {
              e.preventDefault();
              if (loadNumber(draft)) setDraft('');
            }}
          >
            <label htmlFor="lab-own" className="small">
              <b>Bilanganmu sendiri</b>
            </label>
            <div className="lab-input__row">
              <input
                id="lab-own"
                className="input"
                inputMode="decimal"
                placeholder="mis. 72.000 atau 0,0091"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setInputError(null);
                }}
                aria-invalid={!!inputError}
                aria-describedby={inputError ? 'lab-own-err' : undefined}
              />
              <button type="submit" className="btn btn--primary">
                Coba
              </button>
              <button type="button" className="btn btn--outline" onClick={() => loadNumber(randomLabNumber())} aria-label="Bilangan acak">
                <IconShuffle /> Acak
              </button>
            </div>
            {inputError && (
              <p className="form-field__error" id="lab-own-err" role="alert">
                {inputError}
              </p>
            )}
          </form>
        </section>

        <section className="card lab-history" aria-labelledby="lab-hist-title">
          <div className="row row--between">
            <h2 id="lab-hist-title">Riwayat langkah</h2>
            <span className="chip">{moves} geseran</span>
          </div>
          <ol className="lab-history__list" ref={historyRef}>
            <li>
              <span className="lab-history__no">Awal</span>
              <span className="lab-history__dir" />
              <Equation text={readAt(lab, o).text} k={0} state={readAt(lab, o).state} />
            </li>
            {history.map((h, i) => {
              const hr = readAt(lab, h.p);
              return (
                <li key={i} className={hr.state === 'normal' ? 'is-normal' : ''}>
                  <span className="lab-history__no">{i + 1}</span>
                  <span className={`lab-history__dir is-${h.dir}`}>{h.dir === 'left' ? '← kiri' : 'kanan →'}</span>
                  <Equation text={hr.text} k={hr.k} state={hr.state} />
                </li>
              );
            })}
          </ol>
        </section>

        <section className="card lab-rules stack-s" aria-labelledby="lab-rules-title">
          <h2 id="lab-rules-title">Kenapa begitu?</h2>
          <ul>
            {LAB_RULES.map((x) => (
              <li key={x.title} className={`lab-rule lab-rule--${x.tone}`}>
                <b>{x.title}</b>
                <span>{x.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
