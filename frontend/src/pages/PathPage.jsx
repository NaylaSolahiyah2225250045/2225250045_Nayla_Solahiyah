import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearner, AVAILABLE_MODULES } from '../lib/learner.js';
import { FINAL_QUIZ, PASS_COUNT, PER_SESSION } from '../content/bank.js';
import { nodeLabel, nodeRoute } from '../lib/path.js';
import MascotLive from '../components/MascotLive.jsx';
import Decor from '../components/Decor.jsx';
import { IconCheck, IconLock } from '../components/Icons.jsx';
import { IconFlag, IconRoute, IconStar } from '../components/NavIcons.jsx';

const SIGN_H = 96; // tinggi papan modul
const STEP_H = 116; // jarak antar titik
const TOP = 70; // ruang bendera start

/** Papan untuk titik Kuis Akhir di ujung jalur. */
const FINAL_SIGN = { id: 'final', label: 'Level 5', title: 'Kuis Akhir · Semua Topik' };

/** Susun posisi: papan topik lalu titik latihannya berkelok, terakhir Kuis Akhir (x dalam %, y dalam px). */
function layout(path) {
  const rows = [];
  let y = TOP;
  let i = 0;
  const groups = [
    ...AVAILABLE_MODULES.map((m) => ({ sign: { id: m.id, label: `Topik ${m.no}`, title: m.title }, nodes: path.filter((n) => n.moduleId === m.id) })),
    { sign: FINAL_SIGN, nodes: path.filter((n) => n.kind === 'final') },
  ];
  for (const g of groups) {
    rows.push({ type: 'sign', sign: g.sign, y: y + SIGN_H / 2 - 14 });
    y += SIGN_H;
    for (const node of g.nodes) {
      const x = 50 + Math.round(Math.sin(i * 0.95) * 27);
      rows.push({ type: 'node', node, x, y: y + STEP_H / 2 });
      y += STEP_H;
      i++;
    }
  }
  return { rows, height: y + 90 };
}

function curve(points) {
  if (!points.length) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let k = 1; k < points.length; k++) {
    const a = points[k - 1];
    const b = points[k];
    const my = (a.y + b.y) / 2;
    d += ` C ${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`;
  }
  return d;
}

/** Latihan: jalur perjalanan berkelok; setiap titik = satu tahapan latihan. */
export default function PathPage() {
  const navigate = useNavigate();
  const { path, statuses, nodesDone, currentNode } = useLearner();
  const [toast, setToast] = useState(null);
  const { rows, height } = layout(path);
  const nodes = rows.filter((r) => r.type === 'node');
  const curIdx = nodes.findIndex((r) => statuses[r.node.id] === 'current');
  const allPts = nodes.map((r) => ({ x: r.x, y: r.y }));
  const donePts = curIdx >= 0 ? allPts.slice(0, curIdx + 1) : allPts;
  const curRow = curIdx >= 0 ? nodes[curIdx] : null;

  const open = (node) => {
    const st = statuses[node.id];
    if (st === 'locked') {
      setToast('Titik ini masih terkunci. Selesaikan titik sebelumnya dulu, ya!');
      setTimeout(() => setToast(null), 2600);
      return;
    }
    navigate(nodeRoute(node));
  };

  return (
    <main className="page page--wide stack">
      <header className="page-hero page-hero--learn page-hero--decor">
        <Decor set="path" />
        <span className="page-hero__icon" aria-hidden="true">
          <IconRoute />
        </span>
        <div className="page-hero__text">
          <h1>Jalur Latihan</h1>
          <p>Ikuti jalannya titik demi titik. Tekan titik yang menyala untuk mulai.</p>
        </div>
      </header>

      <div className="path-layout">
        <aside className="path-side card">
          <div className="path-side__ring" style={{ '--pct': Math.round((nodesDone / path.length) * 100) }}>
            <b>
              {nodesDone}/{path.length}
            </b>
            <span>titik selesai</span>
          </div>
          <ul className="path-legend" aria-label="Keterangan">
            <li>
              <span className="path-dot is-done" aria-hidden="true" /> Sudah selesai
            </li>
            <li>
              <span className="path-dot is-current" aria-hidden="true" /> Sedang dikerjakan
            </li>
            <li>
              <span className="path-dot is-locked" aria-hidden="true" /> Belum terbuka
            </li>
          </ul>
          <p className="small muted">
            Setiap topik punya satu latihan berisi {PER_SESSION} soal, berurutan dari mudah ke sulit. Lulus bila minimal {PASS_COUNT} benar. Di ujung jalur ada Level 5 · Kuis Akhir ({FINAL_QUIZ.length} soal, semua topik). Jawaban yang salah langsung dibahas.
          </p>
          {currentNode && (
            <button type="button" className="btn btn--primary btn--block" onClick={() => open(currentNode)}>
              Lanjutkan: {nodeLabel(currentNode)}
            </button>
          )}
        </aside>

        <section className="path-map" style={{ height }} aria-label="Peta jalur latihan">
          <svg className="path-map__svg" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={curve(allPts)} className="path-map__road" vectorEffect="non-scaling-stroke" />
            <path d={curve(allPts)} className="path-map__dash" vectorEffect="non-scaling-stroke" />
            <path d={curve(donePts)} className="path-map__done" vectorEffect="non-scaling-stroke" />
          </svg>

          <div className="path-start" style={{ top: 18 }} aria-hidden="true">
            <IconFlag /> Mulai
          </div>

          {rows.map((r) =>
            r.type === 'sign' ? (
              <div key={r.sign.id} className={`path-sign${r.sign.id === 'final' ? ' path-sign--final' : ''}`} style={{ top: r.y }}>
                <span className="path-sign__no">{r.sign.label}</span>
                <span className="path-sign__title">{r.sign.title}</span>
              </div>
            ) : (
              <button
                key={r.node.id}
                type="button"
                className={`path-node path-node--${r.node.kind} is-${statuses[r.node.id]}`}
                style={{ left: `${r.x}%`, top: r.y }}
                onClick={() => open(r.node)}
                aria-disabled={statuses[r.node.id] === 'locked'}
                aria-label={`${nodeLabel(r.node)}: ${
                  { done: 'sudah selesai', current: 'sedang dikerjakan, tekan untuk mulai', locked: 'terkunci' }[statuses[r.node.id]]
                }`}
              >
                <span className="path-node__disc">
                  {statuses[r.node.id] === 'done' ? (
                    <IconCheck />
                  ) : statuses[r.node.id] === 'locked' ? (
                    <IconLock />
                  ) : r.node.kind === 'final' ? (
                    <IconStar />
                  ) : (
                    <b>{r.node.level}</b>
                  )}
                </span>
                {statuses[r.node.id] === 'current' && <span className="path-node__tag">Mulai!</span>}
                <span className="path-node__label">
                  <b>{r.node.title}</b>
                  <span>{r.node.subtitle}</span>
                </span>
              </button>
            ),
          )}

          {curRow && (
            <div className={`path-mascot${curRow.x > 50 ? ' is-left' : ''}`} style={{ left: `${curRow.x}%`, top: curRow.y }}>
              <MascotLive poses={['jump', 'point', 'cheer']} size={64} bubble="none" />
            </div>
          )}

          <div className="path-finish" style={{ top: height - 56 }} aria-hidden="true">
            🏁 Garis finis
          </div>
        </section>
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
