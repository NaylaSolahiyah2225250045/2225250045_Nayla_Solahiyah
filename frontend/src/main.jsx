import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './lib/settings.js'; // pasang data-motion di <html> sebelum render pertama
import App from './App.jsx';
import './lib/install.js';
// Font Nunito dibundel (bukan dari Google Fonts) agar tetap tampil saat offline.
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import './styles/tokens.css';
import './styles/app.css';
import './styles/theme.css';
import './styles/experience.css';
import './styles/mascot.css';
import './styles/lab.css';
import './styles/pages.css';
import './styles/decor.css';
import './styles/brand.css';
import './styles/tour.css';
import './styles/sky.css';
import './styles/teacher.css';
import './styles/audio.css';
import './styles/laptop.css';

// Service worker: cache aplikasi agar bisa dipakai offline & diperbarui otomatis.
// Build pratinjau (VITE_PREVIEW_EMBED=1, mis. halaman Artifact claude.ai) tidak mendukung service worker.
if (import.meta.env.VITE_PREVIEW_EMBED !== '1') registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
