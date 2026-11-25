import { Link } from 'react-router-dom';
import CommaVisualizer from '../../components/CommaVisualizer.jsx';
import { Pow10 } from '../../components/Sci.jsx';
import BackVisualizer from '../../components/BackVisualizer.jsx';
import ZeroRoles from '../../components/ZeroRoles.jsx';

const PLACE = [
  { name: 'ribuan', n: 3 },
  { name: 'ratusan', n: 2 },
  { name: 'puluhan', n: 1 },
  { name: 'satuan', n: 0 },
  { name: 'persepuluhan', n: -1 },
  { name: 'perseratusan', n: -2 },
  { name: 'perseribuan', n: -3 },
];

function PlaceValueTable() {
  return (
    <div className="table-scroll card">
      <table className="table">
        <thead>
          <tr>
            {PLACE.map((p, i) => (
              <th key={p.name} style={i === 4 ? { borderLeft: '3px solid var(--comma)' } : undefined}>
                <Pow10 n={p.n} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {PLACE.map((p, i) => (
              <td key={p.name} className="small muted" style={i === 4 ? { borderLeft: '3px solid var(--comma)' } : undefined}>
                {p.name}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="small muted" style={{ marginTop: 8 }}>
        Garis <span className="c-comma">jingga</span> = letak koma.
      </p>
    </div>
  );
}

function SimpleTable({ head, rows }) {
  return (
    <div className="table-scroll card">
      <table className="table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={j === 1 ? 'sci' : undefined}>
                  {typeof c === 'object' && c !== null && 'pow' in c ? (
                    <>
                      <Pow10 n={c.pow} />
                      {c.unit ? ` ${c.unit}` : ''}
                    </>
                  ) : (
                    c
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Visual({ visual }) {
  if (!visual) return null;
  switch (visual.kind) {
    case 'comma':
      return (
        <>
          <CommaVisualizer value={visual.value} autoPlay={visual.autoPlay} showPositions={visual.showPositions} />
          <Link to={`/lab?n=${encodeURIComponent(visual.value)}`} className="lab-link">
            Coba geser sendiri di Lab Koma →
          </Link>
        </>
      );
    case 'table':
      return <SimpleTable head={visual.head} rows={visual.rows} />;
    case 'placeValue':
      return <PlaceValueTable />;
    case 'zeros':
      return <ZeroRoles value={visual.value} />;
    case 'back':
      return <BackVisualizer a={visual.a} n={visual.n} autoPlay={visual.autoPlay} />;
    default:
      return null;
  }
}
