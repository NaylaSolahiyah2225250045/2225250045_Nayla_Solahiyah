import { useNavigate } from 'react-router-dom';
import { IconBack } from './Icons.jsx';

export default function AppBar({ title, back = '/beranda', meta, total, current }) {
  const navigate = useNavigate();
  return (
    <header className="appbar">
      <div className="appbar__inner">
        {back !== null && (
          <button type="button" className="icon-btn" onClick={() => navigate(back)} aria-label="Kembali">
            <IconBack />
          </button>
        )}
        <h1 className="appbar__title">{title}</h1>
        {total > 1 && total <= 14 && (
          <div className="dots" aria-label={`Langkah ${current + 1} dari ${total}`}>
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={i < current ? 'is-done' : i === current ? 'is-current' : ''} />
            ))}
          </div>
        )}
        {meta && <span className="appbar__meta">{meta}</span>}
      </div>
    </header>
  );
}
