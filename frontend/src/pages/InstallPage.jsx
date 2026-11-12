import { useState } from 'react';
import { detectPlatform, promptInstall, useInstallState } from '../lib/install.js';
import Feedback from '../components/Feedback.jsx';
import PageHero from '../components/PageHero.jsx';
import { IconDownload } from '../components/Icons.jsx';

const GUIDES = [
  {
    id: 'android',
    name: 'Android',
    steps: [
      'Buka NoBaku di Google Chrome.',
      'Ketuk tombol "Pasang aplikasi" di atas, atau menu ⋮ → "Instal aplikasi" / "Tambahkan ke layar utama".',
      'Ikon NoBaku muncul di layar utama dan dapat dibuka tanpa internet.',
    ],
  },
  {
    id: 'ios',
    name: 'iPhone / iPad',
    steps: [
      'Buka NoBaku di Safari.',
      'Ketuk tombol Bagikan (kotak dengan panah ke atas).',
      'Pilih "Tambahkan ke Layar Utama", lalu ketuk "Tambah".',
    ],
    note: 'Apple tidak mengizinkan aplikasi biasa dipasang di luar App Store, jadi di iPhone/iPad NoBaku dipasang sebagai aplikasi web.',
  },
  {
    id: 'windows',
    name: 'Windows',
    steps: [
      'Buka NoBaku di Microsoft Edge atau Google Chrome.',
      'Klik tombol "Pasang aplikasi" di atas, atau ikon pasang (⊕) di ujung kanan bilah alamat.',
      'NoBaku muncul di menu Start dan dapat disematkan ke taskbar.',
    ],
  },
  {
    id: 'mac',
    name: 'macOS',
    steps: [
      'Chrome/Edge: klik ikon pasang (⊕) di bilah alamat, atau tombol "Pasang aplikasi" di atas.',
      'Safari (macOS Sonoma ke atas): menu File → "Tambahkan ke Dock".',
      'NoBaku muncul di Launchpad/Dock seperti aplikasi lain.',
    ],
  },
];

export default function InstallPage() {
  const { canPrompt, installed } = useInstallState();
  const platform = detectPlatform();
  const [outcome, setOutcome] = useState(null);

  return (
    <main className="page stack">
      <PageHero tone="install" Icon={IconDownload} title="Pasang NoBaku">
        Pasang langsung dari browser di Android, iPhone/iPad, Windows, dan macOS — tanpa Play Store atau App Store. Setelah dipasang, materi dan latihan bisa dipakai tanpa
        internet.
      </PageHero>

      {import.meta.env.VITE_PREVIEW_EMBED === '1' && (
        <Feedback kind="info" title="Kamu sedang membuka versi pratinjau">
          <p>Di versi pratinjau ini aplikasi belum bisa dipasang dan belum bisa dipakai offline. Kedua fitur itu aktif setelah NoBaku dihosting di situsnya sendiri.</p>
        </Feedback>
      )}

      {installed ? (
        <Feedback kind="ok" title="NoBaku sudah terpasang di perangkat ini." />
      ) : canPrompt ? (
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={async () => setOutcome(await promptInstall())}
        >
          Pasang aplikasi
        </button>
      ) : (
        <Feedback kind="info" title="Ikuti langkah untuk perangkatmu di bawah ini." />
      )}
      {outcome === 'accepted' && <Feedback kind="ok" title="Berhasil! Cari ikon NoBaku di layar utama." />}

      <div className="platform-list">
        {GUIDES.map((g) => (
          <details key={g.id} open={g.id === platform}>
            <summary>
              {g.name}
              {g.id === platform ? ' (perangkatmu)' : ''}
            </summary>
            <ol>
              {g.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {g.note && <p className="small muted" style={{ marginBottom: 12 }}>{g.note}</p>}
          </details>
        ))}
      </div>
    </main>
  );
}
