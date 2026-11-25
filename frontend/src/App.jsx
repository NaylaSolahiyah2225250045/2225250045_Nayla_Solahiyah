import { useEffect, useState } from 'react';
import { HashRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import SideNav, { AvatarLink } from './components/SideNav.jsx';
import { DashBackdrop } from './components/Decor.jsx';
import { Logo } from './components/Mascot.jsx';
import { useSession } from './lib/account.js';
import { shouldShowTour, useManualTour } from './lib/onboarding.js';
import OnboardingTour from './components/OnboardingTour.jsx';
import { AudioListener, BadgeWatcher } from './components/AudioFx.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import HomePage from './pages/HomePage.jsx';
import BookPage from './pages/BookPage.jsx';
import PathPage from './pages/PathPage.jsx';
import SessionPage from './pages/SessionPage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import RetryPage from './pages/RetryPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ModulePage from './pages/ModulePage.jsx';
import PracticePage from './pages/PracticePage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import InstallPage from './pages/InstallPage.jsx';
import LabPage from './pages/LabPage.jsx';
import ClassSync from './components/ClassSync.jsx';
import GlobalMusic from './components/GlobalMusic.jsx';
import AudioPrefsSync from './components/AudioPrefsSync.jsx';
import AudioControl from './components/AudioControl.jsx';
import { TEACHER_TOUR_STEPS } from './content/onboarding.js';
import { TeacherBadge, TeacherBottomNav, TeacherSideNav } from './features/teacher/TeacherNav.jsx';
import TeacherHomePage from './pages/teacher/TeacherHomePage.jsx';
import TeacherClassesPage from './pages/teacher/TeacherClassesPage.jsx';
import TeacherStudentsPage from './pages/teacher/TeacherStudentsPage.jsx';
import TeacherStudentPage from './pages/teacher/TeacherStudentPage.jsx';
import TeacherProgressPage from './pages/teacher/TeacherProgressPage.jsx';
import TeacherResultsPage from './pages/teacher/TeacherResultsPage.jsx';
import TeacherProfilePage from './pages/teacher/TeacherProfilePage.jsx';

function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/** Halaman siswa (setelah login); tanpa sesi → Masuk/Daftar; akun guru → Dashboard Guru. */
function RequireAuth() {
  const session = useSession();
  if (!session) return <Navigate to="/masuk" replace />;
  if (session.role === 'teacher') return <Navigate to="/guru" replace />;
  return (
    <>
      <BadgeWatcher />
      <ClassSync />
      <Outlet />
    </>
  );
}

/**
 * Layar belajar terfokus (mengerjakan soal, modul interaktif, kuis): latar lembut di tepi layar
 * (bintang kecil berkilau, awan, gumpalan warna; tanpa bintang jatuh) — disetujui pengembang 21 Nov 2026.
 */
function FocusLayout() {
  return (
    <div className="focus-shell">
      <DashBackdrop variant="study" />
      <Outlet />
    </div>
  );
}

/** Halaman guru: hanya akun guru; akun siswa → Dashboard Siswa. */
function RequireTeacher() {
  const session = useSession();
  if (!session) return <Navigate to="/masuk" replace />;
  if (session.role !== 'teacher') return <Navigate to="/beranda" replace />;
  return <Outlet />;
}

/** Dashboard Guru: sidebar 6 menu di laptop; logo + inisial di atas & navigasi bawah (5 menu) di HP. */
const TEACHER_TOUR_LABELS = { back: 'Kembali', next: 'Selanjutnya', skip: 'Lewati', finish: 'Selesai' };

function TeacherLayout() {
  const { pathname } = useLocation();
  // Panduan guru: otomatis sekali setelah guru pertama kali mendaftar/masuk, atau dibuka lagi dari Profil Guru.
  const session = useSession();
  const manualTour = useManualTour();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return (
    <div className="shell shell--teacher">
      {shouldShowTour(session, manualTour) && <OnboardingTour steps={TEACHER_TOUR_STEPS} home="/guru" labels={TEACHER_TOUR_LABELS} />}
      <TeacherSideNav />
      <div className="shell__main">
        <DashBackdrop />
        <header className="mobile-top">
          <Logo size={46} />
          <span className="mobile-top__end">
            <AudioControl />
            <NavLink to="/guru/profil" className="avatar-link" aria-label="Profil Guru">
              <TeacherBadge size={42} />
            </NavLink>
          </span>
        </header>
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </div>
      <TeacherBottomNav />
    </div>
  );
}

/** Dashboard: sidebar 7 menu di laptop; logo + avatar di atas & navigasi bawah (5 menu) di HP. */
function MainLayout() {
  const { pathname } = useLocation();
  // Kurung kurawal penting: di browser baru scrollTo() mengembalikan Promise, dan nilai kembalian efek
  // dianggap React sebagai fungsi pembersih (menyebabkan galat saat pindah halaman).
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  // Latar berhias di semua menu, termasuk Materi & Lab Koma (permintaan pengembang, 21 Nov 2026) —
  // hiasan hanya di tepi layar, tidak di atas buku/teks.
  // Panduan awal: otomatis untuk akun baru (sekali per akun), atau dibuka lagi dari Profil.
  const session = useSession();
  const manualTour = useManualTour();
  return (
    <div className="shell">
      {shouldShowTour(session, manualTour) && <OnboardingTour />}
      <SideNav />
      <div className="shell__main">
        <DashBackdrop />
        <header className="mobile-top">
          <Logo size={46} />
          <span className="mobile-top__end">
            <AudioControl />
            <AvatarLink />
          </span>
        </header>
        {/* key: animasi masuk halaman diputar ulang setiap pindah menu (bila animasi aktif) */}
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  const online = useOnline();
  return (
    // HashRouter: berjalan di hosting statis mana pun, di PWA, dan di dalam Capacitor tanpa konfigurasi server.
    <HashRouter>
      <AudioListener />
      {/* Musik latar global: satu pemutar untuk semua halaman (tidak mengulang saat pindah halaman). */}
      <GlobalMusic />
      <AudioPrefsSync />
      <div className="app">
        {!online && (
          <div className="offline-pill" role="status">
            Offline — kamu tetap bisa belajar
          </div>
        )}
        <Routes>
          {/* Alur: Sambutan → Masuk/Daftar → Dashboard (Beranda) */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/masuk" element={<AuthPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<MainLayout />}>
              {/* Tujuh menu utama */}
              <Route path="/beranda" element={<HomePage />} />
              <Route path="/materi" element={<BookPage />} />
              <Route path="/latihan" element={<PathPage />} />
              <Route path="/catatan" element={<NotesPage />} />
              <Route path="/riwayat" element={<HistoryPage />} />
              <Route path="/kalender" element={<CalendarPage />} />
              <Route path="/profil" element={<ProfilePage />} />
              {/* Halaman pendukung (dibuka dari menu di atas) */}
              <Route path="/lab" element={<LabPage />} />
              <Route path="/pasang" element={<InstallPage />} />
            </Route>
            {/* Layar fokus mengerjakan soal / materi modul (tanpa navigasi) */}
            <Route element={<FocusLayout />}>
              <Route path="/latihan/:nodeId" element={<SessionPage />} />
              <Route path="/riwayat/ulang/:id" element={<RetryPage />} />
              <Route path="/modul/:id" element={<ModulePage />} />
              <Route path="/modul/:id/latihan" element={<PracticePage />} />
              <Route path="/modul/:id/kuis" element={<QuizPage />} />
              <Route path="/kuis-akhir" element={<QuizPage final />} />
            </Route>
            {/* Alamat lama dari versi Alpha */}
            <Route path="/modul" element={<Navigate to="/materi" replace />} />
            <Route path="/progres" element={<Navigate to="/profil" replace />} />
            <Route path="/akun" element={<Navigate to="/profil" replace />} />
          </Route>
          {/* Dashboard Guru */}
          <Route element={<RequireTeacher />}>
            <Route element={<TeacherLayout />}>
              <Route path="/guru" element={<TeacherHomePage />} />
              <Route path="/guru/kelas" element={<TeacherClassesPage />} />
              <Route path="/guru/siswa" element={<TeacherStudentsPage />} />
              <Route path="/guru/siswa/:id" element={<TeacherStudentPage />} />
              <Route path="/guru/progres" element={<TeacherProgressPage />} />
              <Route path="/guru/hasil" element={<TeacherResultsPage />} />
              <Route path="/guru/profil" element={<TeacherProfilePage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
