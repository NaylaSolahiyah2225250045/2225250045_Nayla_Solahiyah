import { IconCheck, IconInfo, IconX } from './Icons.jsx';

/** Umpan balik inline di bawah jawaban (bukan pop-up yang menutupi soal). */
export default function Feedback({ kind = 'info', title, children, action }) {
  const Icon = kind === 'ok' ? IconCheck : kind === 'bad' ? IconX : IconInfo;
  return (
    <div className={`feedback feedback--${kind}`} role="status" aria-live="polite">
      <Icon />
      <div className="stack-s" style={{ flex: 1 }}>
        {title && <strong>{title}</strong>}
        {children && <div>{children}</div>}
        {action}
      </div>
    </div>
  );
}
