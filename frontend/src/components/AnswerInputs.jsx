import { useId } from 'react';

const toggleSign = (s) => {
  const t = String(s ?? '').trim();
  if (t.startsWith('-') || t.startsWith('−')) return t.slice(1);
  return `-${t}`;
};

/** Input pangkat dengan tombol ± (keyboard angka di HP sering tidak punya tanda minus). */
function ExponentField({ value, onChange, disabled, label, onEnter }) {
  return (
    <span className="exp-inputs">
      <button
        type="button"
        className="sign-btn"
        onClick={() => onChange(toggleSign(value))}
        disabled={disabled}
        aria-label="Ubah tanda pangkat (positif/negatif)"
      >
        ±
      </button>
      <input
        className="field field--n"
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9\-−]/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        placeholder="n"
      />
    </span>
  );
}

/** Jawaban bentuk baku: [a] × 10^[n] */
export function SciInput({ value, onChange, disabled, onEnter, autoFocus }) {
  const id = useId();
  return (
    <div className="answer">
      <label htmlFor={id} className="visually-hidden">
        Nilai a
      </label>
      <input
        id={id}
        className="field field--a"
        inputMode="decimal"
        autoComplete="off"
        value={value.a}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onChange({ ...value, a: e.target.value })}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        placeholder="a"
      />
      <span className="exp-group">
        <span className="ten">× 10</span>
        <ExponentField value={value.n} onChange={(n) => onChange({ ...value, n })} disabled={disabled} label="Pangkat n" onEnter={onEnter} />
      </span>
    </div>
  );
}

/** Jawaban pangkat saja: 10^[n] */
export function ExpInput({ value, onChange, disabled, onEnter }) {
  return (
    <div className="answer">
      <span className="exp-group">
        <span className="ten">10</span>
        <ExponentField value={value} onChange={onChange} disabled={disabled} label="Pangkat" onEnter={onEnter} />
      </span>
    </div>
  );
}

/** Jawaban bentuk biasa. */
export function StandardInput({ value, onChange, disabled, onEnter, autoFocus }) {
  return (
    <div className="answer">
      <input
        className="field field--wide"
        inputMode="decimal"
        autoComplete="off"
        aria-label="Jawaban bentuk biasa"
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        placeholder="mis. 0,0024"
      />
    </div>
  );
}

/** Pilihan ganda. */
export function Options({ options, value, onChange, disabled }) {
  return (
    <div className="options" role="group" aria-label="Pilihan jawaban">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          className="option"
          aria-pressed={value === o.key}
          disabled={disabled}
          onClick={() => onChange(o.key)}
        >
          <span className="option__key">{o.key}</span>
          <span className="sci">{o.text}</span>
        </button>
      ))}
    </div>
  );
}
