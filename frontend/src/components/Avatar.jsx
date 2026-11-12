import Mascot from './Mascot.jsx';

/** Pilihan avatar siswa: kapibara dengan aksesori & warna latar berbeda. */
export const AVATARS = [
  { id: 'toga', name: 'Si Wisudawan', accessory: 'toga', bg: 'var(--tone-learn-soft)' },
  { id: 'bunga', name: 'Si Bunga', accessory: 'bunga', bg: 'var(--tone-account-soft)' },
  { id: 'kacamata', name: 'Si Kutu Buku', accessory: 'kacamata', bg: 'var(--tone-progress-soft)' },
  { id: 'bintang', name: 'Si Bintang', accessory: 'bintang', bg: 'var(--tone-install-soft)' },
  { id: 'headset', name: 'Si Musisi', accessory: 'headset', bg: 'var(--tone-lab-soft)' },
  { id: 'pita', name: 'Si Pita', accessory: 'pita', bg: 'var(--primary-soft)' },
];

export const avatarById = (id) => AVATARS.find((a) => a.id === id) ?? AVATARS[0];

/** Avatar bulat berisi kepala kapibara. */
export default function Avatar({ id, size = 44, className = '' }) {
  const a = avatarById(id);
  return (
    <span className={`avatar-capy ${className}`} style={{ width: size, height: size, background: a.bg }} aria-hidden="true">
      <Mascot variant="head" accessory={a.accessory} size={Math.round(size * 0.92)} title="" />
    </span>
  );
}
