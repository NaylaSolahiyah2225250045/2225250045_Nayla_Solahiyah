import { Link } from 'react-router-dom';
import { BOOK_PAGES, CHAPTERS } from '../../content/book.js';
import {
  backResult,
  backSteps,
  compareValues,
  operationKey,
  operationSteps,
  splitDecimal,
  valueOf,
  groupThousands,
  parseScientific,
  parseStandard,
  shiftInfo,
  toScientific,
  toStandard,
  workedSteps,
  zeroSteps,
} from '../../lib/sci/index.js';
import ZeroRoles from '../../components/ZeroRoles.jsx';
import { Pow10, Sci } from '../../components/Sci.jsx';
import NumberStrip from '../../components/NumberStrip.jsx';
import Mascot from '../../components/Mascot.jsx';
import { IconBulb } from '../../components/Icons.jsx';

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n) => String(n).split('').map((c) => SUP[c] ?? c).join('');

function Power({ base, exp }) {
  const result = groupThousands((BigInt(base) ** BigInt(exp)).toString());
  const factors = Array.from({ length: exp }, () => base).join(' × ');
  return (
    <p className="bk-power" aria-label={`${base} pangkat ${exp} sama dengan ${factors.replaceAll('×', 'kali')} sama dengan ${result}`}>
      <span aria-hidden="true">
        <b className="bk-base">{base}</b>
        <sup className="bk-exp">{exp}</sup> = {factors} = <b className="bk-result">{result}</b>
      </span>
    </p>
  );
}

function Anatomy() {
  return (
    <div className="bk-anatomy" role="img" aria-label="a pangkat n: a adalah basis, n adalah pangkat">
      <span className="bk-anatomy__exp-label" aria-hidden="true">
        pangkat
      </span>
      <span className="bk-anatomy__formula" aria-hidden="true">
        <b className="bk-base">a</b>
        <sup className="bk-exp">n</sup>
      </span>
      <span className="bk-anatomy__base-label" aria-hidden="true">
        basis
      </span>
    </div>
  );
}

function TenTable({ from, to }) {
  const step = from <= to ? 1 : -1;
  const rows = [];
  for (let n = from; step > 0 ? n <= to : n >= to; n += step) rows.push(n);
  return (
    <table className="bk-table">
      <tbody>
        {rows.map((n) => (
          <tr key={n}>
            <td>
              <Pow10 n={n} />
            </td>
            <td aria-hidden="true">=</td>
            <td className="bk-table__val">{toStandard({ sign: 1, digits: '1', exp: n })}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Convert({ value, focus }) {
  const x = parseStandard(value);
  const { a, n } = toScientific(x);
  const info = shiftInfo(value);
  return (
    <div className="bk-convert">
      <p className="bk-convert__eq">
        <span className="sci">{value}</span> = <Sci a={a} n={n} />
      </p>
      <NumberStrip
        cells={info.cells}
        comma={info.targetComma}
        ghostComma={info.originalComma}
        trail={{ from: info.originalComma, to: info.targetComma }}
        markZeros
        label={`${value}: koma pindah ke setelah angka bukan nol pertama`}
      />
      <ol className="bk-steps">
        {(focus === 'zero' ? zeroSteps(value) : workedSteps(value)).map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Bentuk baku → bentuk biasa (Bab 4): jalur koma dari a ke tempat asal, nol tambahan disorot,
 * nomor lompatan di atas sel, lalu langkah dari lib/sci (backSteps). Statis seperti blok convert.
 */
function BackWork({ a, n }) {
  const result = backResult(a, n);
  const info = shiftInfo(result);
  const start = info.targetComma;
  const end = info.originalComma;
  const right = end > start;
  const cells = info.cells.map((c) => ((right ? c.kind === 'trail' : c.kind === 'lead') ? { d: '0', kind: 'added' } : c));
  const numbers = info.cells.map((_, i) => {
    if (right) return i >= start && i < end ? i - start + 1 : null;
    return i < start && i >= end ? start - i : null;
  });
  return (
    <div className="bk-convert">
      <p className="bk-convert__eq">
        <Sci a={a} n={n} /> = <span className="sci">{result}</span>
      </p>
      <NumberStrip
        cells={cells}
        comma={end}
        ghostComma={start}
        trail={{ from: start, to: end }}
        numbers={numbers}
        label={`${a} kali 10 pangkat ${n}: koma melompat ${Math.abs(end - start)} kali ke ${right ? 'kanan' : 'kiri'}`}
      />
      <ol className="bk-steps">
        {backSteps(a, n).map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </div>
  );
}

/** Setiap angka dengan nilai tempatnya (Bab 1). Pangkat dihitung dari posisi angka terhadap koma. */
function Places({ value }) {
  const p = splitDecimal(value);
  const cells = [...p.int.split('').map((d, i) => ({ d, n: p.int.length - 1 - i })), ...p.frac.split('').map((d, i) => ({ d, n: -(i + 1) }))];
  return (
    <div className="bk-places" role="img" aria-label={`Nilai tempat angka-angka pada ${value}`}>
      {cells.map((c, i) => (
        <span key={i} className={`bk-places__cell${c.n === -1 ? ' is-after-comma' : ''}`}>
          <b>{c.d}</b>
          <Pow10 n={c.n} />
        </span>
      ))}
    </div>
  );
}

/** Bilangan = jumlah (angka × 10ⁿ) untuk angka bukan nol (Bab 1). */
function Expand({ value }) {
  const p = splitDecimal(value);
  const all = p.int + p.frac;
  const terms = all
    .split('')
    .map((d, i) => ({ d, n: p.int.length - 1 - i }))
    .filter((t) => t.d !== '0');
  return (
    <p className="bk-expand">
      <span className="sci">{value}</span> ={' '}
      {terms.map((t, i) => (
        <span key={i}>
          {i > 0 && ' + '}
          <Sci a={t.d} n={t.n} />
        </span>
      ))}
    </p>
  );
}

/** Urutan bilangan bentuk baku dari terbesar, dengan bentuk biasanya (Bab 2). */
function Compare({ items }) {
  const sorted = [...items].sort((x, y) => compareValues(valueOf(y), valueOf(x)));
  return (
    <ol className="bk-compare" aria-label="Urutan dari yang terbesar">
      {sorted.map((p, i) => (
        <li key={i}>
          <Sci a={p.a} n={p.n} />
          <span className="bk-compare__eq">= {toStandard(valueOf(p))}</span>
          {i < sorted.length - 1 && (
            <span className="bk-compare__gt" aria-hidden="true">
              &gt;
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Contoh kali/bagi bentuk baku (Bab 4–5): soal → hasil → langkah dari lib/sci. */
function Operation({ q }) {
  const key = operationKey(q);
  return (
    <div className="bk-convert">
      {q.text && <p className="bk-p">{q.text}</p>}
      <p className="bk-convert__eq bk-op__eq">
        (<Sci a={q.x.a} n={q.x.n} />) {q.op === 'kali' ? '×' : ':'} (<Sci a={q.y.a} n={q.y.n} />) = <Sci a={key.a} n={key.n} />
        {q.unit ? ` ${q.unit}` : ''}
      </p>
      <ol className="bk-steps">
        {operationSteps(q).map((st) => (
          <li key={st}>{st}</li>
        ))}
      </ol>
    </div>
  );
}

/** Latihan singkat di akhir bab: soal + pembahasan yang bisa dibuka (hasil & langkah dari lib/sci). */
function TryIt({ items }) {
  return (
    <ol className="bk-try">
      {items.map((it) => {
        const isOp = it.op !== undefined;
        const isBack = !isOp && it.a !== undefined;
        const answer = isOp ? operationKey(it) : isBack ? backResult(it.a, it.n) : toScientific(parseStandard(it.value));
        const steps = isOp ? operationSteps(it) : isBack ? backSteps(it.a, it.n) : zeroSteps(it.value);
        const key = isOp ? `${it.op}${it.x.a}e${it.x.n}${it.y.a}e${it.y.n}` : isBack ? `${it.a}e${it.n}` : it.value;
        return (
          <li key={key}>
            <details>
              <summary>
                <span className="bk-try__q">
                  {isOp ? (
                    it.text ? (
                      <span className="bk-try__text">{it.text}</span>
                    ) : (
                      <>
                        (<Sci a={it.x.a} n={it.x.n} />) {it.op === 'kali' ? '×' : ':'} (<Sci a={it.y.a} n={it.y.n} />)
                      </>
                    )
                  ) : isBack ? (
                    <Sci a={it.a} n={it.n} />
                  ) : (
                    <span className="sci">{it.value}</span>
                  )}
                </span>
                <span className="bk-try__open">Pembahasan</span>
              </summary>
              <p className="bk-try__a">
                Jawaban: {isBack ? <span className="sci">{answer}</span> : <Sci a={answer.a} n={answer.n} />}
                {isOp && it.unit ? ` ${it.unit}` : ''}
              </p>
              <ol className="bk-steps">
                {steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </details>
          </li>
        );
      })}
    </ol>
  );
}

function Block({ b }) {
  switch (b.t) {
    case 'h':
      return <h2 className="bk-h">{b.text}</h2>;
    case 'p':
      return <p className="bk-p">{b.text}</p>;
    case 'power':
      return <Power base={b.base} exp={b.exp} />;
    case 'anatomy':
      return <Anatomy />;
    case 'tenTable':
      return <TenTable from={b.from} to={b.to} />;
    case 'formula':
      return (
        <div className="bk-formula">
          <p className="bk-formula__main" aria-label="a kali 10 pangkat n">
            <span aria-hidden="true">
              <b className="bk-base">a</b> × 10<sup className="bk-exp">n</sup>
            </span>
          </p>
          <p className="bk-formula__rules">
            <span>1 ≤ a &lt; 10</span>
            <span>n bilangan bulat</span>
          </p>
        </div>
      );
    case 'convert':
      return <Convert value={b.value} focus={b.focus} />;
    case 'list': {
      const List = b.ordered ? 'ol' : 'ul';
      return (
        <List className={`bk-list${b.ordered ? ' bk-list--ordered' : ''}`}>
          {b.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </List>
      );
    }
    case 'zeros':
      return (
        <div className="bk-convert bk-zeros">
          <ZeroRoles value={b.value} />
        </div>
      );
    case 'backWork':
      return <BackWork a={b.a} n={b.n} />;
    case 'places':
      return <Places value={b.value} />;
    case 'expand':
      return <Expand value={b.value} />;
    case 'compare':
      return <Compare items={b.items} />;
    case 'rule':
      return (
        <div className="bk-rule">
          {b.lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      );
    case 'op':
      return <Operation q={b} />;
    case 'units':
      return (
        <table className="bk-table bk-units">
          <tbody>
            {b.rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td aria-hidden="true">=</td>
                <td className="bk-table__val">
                  <Pow10 n={r.n} />
                  {r.unit ? ` ${r.unit}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'try':
      return <TryIt items={b.items} />;
    case 'back': {
      const v = toStandard(parseScientific(b.a, b.n).value);
      return (
        <p className="bk-back">
          <Sci a={b.a} n={b.n} /> = <b className="sci">{v}</b>
        </p>
      );
    }
    case 'facts':
      return (
        <ul className="bk-facts">
          {b.items.map((it) => {
            const { a, n } = toScientific(parseStandard(it.value));
            return (
              <li key={it.value}>
                <span className="bk-facts__label">{it.label}</span>
                <span className="sci">{it.value}</span>
                <span className="bk-facts__arrow" aria-hidden="true">
                  ↓
                </span>
                <b>
                  <Sci a={a} n={n} />
                </b>
              </li>
            );
          })}
        </ul>
      );
    case 'tip':
      return (
        <p className="bk-tip">
          <IconBulb /> <span>{b.text}</span>
        </p>
      );
    case 'links':
      return (
        <div className="bk-links">
          <Link to="/latihan" className="btn btn--primary">
            Ke Jalur Latihan
          </Link>
          <Link to="/lab" className="btn btn--outline">
            Coba Lab Koma
          </Link>
          <Link to="/catatan" className="btn btn--ghost">
            Buka Catatan Pintar
          </Link>
        </div>
      );
    default:
      return null;
  }
}

function Cover() {
  return (
    <div className="bk-cover">
      <p className="bk-cover__kicker">Buku Digital NoBaku</p>
      <h2 className="bk-cover__title">
        Bentuk Baku
        <span>Notasi Ilmiah</span>
      </h2>
      <p className="bk-cover__sub">SMP Kelas VIII</p>
      <div className="bk-cover__art" aria-hidden="true">
        <Mascot variant="book" size={150} title="" />
      </div>
      <ol className="bk-cover__toc">
        {CHAPTERS.map((c) => (
          <li key={c.id}>
            Bab {c.no}. {c.title}
          </li>
        ))}
      </ol>
      <p className="bk-cover__hint">Balik halaman dengan tombol panah atau geser layar →</p>
    </div>
  );
}

/** Satu halaman buku (isi murni, dipakai juga untuk muka/punggung lembar yang dibalik). */
export default function BookPageView({ index, side = 'right' }) {
  const page = BOOK_PAGES[index];
  if (!page) return <div className={`bk-page bk-page--${side} bk-page--blank`} aria-hidden="true" />;
  const chapter = CHAPTERS.find((c) => c.id === page.chapter);
  return (
    <div className={`bk-page bk-page--${side}${page.cover ? ' bk-page--cover' : ''}`}>
      {page.cover ? (
        <Cover />
      ) : (
        <>
          <p className="bk-running">
            Bab {chapter.no} · {chapter.title}
          </p>
          <div className="bk-body">
            {page.blocks.map((b, i) => (
              <Block key={i} b={b} />
            ))}
          </div>
          <p className="bk-folio">{index}</p>
        </>
      )}
    </div>
  );
}
