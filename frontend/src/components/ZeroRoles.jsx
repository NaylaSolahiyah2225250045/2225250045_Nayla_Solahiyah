import NumberStrip from './NumberStrip.jsx';
import { shiftInfo, zeroRoles } from '../lib/sci/index.js';

/** Modul 4: peran setiap angka nol (depan & belakang dibuang, tengah tetap ditulis). Dihitung lib/sci. */
export default function ZeroRoles({ value }) {
  const info = shiftInfo(value);
  const r = zeroRoles(value);
  if (!info || !r) return null;
  const hasComma = info.originalComma < info.cells.length;
  const rows = [
    r.lead > 0 && { key: 'lead', drop: true, label: 'nol depan', count: r.lead, note: 'dibuang (menentukan pangkat)' },
    r.middle > 0 && { key: 'middle', drop: false, label: 'nol tengah', count: r.middle, note: 'tetap ditulis di a' },
    r.trail > 0 && { key: 'trail', drop: true, label: 'nol belakang', count: r.trail, note: 'dibuang' },
  ].filter(Boolean);
  return (
    <div className="viz">
      <NumberStrip cells={info.cells} comma={hasComma ? info.originalComma : null} markZeros label={`Bilangan ${value}`} />
      <ul className="zero-roles">
        {rows.map((row) => (
          <li key={row.key}>
            <span className={`zero-roles__tag zero-roles__tag--${row.drop ? 'drop' : 'keep'}`}>0</span>
            <span>
              <b>{row.count} {row.label}</b> → {row.note}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
