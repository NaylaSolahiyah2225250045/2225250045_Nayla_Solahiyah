import { useEffect, useMemo, useRef, useState } from 'react';
import { shiftInfo, parseStandard, toScientific } from '../lib/sci/index.js';
import NumberStrip from './NumberStrip.jsx';
import { Sci } from './Sci.jsx';
import { IconLeft, IconPause, IconPlay, IconReset, IconRight } from './Icons.jsx';

const STEP_MS = 650;

/**
 * Visualisasi Geser Koma (F-03): koma melompat satu sel per langkah dari posisi asal
 * ke tepat setelah angka bukan nol pertama, dengan penghitung lompatan & tanda pangkat.
 *
 * Props: value (bentuk biasa), autoPlay, showPositions (nomor posisi nol depan), compact
 */
export default function CommaVisualizer({ value, autoPlay = false, showPositions, compact = false }) {
  const info = useMemo(() => shiftInfo(value), [value]);
  const sci = useMemo(() => {
    const x = parseStandard(value);
    return x ? toScientific(x) : null;
  }, [value]);
  const [pos, setPos] = useState(info?.originalComma ?? 0);
  const [playing, setPlaying] = useState(autoPlay);
  const timer = useRef(null);

  useEffect(() => {
    setPos(info?.originalComma ?? 0);
    setPlaying(autoPlay);
  }, [info, autoPlay]);

  useEffect(() => {
    if (!playing || !info) return undefined;
    if (pos === info.targetComma) {
      setPlaying(false);
      return undefined;
    }
    timer.current = setTimeout(() => setPos((p) => p + Math.sign(info.targetComma - p)), STEP_MS);
    return () => clearTimeout(timer.current);
  }, [playing, pos, info]);

  if (!info || !sci) return null;

  const moved = info.originalComma - pos; // >0: ke kiri (pangkat +), <0: ke kanan (pangkat −)
  const done = pos === info.targetComma;
  const isSmall = sci.n < 0;
  const positionsOn = showPositions ?? isSmall;
  const maxPos = info.cells.length;

  const step = (dir) => {
    setPlaying(false);
    setPos((p) => Math.min(maxPos, Math.max(0, p + dir)));
  };

  const reset = () => {
    setPlaying(false);
    setPos(info.originalComma);
  };

  const togglePlay = () => {
    if (done) {
      setPos(info.originalComma);
      setPlaying(true);
    } else setPlaying((p) => !p);
  };

  const dirText = moved > 0 ? 'ke kiri' : moved < 0 ? 'ke kanan' : '';
  const expText = moved > 0 ? `+${moved}` : moved < 0 ? `−${Math.abs(moved)}` : '0';

  return (
    <div className="viz">
      <NumberStrip
        cells={info.cells}
        comma={pos}
        ghostComma={info.originalComma}
        trail={moved !== 0 ? { from: info.originalComma, to: pos } : null}
        positions={positionsOn}
        markZeros={done}
        label={`Bilangan ${value}, koma sekarang setelah angka ke-${pos}`}
      />
      <div className="viz__counter" aria-live="polite">
        <span className="jumps">
          Lompatan: <b>{Math.abs(moved)}</b> {dirText}
        </span>
        <span className={moved < 0 ? 'neg' : 'pos'}>pangkat {expText}</span>
      </div>
      {done && (
        <p className="viz__result">
          {value} = <Sci a={sci.a} n={sci.n} />
        </p>
      )}
      {!compact && (
        <>
          <div className="viz__controls">
            <button type="button" className="btn btn--primary" onClick={togglePlay}>
              {playing ? <IconPause /> : <IconPlay />}
              {playing ? 'Jeda' : done ? 'Putar lagi' : 'Putar'}
            </button>
            <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="Geser koma ke kiri">
              <IconLeft />
            </button>
            <button type="button" className="icon-btn" onClick={() => step(1)} aria-label="Geser koma ke kanan">
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
              <b className="c-lead">{info.cells[info.firstIndex].d}</b> angka bukan nol pertama
            </span>
            <span>
              <b className="c-zero">0</b> nol yang dibuang
            </span>
            {positionsOn && (
              <span>
                <b className="c-neg">1 2 3</b> posisi setelah koma
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
