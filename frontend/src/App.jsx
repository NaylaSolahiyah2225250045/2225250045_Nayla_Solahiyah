import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import SideNav, { AvatarLink } from './components/SideNav.jsx';
import { DashBackdrop } from './components/Decor.jsx';
import { Logo } from './components/Mascot.jsx';
import { useSession } from './lib/account.js';
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

/** Halaman setelah login saja; tanpa sesi → ke Masuk/Daftar. */
function RequireAuth() {
  const session = useSession();
  return session ? <Outlet /> : <Navigate to="/masuk" replace />;
}

/** Dashboard: sidebar 7 menu di laptop; logo + avatar di atas & navigasi bawah (5 menu) di HP. */
function MainLayout() {
  const { pathname } = useLocation();
  // Kurung kurawal penting: di browser baru scrollTo() mengembalikan Promise, dan nilai kembalian efek
  // dianggap React sebagai fungsi pembersih (menyebabkan galat saat pindah halaman).
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  // Latar berhias hanya di menu Dashboard; layar belajar (Materi, Lab Koma) tetap polos (CLT).
  const calm = pathname.startsWith('/materi') || pathname.startsWith('/lab');
  return (
    <div className="shell">
      <SideNav />
      <div className="shell__main">
        {!calm && <DashBackdrop />}
        <header className="mobile-top">
          <Logo size={46} />
          <AvatarLink />
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
            <Route path="/latihan/:nodeId" element={<SessionPage />} />
            <Route path="/riwayat/ulang/:id" element={<RetryPage />} />
            <Route path="/modul/:id" element={<ModulePage />} />
            <Route path="/modul/:id/latihan" element={<PracticePage />} />
            <Route path="/modul/:id/kuis" element={<QuizPage />} />
            {/* Alamat lama dari versi Alpha */}
            <Route path="/modul" element={<Navigate to="/materi" replace />} />
            <Route path="/progres" element={<Navigate to="/profil" replace />} />
            <Route path="/akun" element={<Navigate to="/profil" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
