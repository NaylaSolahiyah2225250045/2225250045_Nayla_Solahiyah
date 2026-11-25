import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { unlockAudio } from '../lib/audio.js';
import { updateSettings, useSettings } from '../lib/settings.js';
import SoundToggle from './SoundToggle.jsx';

const NoteIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18V5l11-2v13" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
    {off && <path d="M3 3l18 18" />}
  </svg>
);

/**
 * Kontrol suara di setiap halaman: tombol ♪ yang membuka panel kecil berisi
 * Musik ON/OFF, volume musik, dan Efek Suara ON/OFF. Pengaturan disimpan (per akun).
 * @param {{ align?: 'right'|'left', up?: boolean, light?: boolean }} props
 */
export default function AudioControl({ align = 'right', up = false, light = false }) {
  const { music, sfx, volume } = useSettings();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const panelRef = useRef(null);
  const id = useId();

  // Panel dirender di <body> (portal) dengan posisi tetap dari letak tombol, agar tidak terpotong
  // oleh wadah yang punya overflow/backdrop-filter (mis. sidebar laptop).
  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = Math.min(270, vw - 32);
      const left = align === 'left' ? Math.min(r.left, vw - w - 16) : Math.max(16, r.right - w);
      setPos(up ? { left, bottom: Math.max(16, vh - r.top + 8), width: w } : { left, top: Math.min(r.bottom + 8, vh - 60), width: w });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, align, up]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!ref.current?.contains(e.target) && !panelRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        ref.current?.querySelector('.audio-ctl__btn')?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`audio-ctl audio-ctl--${align}${up ? ' audio-ctl--up' : ''}${light ? ' audio-ctl--light' : ''}`}>
      <button
        type="button"
        className={`audio-ctl__btn${music ? ' is-on' : ''}`}
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Pengaturan suara (musik ${music ? 'aktif' : 'nonaktif'})`}
        onClick={() => {
          unlockAudio();
          setOpen((o) => !o);
        }}
      >
        <NoteIcon off={!music} />
      </button>
      {open &&
        pos &&
        createPortal(
        <div ref={panelRef} id={id} className="audio-ctl__panel" role="group" aria-label="Pengaturan suara" style={pos}>
          <p className="audio-ctl__title">Suara</p>
          <SoundToggle kind="music" />
          <label className="audio-ctl__vol">
            <span className="small">
              Volume musik <b>{volume}%</b>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={volume}
              disabled={!music}
              onChange={(e) => {
                unlockAudio();
                updateSettings({ volume: Number(e.target.value) });
              }}
              aria-valuetext={`${volume} persen`}
            />
          </label>
          <SoundToggle kind="sfx" />
          <p className="small muted audio-ctl__note">{sfx || music ? 'Tersimpan untuk akunmu.' : 'Semua suara mati.'}</p>
        </div>,
          document.body,
        )}
    </div>
  );
}
