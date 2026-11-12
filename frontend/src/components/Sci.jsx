import { fmtSigned, sciSpeech } from '../lib/sci/format.js';

/** Tampilan a × 10ⁿ dengan pewarnaan pangkat positif/negatif. a = null → hanya 10ⁿ. */
export function Sci({ a, n, colorExp = true }) {
  const cls = colorExp ? (n < 0 ? 'c-neg' : 'c-pos') : undefined;
  const hasA = a !== null && a !== undefined;
  return (
    <span className="sci" role="img" aria-label={hasA ? sciSpeech(a, n) : `10 pangkat ${n < 0 ? 'negatif ' : ''}${Math.abs(n)}`}>
      <span aria-hidden="true">
        {hasA && `${String(a).replace('-', '−')} × `}10
        <sup className={cls}>{fmtSigned(n)}</sup>
      </span>
    </span>
  );
}

export const Pow10 = ({ n, colorExp = true }) => <Sci a={null} n={n} colorExp={colorExp} />;
