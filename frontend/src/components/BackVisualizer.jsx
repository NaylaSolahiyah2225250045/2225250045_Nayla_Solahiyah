import { useEffect, useMemo, useState } from 'react';
import { backResult, shiftInfo } from '../lib/sci/index.js';
import NumberStrip from './NumberStrip.jsx';
import { Sci } from './Sci.jsx';
import { IconPause, IconPlay, IconReset, IconRight } from './Icons.jsx';

const STEP_MS = 650;

/**
 * Visual "kembali ke bentuk biasa" (Modul 5): koma mulai tepat setelah angka pertama a,
 * lalu melompat kembali ke tempat asalnya. Tempat kosong tampil sebagai kotak putus-putus
 * dan terisi nol saat dilewati; setiap lompatan diberi nomor (bantuan hitung nol).
 * Semua posisi dihitung dari lib/sci (shiftInfo hasil bentuk biasa).
 *
 * Props: a (mantisa), n (pangkat), autoPlay
 */
export default function BackVisualizer({ a, n, autoPlay = false }) {
  const result = useMemo(() => backResult(a, n), [a, n]);
  const info = useMemo(() => (result ? shiftInfo(result) : null), [result]);
  const start = info?.targetComma ?? 0; // koma pada a: tepat setelah angka bukan nol pertama
  const end = info?.originalComma ?? 0; // koma pada bentuk biasa
  const [pos, setPos] = useState(start);
  const [playing, setPlaying] = useState(autoPlay);

  useEffect(() => {
    setPos(start);
    setPlaying(autoPlay);
  }, [start, autoPlay]);

  useEffect(() => {
    if (!playing) return undefined;
    if (pos === end) {
      setPlaying(false);
      return undefined;
    }
    const t = setTimeout(() => setPos((p) => p + Math.sign(end - p)), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, pos, end]);

  if (!info) return null;

  const right = end > start;
  const jumps = Math.abs(pos - start);
  const done = pos === end;

  // Sel nol tambahan (di luar angka a) baru "terisi" setelah koma melewatinya.
  const reached = (i) => (right ? pos > i : pos <= i || (done && i < end));
  const cells = info.cells.map((c, i) => {
    const added = right ? c.kind === 'trail' : c.kind === 'lead';
    if (!added) return c;
    return reached(i) ? { d: '0', kind: 'added' } : { d: '', kind: 'pending' };
  });
  // Nomor lompatan di atas sel yang dilewati koma.
  const numbers = info.cells.map((_, i) => {
    if (right) return i >= start && i < pos ? i - start + 1 : null;
    return i < start && i >= pos ? start - i : null;
  });

  const togglePlay = () => {
    if (done) {
      setPos(start);
      setPlaying(true);
    } else setPlaying((p) => !p);
  };
  const step = () => {
    setPlaying(false);
    setPos((p) => (p === end ? p : p + Math.sign(end - p)));
  };
  const reset = () => {
    setPlaying(false);
    setPos(start);
  };

  return (
    <div className="viz">
      <NumberStrip
        cells={cells}
        comma={pos}
        ghostComma={start}
        trail={pos !== start ? { from: start, to: pos } : null}
        numbers={numbers}
        label={`${a} kali 10 pangkat ${n}: koma sudah melompat ${jumps} kali ke ${right ? 'kanan' : 'kiri'}`}
      />
      <div className="viz__counter" aria-live="polite">
        <span className="jumps">
          Lompatan: <b>{jumps}</b> dari {Math.abs(end - start)} ke {right ? 'kanan' : 'kiri'}
        </span>
        <span className={n < 0 ? 'neg' : 'pos'}>pangkat {n < 0 ? `−${-n}` : n}</span>
      </div>
      {done && (
        <p className="viz__result">
          <Sci a={a} n={n} /> = {result}
        </p>
      )}
      <div className="viz__controls">
        <button type="button" className="btn btn--primary" onClick={togglePlay}>
          {playing ? <IconPause /> : <IconPlay />}
          {playing ? 'Jeda' : done ? 'Putar lagi' : 'Putar'}
        </button>
        <button type="button" className="icon-btn" onClick={step} aria-label="Lompat satu kali" disabled={done}>
          <IconRight />
        </button>
        <button type="button" className="icon-btn" onClick={reset} aria-label="Ulang dari awal">
          <IconReset />
        </button>
      </div>
      <div className="legend" aria-hidden="true">
        <span>
          <b className="c-comma">,</b> koma
        </span>
        <span>
          <b className="c-lead">{a.replace(',', '')[0]}</b> angka pertama a
        </span>
        <span>
          <b className="c-added">0</b> nol tambahan
        </span>
        <span>
          <b className="c-neg">1 2 3</b> nomor lompatan
        </span>
      </div>
    </div>
  );
}
