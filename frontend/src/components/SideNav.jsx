import { NavLink } from 'react-router-dom';
import { Logo } from './Mascot.jsx';
import MascotLive from './MascotLive.jsx';
import Avatar from './Avatar.jsx';
import { IconHome } from './Icons.jsx';
import { IconBook, IconCalendar, IconHistory, IconNote, IconRoute, IconUser } from './NavIcons.jsx';
import { useSession } from '../lib/account.js';
import { MASCOT_LINES } from '../content/messages.js';
import Decor from './Decor.jsx';

/** Tujuh menu utama (sama di laptop & HP; hanya penyajiannya yang berbeda). */
export const NAV_ITEMS = [
  { to: '/beranda', label: 'Beranda', Icon: IconHome, tone: 'home', desc: 'Sapaan & ringkasan belajarmu' },
  { to: '/materi', label: 'Materi', Icon: IconBook, tone: 'book', desc: 'Buku digital bentuk baku' },
  { to: '/latihan', label: 'Latihan', Icon: IconRoute, tone: 'path', desc: 'Jalur latihan bertahap' },
  { to: '/catatan', label: 'Catatan Pintar', Icon: IconNote, tone: 'notes', desc: 'Rangkuman, rumus, tips, dan kesalahan umum' },
  { to: '/riwayat', label: 'Riwayat Latihan', Icon: IconHistory, tone: 'history', desc: 'Hasil latihan & coba lagi soal yang salah' },
  { to: '/kalender', label: 'Kalender Belajar', Icon: IconCalendar, tone: 'calendar', desc: 'Hari-hari kamu belajar' },
  { to: '/profil', label: 'Profil Siswa', Icon: IconUser, tone: 'profile', desc: 'Level, progres, dan koleksi lencana' },
];

/** Menu yang di HP masuk ke panel "Lainnya". */
export const MORE_PATHS = ['/catatan', '/riwayat', '/kalender'];

/** Avatar siswa — tautan ke Profil Siswa (bilah atas HP). */
export function AvatarLink() {
  const session = useSession();
  return (
    <NavLink to="/profil" className="avatar-link" aria-label="Profil Siswa">
      <Avatar id={session?.avatar} size={42} />
    </NavLink>
  );
}

/** Navigasi samping untuk laptop (≥ 960px): ketujuh menu tampil langsung. */
export default function SideNav() {
  const session = useSession();
  return (
    <aside className="sidenav" aria-label="Navigasi utama">
      <NavLink to="/beranda" className="sidenav__brand" aria-label="NoBaku, ke Beranda">
        <Logo size={132} />
      </NavLink>
      <nav className="sidenav__links">
        {NAV_ITEMS.map(({ to, label, Icon, tone }) => (
          <NavLink key={to} to={to} className={`tone-${tone}`}>
            <span className="sidenav__ico" aria-hidden="true">
              <Icon />
            </span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidenav__cheer">
        <Decor set="side" />
        {/* Maskot sidebar tidak bergerak terus-menerus (idle=false) agar tidak ramai bersama maskot halaman. */}
        <MascotLive poses={['smile', 'wink', 'thumb', 'wave']} size={84} lines={MASCOT_LINES.sidebar} bubble="top" idle={false} />
      </div>
      <NavLink to="/profil" className="sidenav__user">
        <Avatar id={session?.avatar} size={40} />
        <span className="sidenav__user-text">
          <b>{session?.name}</b>
          <span className="small muted">Kelas {session?.kelas}</span>
        </span>
      </NavLink>
    </aside>
  );
}
