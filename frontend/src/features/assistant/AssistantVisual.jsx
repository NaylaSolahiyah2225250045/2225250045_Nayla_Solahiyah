import { Pow10 } from '../../components/Sci.jsx';

/**
 * Visual matematika di dalam percakapan Asisten Belajar (RMT: Mathematically Specific Psychological Tools).
 * Data dibuat & dihitung aplikasi (lib/assistantVisuals.js) — berisi CONTOH SERUPA, bukan soal siswa.
 * Signaling konsisten (CLAUDE.md §2): koma = warna koma, angka bukan nol pertama = warna digit, nol = abu-abu.
 * @param {{ v: import('../../lib/assistantVisuals.js').Visual }} props
 */
export default function AssistantVisual({ v }) {
  const Body = BODIES[v.data.kind];
  if (!Body) return null;
  return (
    <figure className="av" aria-label={v.summary}>
      <figcaption className="av__cap">
        {v.label} <span className="av__tag">contoh serupa</span>
      </figcaption>
      <div className="av__body" aria-hidden="true">
        <Body d={v.data} />
      </div>
    </figure>
  );
}

const roleClass = (role) => (role === 'first' ? 'av-d--first' : role === 'zero' || role === 'lead' || role === 'trail' ? 'av-d--zero' : role === 'middle' ? 'av-d--middle' : '');

function PlaceTable({ d }) {
  const cells = [];
  if (!d.hasInt) cells.push({ key: 'z', head: null, text: '0,', cls: 'av-d--zero' });
  d.cols.forEach((c, i) => {
    cells.push({ key: `c${i}`, head: <Pow10 n={c.exp} colorExp={false} />, text: c.d, cls: roleClass(c.role) });
    if (c.exp === 0 && d.cols[i + 1]) cells.push({ key: 'comma', head: null, text: ',', cls: 'av-comma' });
  });
  return (
    <div className="av-scroll">
      <table className="av-table">
        <thead>
          <tr>
            {cells.map((c) => (
              <th key={c.key} scope="col">
                {c.head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {cells.map((c) => (
              <td key={c.key} className={`av-d ${c.cls}`}>
                {c.text}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="av-note">
        Bilangan {d.value}: setiap angka bernilai angka itu × nilai tempatnya.
      </p>
    </div>
  );
}

function Zeros({ d }) {
  if (d.n >= 0) {
    return (
      <div className="av-zeros">
        <p className="av-eq">
          <Pow10 n={d.n} /> =
        </p>
        <p className="av-groups">
          {d.groups.map((g, i) => (
            <span key={i} className="av-group">
              {g.split('').map((ch, j) => (
                <span key={j} className={`av-d ${ch === '0' ? 'av-d--zero' : 'av-d--first'}`}>
                  {ch}
                </span>
              ))}
              {i < d.groups.length - 1 && <span className="av-sep">.</span>}
            </span>
          ))}
        </p>
        <p className="av-note">Angka 1 diikuti {d.n} angka nol, dikelompokkan tiga-tiga dari kanan.</p>
      </div>
    );
  }
  const frac = d.text.split(',')[1].split('');
  return (
    <div className="av-zeros">
      <p className="av-eq">
        <Pow10 n={d.n} /> =
      </p>
      <p className="av-groups">
        <span className="av-d av-d--zero">0</span>
        <span className="av-d av-comma">,</span>
        {frac.map((ch, i) => (
          <span key={i} className="av-pos">
            <span className={`av-d ${ch === '0' ? 'av-d--zero' : 'av-d--first'}`}>{ch}</span>
            <span className="av-pos__n">{i + 1}</span>
          </span>
        ))}
      </p>
      <p className="av-note">Angka 1 ada di posisi ke-{d.positions} setelah koma.</p>
    </div>
  );
}

function NumberLine({ d }) {
  return (
    <div>
      <ol className="av-line">
        {d.points.map((p) => (
          <li key={p.n} className="av-line__pt">
            <span className="av-line__pow">
              <Pow10 n={p.n} />
            </span>
            <span className="av-line__tick" />
            <span className="av-line__val">{p.text}</span>
          </li>
        ))}
      </ol>
      <p className="av-line__dir">
        <span>← lebih kecil (: 10)</span>
        <span>lebih besar (× 10) →</span>
      </p>
    </div>
  );
}

function Shift({ d }) {
  // Koma bergerak dari `from` ke `to` (celah 0 = sebelum sel pertama).
  const from = d.reverse ? d.targetComma : d.originalComma;
  const to = d.reverse ? d.originalComma : d.targetComma;
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const left = to < from;
  const jumpNo = (i) => (left ? from - i : i - from + 1);
  return (
    <div>
      <p className="av-eq">
        {d.reverse ? (
          <>
            {d.a} × <Pow10 n={d.n} />
          </>
        ) : (
          d.value
        )}{' '}
        →{' '}
        {d.reverse ? (
          d.value
        ) : (
          <>
            {d.a} × <Pow10 n={d.n} />
          </>
        )}
      </p>
      <div className="av-scroll">
        <div className="av-shift">
          {d.cells.map((c, i) => (
            <span key={i} className="av-shift__cell">
              <span className="av-shift__jump">{i >= lo && i < hi ? `${left ? '↶' : '↷'}${jumpNo(i)}` : ''}</span>
              <span className="av-shift__row">
                {i === from && i !== to && <span className="av-comma av-comma--old">,</span>}
                {i === to && <span className="av-d av-comma">,</span>}
                <span className={`av-d ${roleClass(c.kind)}`}>{c.d}</span>
                {i === d.cells.length - 1 && from === d.cells.length && to !== from && <span className="av-comma av-comma--old">,</span>}
                {i === d.cells.length - 1 && to === d.cells.length && <span className="av-d av-comma">,</span>}
              </span>
            </span>
          ))}
        </div>
      </div>
      <p className="av-note">
        Koma {left ? 'melompat ke kiri' : 'bergeser ke kanan'} {Math.abs(d.jumps)} kali (koma pudar = tempat awal).
      </p>
    </div>
  );
}

function Steps({ d }) {
  return (
    <ol className="av-steps">
      {d.rows.map(([step, result], i) => (
        <li key={i}>
          <span className="av-steps__label">{step}</span>
          <span className="av-math">{result}</span>
        </li>
      ))}
    </ol>
  );
}

function Flow({ d }) {
  return (
    <ol className="av-flow">
      {d.lines.map((l, i) => (
        <li key={i} className="av-flow__step">
          {i > 0 && <span className="av-flow__arrow">↓ {l.label}</span>}
          <span className={`av-math${i === d.lines.length - 1 ? ' av-math--end' : ''}`}>{l.text}</span>
        </li>
      ))}
    </ol>
  );
}

function Pmstp({ d }) {
  return (
    <table className="av-table av-table--pmstp">
      <tbody>
        {d.rows.map((r, i) => (
          <tr key={r.step}>
            <th scope="row">
              {i + 1}. {r.step}
            </th>
            <td>{r.ask}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const BODIES = {
  'nilai-tempat': PlaceTable,
  'kelompok-nol': Zeros,
  'garis-bilangan': NumberLine,
  'geser-koma': Shift,
  'ubah-bentuk': Steps,
  'kali-bagi': Flow,
  'tambah-kurang': Flow,
  pmstp: Pmstp,
};
