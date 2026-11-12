import { IconBulb } from './Icons.jsx';

/** Petunjuk bertingkat: dibuka berurutan, maksimal 3. */
export default function HintPanel({ hints, shown, onShowMore, disabled }) {
  const total = hints.length;
  return (
    <div className="stack-s">
      {shown > 0 && (
        <div className="hint-box" aria-live="polite">
          <ol>
            {hints.slice(0, shown).map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>
        </div>
      )}
      {shown < total && (
        <button type="button" className="btn btn--hint" onClick={onShowMore} disabled={disabled}>
          <IconBulb />
          {shown === 0 ? 'Petunjuk' : 'Petunjuk berikutnya'} ({shown}/{total})
        </button>
      )}
    </div>
  );
}
