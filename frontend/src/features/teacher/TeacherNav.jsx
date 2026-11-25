import { NavLink } from 'react-router-dom';
import { Logo } from '../../components/Mascot.jsx';
import { IconHome } from '../../components/Icons.jsx';
import { IconHistory, IconUser } from '../../components/NavIcons.jsx';
import { useSession } from '../../lib/account.js';
import AudioControl from '../../components/AudioControl.jsx';
import MascotLive from '../../components/MascotLive.jsx';
import Decor from '../../components/Decor.jsx';

const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
export const IconClass = () => (
  <svg {...base}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4M7 9h6M7 12h4" />
  </svg>
);
export const IconUsers = () => (
  <svg {...base}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M16.5 14.2c2.3.2 4 1.7 4.5 4.3" />
  </svg>
);
export const IconChart = () => (
  <svg {...base}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 16v-4M12 16V8M16 16v-6" />
  </svg>
);

/** Id sorotan panduan guru: '/guru/kelas' → 'guru-kelas'. */
const tourId = (to) => to.slice(1).replace('/', '-');

/** Enam menu Dashboard Guru. */
export const TEACHER_NAV = [
  { to: '/guru', end: true, label: 'Beranda Guru', short: 'Beranda', Icon: IconHome, tone: 'home' },
  { to: '/guru/kelas', label: 'Kelas Saya', short: 'Kelas', Icon: IconClass, tone: 'book' },
  { to: '/guru/siswa', label: 'Daftar Siswa', short: 'Siswa', Icon: IconUsers, tone: 'path' },
  { to: '/guru/progres', label: 'Progres Belajar', short: 'Progres', Icon: IconChart, tone: 'notes' },
  { to: '/guru/hasil', label: 'Hasil Latihan & Kuis', short: 'Hasil', Icon: IconHistory, tone: 'history' },
  { to: '/guru/profil', label: 'Profil Guru', short: 'Profil', Icon: IconUser, tone: 'calendar' },
];

const initials = (name) =>
  String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** Lingkaran inisial guru (guru tidak memakai avatar siswa). */
export function TeacherBadge({ size = 40 }) {
  const session = useSession();
  return (
    <span className="t-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
      {initials(session?.name) || 'G'}
    </span>
  );
}

/** Sidebar laptop (≥ 960px). */
export function TeacherSideNav() {
  const session = useSession();
  return (
    <aside className="sidenav sidenav--teacher" aria-label="Navigasi guru">
      <NavLink to="/guru" className="sidenav__brand" aria-label="NoBaku Guru, ke Beranda Guru">
        <Logo size={120} />
      </NavLink>
      <p className="sidenav__role">Dashboard Guru</p>
      <nav className="sidenav__links">
        {TEACHER_NAV.map(({ to, end, label, Icon, tone }) => (
          <NavLink key={to} to={to} end={end} className={`tone-${tone}`} data-tour={tourId(to)}>
            <span className="sidenav__ico" aria-hidden="true">
              <Icon />
            </span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidenav__cheer">
        <Decor set="side" />
        <MascotLive poses={['smile', 'wink', 'thumb', 'book']} size={84} lines={['Semangat mengajar!', 'Pantau kelasmu di sini.']} bubble="top" idle={false} />
      </div>
      <div className="sidenav__audio">
        <AudioControl align="left" up />
        <span className="small muted">Suara</span>
      </div>
      <NavLink to="/guru/profil" className="sidenav__user">
        <TeacherBadge />
        <span className="sidenav__user-text">
          <b>{session?.name}</b>
          <span className="small muted">{session?.school || 'Guru'}</span>
        </span>
      </NavLink>
    </aside>
  );
}

/** Navigasi bawah HP: lima menu; Profil Guru lewat inisial di bilah atas. */
export function TeacherBottomNav() {
  return (
    <nav className="bottomnav bottomnav--teacher" aria-label="Navigasi guru">
      <div className="bottomnav__inner">
        {TEACHER_NAV.filter((n) => n.to !== '/guru/profil').map(({ to, end, short, Icon, tone }) => (
          <NavLink key={to} to={to} end={end} className={`tone-${tone}`} data-tour={tourId(to)}>
            <span className="bottomnav__ico" aria-hidden="true">
              <Icon />
            </span>
            <span>{short}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
