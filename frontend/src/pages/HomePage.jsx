import { Link } from 'react-router-dom';
import { useSession } from '../lib/account.js';
import { useLearner } from '../lib/learner.js';
import { dateKey } from '../lib/activity.js';
import { BOOK_PAGES } from '../content/book.js';
import { MASCOT_LINES } from '../content/messages.js';
import Avatar from '../components/Avatar.jsx';
import Mascot from '../components/Mascot.jsx';
import MascotLive from '../components/MascotLive.jsx';
import Decor from '../components/Decor.jsx';
import BadgeIcon from '../components/BadgeIcon.jsx';
import { IconArrowRight, IconBook, IconFlask, IconNote, IconRoute, IconStar } from '../components/NavIcons.jsx';

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/** 7 hari terakhir (untuk strip minggu dengan cap kapibara). */
function lastWeek() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: dateKey(d), label: d.toLocaleDateString('id-ID', { weekday: 'short' }).slice(0, 3), day: d.getDate() };
  });
}

/** Beranda: sapaan + avatar, ringkasan aktivitas & progres, lanjutkan belajar. */
export default function HomePage() {
  const session = useSession();
  const L = useLearner();
  const { rewards: rw } = L;
  const todayKey = dateKey();
  const learnedToday = Boolean(L.days[todayKey]);
  const levelPct = Math.round(((rw.xp - rw.levelStart) / (rw.nextLevelAt - rw.levelStart)) * 100);
  const earned = rw.badges.filter((b) => b.earned).length;
  const bookTotal = BOOK_PAGES.length - 1;
  const nextNode = L.currentNode;

  return (
    <main className="page page--wide page--home stack">
      <section className="home-hero" aria-labelledby="home-title">
        <Decor set="home" />
        <div className="home-hero__who">
          <Avatar id={session?.avatar} size={64} className="home-hero__avatar" />
          <div>
            <p className="home-hero__hello">{greeting()},</p>
            <h1 id="home-title" className="home-hero__name">
              {session?.name ?? 'Sobat NoBaku'}!
            </h1>
            <p className="home-hero__meta">
              <span className="chip chip--glass">Kelas {session?.kelas}</span>
              <span className="chip chip--glass">
                <IconStar /> Level {rw.level}
              </span>
            </p>
          </div>
        </div>
        <p className={`home-hero__today${learnedToday ? ' is-done' : ''}`}>
          {learnedToday ? '✓ Hari ini kamu sudah belajar. Keren!' : 'Hari ini belum belajar. Yuk, mulai sedikit saja!'}
        </p>
        <div className="home-hero__xp">
          <div className="row row--between small">
            <b>{rw.xp} XP</b>
            <span>{rw.nextLevelAt - rw.xp} XP lagi ke Level {rw.level + 1}</span>
          </div>
          <span className="meter meter--light meter--thick" aria-label={`${rw.xp} dari ${rw.nextLevelAt} XP`}>
            <span style={{ width: `${levelPct}%` }} />
          </span>
        </div>
        <div className="home-hero__mascot">
          <MascotLive poses={learnedToday ? ['happy', 'wave', 'wink', 'jump'] : ['wave', 'smile', 'point', 'wink']} size={128} lines={MASCOT_LINES.dashboard} bubble="left" />
        </div>
      </section>

      <ul className="home-stats" aria-label="Ringkasan belajar">
        <li>
          <span className="home-stats__icon is-streak" aria-hidden="true">
            🔥
          </span>
          <b>{L.streak}</b>
          <span>hari beruntun</span>
        </li>
        <li>
          <span className="home-stats__icon is-path" aria-hidden="true">
            <IconRoute />
          </span>
          <b>
            {L.nodesDone}/{L.path.length}
          </b>
          <span>titik latihan</span>
        </li>
        <li>
          <span className="home-stats__icon is-badge" aria-hidden="true">
            <BadgeIcon tier="gold" size={26} />
          </span>
          <b>{earned}</b>
          <span>lencana</span>
        </li>
        <li>
          <span className="home-stats__icon is-acc" aria-hidden="true">
            ✓
          </span>
          <b>{L.accuracy}%</b>
          <span>jawaban tepat</span>
        </li>
      </ul>

      <div className="home-grid">
        <Link to="/materi" className="home-card home-card--learn">
          <span className="home-card__icon" aria-hidden="true">
            <IconBook />
          </span>
          <span className="home-card__body">
            <span className="home-card__kicker">Lanjutkan membaca</span>
            <b>{L.book.read.length ? `Halaman ${L.book.page || 1} · Buku Bentuk Baku` : 'Mulai dari bilangan berpangkat'}</b>
            <span className="meter" aria-hidden="true">
              <span style={{ width: `${Math.round((L.book.read.length / bookTotal) * 100)}%` }} />
            </span>
            <span className="small muted">
              {L.book.read.length} dari {bookTotal} halaman dibaca
            </span>
          </span>
          <IconArrowRight />
        </Link>

        <Link to={nextNode ? (nextNode.kind === 'kuis' ? `/modul/${nextNode.moduleId}/kuis?dari=latihan` : `/latihan/${nextNode.id}`) : '/latihan'} className="home-card home-card--path">
          <span className="home-card__icon" aria-hidden="true">
            <IconRoute />
          </span>
          <span className="home-card__body">
            <span className="home-card__kicker">Latihan berikutnya</span>
            <b>{nextNode ? `Modul ${nextNode.moduleNo} · ${nextNode.kind === 'kuis' ? 'Kuis' : `${nextNode.title} ${nextNode.subtitle}`}` : 'Semua titik selesai!'}</b>
            <span className="small muted">{nextNode ? nextNode.moduleTitle : 'Ulangi latihan kapan saja'}</span>
          </span>
          <IconArrowRight />
        </Link>
      </div>

      <section className="home-week card" aria-labelledby="week-title">
        <div className="row row--between">
          <h2 id="week-title">Minggu ini</h2>
          <Link to="/kalender" className="btn btn--ghost btn--sm">
            Kalender →
          </Link>
        </div>
        <ol className="week-strip">
          {lastWeek().map((d) => (
            <li key={d.key} className={`${L.days[d.key] ? 'is-active' : ''}${d.key === todayKey ? ' is-today' : ''}`}>
              <span className="week-strip__dow">{d.label}</span>
              <span className="week-strip__mark" aria-label={L.days[d.key] ? 'belajar' : 'belum belajar'}>
                {L.days[d.key] ? <Mascot variant="head" size={26} title="" /> : d.day}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="home-mini">
        <Link to="/lab" className="mini-card mini-card--lab">
          <IconFlask />
          <span>
            <b>Lab Koma</b>
            <span className="small">Geser koma sendiri</span>
          </span>
        </Link>
        <Link to="/catatan" className="mini-card mini-card--notes">
          <IconNote />
          <span>
            <b>Catatan Pintar</b>
            <span className="small">Rumus & tips</span>
          </span>
        </Link>
      </div>
    </main>
  );
}
