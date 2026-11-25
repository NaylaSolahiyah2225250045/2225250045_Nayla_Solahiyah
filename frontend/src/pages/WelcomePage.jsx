import { Link } from 'react-router-dom';
import MascotLive from '../components/MascotLive.jsx';
import MotionToggle from '../components/MotionToggle.jsx';
import AudioControl from '../components/AudioControl.jsx';
import SkyFx from '../components/SkyFx.jsx';
import Decor from '../components/Decor.jsx';
import { Logo } from '../components/Mascot.jsx';
import { IconArrowRight, IconBook, IconPencil, IconStar, IconWifiOff } from '../components/NavIcons.jsx';
import { MASCOT_LINES } from '../content/messages.js';
import { useSession } from '../lib/account.js';

/** Angka-angka melayang di latar (dekorasi layar sambutan saja; diam bila animasi nonaktif). */
const FLOATERS = [
  { t: <>× 10<sup>6</sup></>, x: '44%', y: '30%', d: 0 },
  { t: <>0,0005</>, x: '80%', y: '12%', d: 1.2 },
  { t: <>4,5 × 10<sup>6</sup></>, x: '74%', y: '70%', d: 2.1 },
  { t: <>10<sup>−4</sup></>, x: '10%', y: '74%', d: 0.6 },
  { t: <>,</>, x: '46%', y: '6%', d: 1.7 },
  { t: <>3,2 × 10<sup>−3</sup></>, x: '6%', y: '93%', d: 2.8 },
];

const STEPS = [
  { Icon: IconBook, title: 'Lihat komanya bergeser', text: 'Visual geser koma menunjukkan berapa lompatan dan arahnya.', tone: 'learn' },
  { Icon: IconPencil, title: 'Coba langkah demi langkah', text: 'Contoh terurai, contoh setengah jadi, lalu latihan bertahap dengan petunjuk.', tone: 'progress' },
  { Icon: IconStar, title: 'Kumpulkan XP & lencana', text: 'Setiap jawaban tepat menambah XP. Progresmu tersimpan otomatis.', tone: 'install' },
];

/** Halaman pertama: "Selamat Datang di NoBaku!" → Masuk/Daftar. */
export default function WelcomePage() {
  const session = useSession();
  return (
    <div className="welcome-screen">
      <SkyFx tone="light" />
      <Decor set="welcome" />
      <div className="welcome-screen__floaters" aria-hidden="true">
        {FLOATERS.map((f, i) => (
          <span key={i} className="floater" style={{ left: f.x, top: f.y, animationDelay: `${f.d}s` }}>
            {f.t}
          </span>
        ))}
      </div>

      <header className="welcome-screen__top">
        <Logo size={56} />
        <div className="welcome-screen__toggles">
          <AudioControl light />
          <MotionToggle compact />
        </div>
      </header>

      <main className="welcome-hero">
        <div className="welcome-hero__stage">
          <span className="welcome-hero__halo" aria-hidden="true" />
          <MascotLive poses={['book', 'wave', 'wink', 'idea', 'jump']} size={230} lines={MASCOT_LINES.welcome} bubble="top" />
        </div>

        <div className="welcome-hero__text">
          <p className="welcome-hero__eyebrow">Bentuk Baku · Notasi Ilmiah · SMP Kelas VIII</p>
          <h1 className="welcome-hero__title">
            Selamat Datang di <span className="wordmark">NoBaku!</span>
          </h1>
          <p className="welcome-hero__lead">Belajar mengubah bilangan sangat besar dan sangat kecil menjadi bentuk baku — sedikit demi sedikit, dengan cara yang seru.</p>
          <div className="welcome-hero__actions">
            {session ? (
              <Link to={session.role === 'teacher' ? '/guru' : '/beranda'} className="btn btn--cta btn--lg btn--pop">
                Lanjut, {session.name}! <IconArrowRight />
              </Link>
            ) : (
              <>
                <Link to="/masuk?mode=daftar" className="btn btn--cta btn--lg btn--pop">
                  Ayo Mulai <IconArrowRight />
                </Link>
                <Link to="/masuk" className="btn btn--glass btn--lg">
                  Saya sudah punya akun
                </Link>
              </>
            )}
          </div>
          <ul className="feature-pills" aria-label="Fitur NoBaku">
            <li>
              <span className="feature-pills__icon">
                <IconBook />
              </span>
              Materi Interaktif
            </li>
            <li>
              <span className="feature-pills__icon">
                <IconPencil />
              </span>
              Latihan Bertahap
            </li>
            <li>
              <span className="feature-pills__icon">
                <IconWifiOff />
              </span>
              Bisa Offline
            </li>
          </ul>
        </div>
      </main>

      <section className="welcome-steps" aria-label="Cara belajar di NoBaku">
        {STEPS.map(({ Icon, title, text, tone }, i) => (
          <article key={title} className={`step-card step-card--${tone} rise`} style={{ animationDelay: `${0.25 + i * 0.12}s` }}>
            <span className="step-card__num">{i + 1}</span>
            <span className="step-card__icon">
              <Icon />
            </span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <footer className="welcome-screen__foot small">
        <p className="welcome-foot__meta">NoBaku Alpha · 5 Topik · Bisa dipasang di HP & laptop tanpa Play Store/App Store</p>
        <p className="welcome-credit">
          Dibuat dan dikembangkan oleh
          <br />
          <strong>Nayla Solahiyah</strong>
          <br />
          NIM: 2225250045
          <br />
          Pendidikan Matematika - Semester 3
        </p>
      </footer>
    </div>
  );
}
