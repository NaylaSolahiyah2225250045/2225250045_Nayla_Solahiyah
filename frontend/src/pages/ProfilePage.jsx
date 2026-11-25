import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout, updateProfile, useSession } from '../lib/account.js';
import { useLearner, AVAILABLE_MODULES } from '../lib/learner.js';
import { progress } from '../lib/progress.js';
import { moduleStatus } from '../components/ModuleList.jsx';
import Avatar, { AVATARS, avatarById } from '../components/Avatar.jsx';
import BadgeIcon from '../components/BadgeIcon.jsx';
import MotionToggle from '../components/MotionToggle.jsx';
import { openTour } from '../lib/onboarding.js';
import SoundToggle from '../components/SoundToggle.jsx';
import Decor from '../components/Decor.jsx';
import JoinClassCard from '../components/JoinClassCard.jsx';
import { errorLabel } from '../content/messages.js';
import { BOOK_PAGES } from '../content/book.js';

const BOOK_TOTAL = BOOK_PAGES.length - 1;
import { IconStar } from '../components/NavIcons.jsx';

/** Profil Siswa: identitas & avatar, level/XP, Progres Belajar, pencapaian, Koleksi Lencana, pengaturan. */
export default function ProfilePage() {
  const session = useSession();
  const navigate = useNavigate();
  const L = useLearner();
  const { rewards: rw } = L;
  const [picking, setPicking] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const levelPct = Math.round(((rw.xp - rw.levelStart) / (rw.nextLevelAt - rw.levelStart)) * 100);
  const earned = rw.badges.filter((b) => b.earned).length;

  const errors = {};
  Object.values(L.progressMap).forEach((p) => Object.entries(p.errors).forEach(([k, v]) => (errors[k] = (errors[k] ?? 0) + v)));
  const topError = Object.entries(errors).sort((a, b) => b[1] - a[1])[0];

  return (
    <main className="page page--wide stack">
      <section className="profile-hero">
        <Decor set="profile" />
        <div className="profile-hero__avatar">
          <Avatar id={session?.avatar} size={112} />
          <button type="button" className="btn btn--glass btn--sm" onClick={() => setPicking((p) => !p)} aria-expanded={picking}>
            Ganti avatar
          </button>
        </div>
        <div className="profile-hero__text">
          <p className="profile-hero__kicker">Profil Siswa</p>
          <h1>{session?.name}</h1>
          <p className="profile-hero__meta">
            <span className="chip chip--glass">Kelas {session?.kelas}</span>
            <span className="chip chip--glass">@{session?.username}</span>
            <span className="chip chip--glass">{avatarById(session?.avatar).name}</span>
          </p>
          <div className="profile-hero__level">
            <span className="profile-level">
              <IconStar /> Level {rw.level}
            </span>
            <span className="profile-xp">
              <b>{rw.xp} XP</b> · {rw.nextLevelAt - rw.xp} XP lagi ke Level {rw.level + 1}
            </span>
            <span className="meter meter--light meter--thick" aria-label={`${rw.xp} dari ${rw.nextLevelAt} XP`}>
              <span style={{ width: `${levelPct}%` }} />
            </span>
          </div>
        </div>
      </section>

      {picking && (
        <section className="card avatar-picker" aria-labelledby="avatar-title">
          <h2 id="avatar-title">Pilih avatar kapibaramu</h2>
          <div className="avatar-picker__grid" role="radiogroup" aria-labelledby="avatar-title">
            {AVATARS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={session?.avatar === a.id}
                className={`avatar-opt${session?.avatar === a.id ? ' is-on' : ''}`}
                onClick={() => updateProfile({ avatar: a.id })}
              >
                <Avatar id={a.id} size={72} />
                <span>{a.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="profile-grid">
        <section className="card stack-s" aria-labelledby="prog-title">
          <h2 id="prog-title">Progres Belajar</h2>
          <div className="prog-rows">
            <div className="prog-row">
              <span>Buku materi</span>
              <span className="meter" aria-hidden="true">
                <span style={{ width: `${Math.round((Math.min(L.book.read.length, BOOK_TOTAL) / BOOK_TOTAL) * 100)}%` }} />
              </span>
              <b>
                {Math.min(L.book.read.length, BOOK_TOTAL)}/{BOOK_TOTAL} hal.
              </b>
            </div>
            <div className="prog-row">
              <span>Jalur latihan</span>
              <span className="meter" aria-hidden="true">
                <span style={{ width: `${Math.round((L.nodesDone / L.path.length) * 100)}%` }} />
              </span>
              <b>
                {L.nodesDone}/{L.path.length} titik
              </b>
            </div>
            {AVAILABLE_MODULES.map((m) => {
              const s = moduleStatus(m);
              return (
                <div key={m.id} className="prog-row">
                  <span>
                    Topik {m.no} · {m.short}
                  </span>
                  <span className="meter" aria-hidden="true">
                    <span style={{ width: `${s.pct}%` }} />
                  </span>
                  <b>{s.done ? `Kuis ${s.score}` : `${s.pct}%`}</b>
                </div>
              );
            })}
            <div className="prog-row">
              <span>Level 5 · Kuis Akhir</span>
              <span className="meter" aria-hidden="true">
                <span style={{ width: `${L.progressMap.final?.bestQuiz ?? 0}%` }} />
              </span>
              <b>{L.progressMap.final?.completed ? `Nilai ${L.progressMap.final.bestQuiz}` : 'Belum'}</b>
            </div>
          </div>
          {topError && (
            <p className="small prog-focus">
              Paling perlu dilatih: <b>{errorLabel[topError[0]]}</b> ({topError[1]}×). Lihat <Link to="/catatan">Catatan Pintar</Link>.
            </p>
          )}
        </section>

        <section className="card stack-s" aria-labelledby="ach-title">
          <h2 id="ach-title">Pencapaian</h2>
          <ul className="ach-grid">
            <li>
              <b>{L.accuracy}%</b>
              <span>jawaban tepat</span>
            </li>
            <li>
              <b>{L.answered}</b>
              <span>soal dikerjakan</span>
            </li>
            <li>
              <b>{L.stats.activeDays}</b>
              <span>hari belajar</span>
            </li>
            <li>
              <b>{L.streak}</b>
              <span>hari beruntun</span>
            </li>
            <li>
              <b>
                {earned}/{rw.badges.length}
              </b>
              <span>lencana</span>
            </li>
            <li>
              <b>{L.stats.labMoves}</b>
              <span>geseran di Lab Koma</span>
            </li>
          </ul>
        </section>
      </div>

      <section className="stack-s" aria-labelledby="badge-title">
        <div className="row row--between">
          <h2 id="badge-title">Koleksi Lencana</h2>
          <span className="chip chip--yellow">
            {earned} dari {rw.badges.length} diraih
          </span>
        </div>
        <ul className="badge-grid">
          {rw.badges.map((b) => (
            <li key={b.id} className={`badge-card badge-card--${b.tier}${b.earned ? ' is-earned' : ' is-locked'}`}>
              <BadgeIcon tier={b.tier} earned={b.earned} emblem={b.emblem} size={64} />
              <b className="badge-card__name">{b.name}</b>
              <span className="badge-card__desc">{b.desc}</span>
              {b.earned ? (
                <span className="badge-card__state is-ok">Sudah diraih</span>
              ) : (
                <>
                  <span className="meter" aria-hidden="true">
                    <span style={{ width: `${Math.round((b.progress / b.goal) * 100)}%` }} />
                  </span>
                  <span className="badge-card__state">
                    Terkunci · {b.progress}/{b.goal}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <JoinClassCard />

      <section className="card stack-s" aria-labelledby="set-title">
        <h2 id="set-title">Pengaturan</h2>
        <div className="settings-row">
          <div>
            <b>Animasi</b>
            <p className="small muted">Maskot, bintang, dan balik halaman. Bila nonaktif, maskot tetap tampil tetapi diam.</p>
          </div>
          <MotionToggle />
        </div>
        <div className="settings-row">
          <div>
            <b>Musik latar</b>
            <p className="small muted">Musik instrumental lembut di halaman Sambutan.</p>
          </div>
          <SoundToggle kind="music" />
        </div>
        <div className="settings-row">
          <div>
            <b>Efek suara</b>
            <p className="small muted">Bunyi singkat saat menekan tombol, menjawab, menyelesaikan level/kuis, dan mendapat lencana.</p>
          </div>
          <SoundToggle kind="sfx" />
        </div>
        <div className="settings-row">
          <div>
            <b>Panduan NoBaku</b>
            <p className="small muted">Kenalan lagi dengan menu-menu NoBaku bersama kapibara.</p>
          </div>
          <button type="button" className="btn btn--outline btn--sm" onClick={openTour}>
            Buka panduan
          </button>
        </div>
        <div className="settings-row">
          <div>
            <b>Pasang NoBaku</b>
            <p className="small muted">Pasang di HP/laptop tanpa Play Store atau App Store.</p>
          </div>
          <Link to="/pasang" className="btn btn--outline btn--sm">
            Cara memasang
          </Link>
        </div>
        <div className="settings-row">
          <div>
            <b>Hapus progres</b>
            <p className="small muted">Menghapus progres modul di perangkat ini.</p>
          </div>
          <div className="row">
            <button
              type="button"
              className={confirmReset ? 'btn btn--primary btn--sm' : 'btn btn--ghost btn--sm'}
              onClick={() => {
                if (!confirmReset) return setConfirmReset(true);
                progress.reset();
                return setConfirmReset(false);
              }}
            >
              {confirmReset ? 'Ya, hapus' : 'Hapus progres'}
            </button>
            {confirmReset && (
              <button type="button" className="btn btn--outline btn--sm" onClick={() => setConfirmReset(false)}>
                Batal
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          className="btn btn--outline btn--block"
          onClick={() => {
            logout();
            navigate('/', { replace: true });
          }}
        >
          Keluar dari akun
        </button>
      </section>
    </main>
  );
}
