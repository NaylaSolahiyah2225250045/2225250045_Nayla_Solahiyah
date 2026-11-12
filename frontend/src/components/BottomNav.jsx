import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MORE_PATHS, NAV_ITEMS } from './SideNav.jsx';
import { IconMore, IconClose, IconArrowRight } from './NavIcons.jsx';

const byPath = Object.fromEntries(NAV_ITEMS.map((n) => [n.to, n]));
const MAIN = ['/beranda', '/materi', '/latihan', '/profil'].map((p) => byPath[p]);
const MORE = MORE_PATHS.map((p) => byPath[p]);
const SHORT = { '/profil': 'Profil' };

/**
 * Navigasi bawah untuk HP (< 960px): Beranda, Materi, Latihan, Profil, Lainnya.
 * "Lainnya" membuka panel berisi Catatan Pintar, Riwayat Latihan, dan Kalender Belajar.
 */
export default function BottomNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const firstRef = useRef(null);
  const moreBtnRef = useRef(null);
  const moreActive = MORE_PATHS.some((p) => pathname.startsWith(p));

  // Tutup panel saat pindah halaman.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    firstRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        moreBtnRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <nav className="bottomnav" aria-label="Navigasi utama">
        <div className="bottomnav__inner">
          {MAIN.map(({ to, label, Icon, tone }) => (
            <NavLink key={to} to={to} className={`tone-${tone}`}>
              <span className="bottomnav__ico" aria-hidden="true">
                <Icon />
              </span>
              <span>{SHORT[to] ?? label}</span>
            </NavLink>
          ))}
          <button
            ref={moreBtnRef}
            type="button"
            className={`bottomnav__more tone-more${moreActive || open ? ' active' : ''}`}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="bottomnav__ico" aria-hidden="true">
              <IconMore />
            </span>
            <span>Lainnya</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
            <div className="sheet__handle" aria-hidden="true" />
            <div className="sheet__head">
              <h2 id="sheet-title">Menu lainnya</h2>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Tutup">
                <IconClose />
              </button>
            </div>
            <ul className="sheet__list">
              {MORE.map(({ to, label, Icon, desc, tone }, i) => (
                <li key={to}>
                  <NavLink to={to} ref={i === 0 ? firstRef : undefined} className={`sheet__item sheet__item--${i} tone-${tone}`}>
                    <span className="sheet__icon">
                      <Icon />
                    </span>
                    <span className="sheet__text">
                      <b>{label}</b>
                      <span>{desc}</span>
                    </span>
                    <IconArrowRight />
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
