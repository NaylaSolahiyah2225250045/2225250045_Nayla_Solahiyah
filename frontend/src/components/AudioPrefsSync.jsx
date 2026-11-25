import { useEffect } from 'react';
import { saveAudioPrefs, useSession } from '../lib/account.js';
import { useSettings } from '../lib/settings.js';

/**
 * Simpan Musik ON/OFF, volume, dan Efek suara ke akun yang sedang masuk (perangkat + server sekolah),
 * sedikit setelah diubah, agar berlaku lagi saat pengguna masuk kembali. Tidak menampilkan apa pun.
 */
export default function AudioPrefsSync() {
  const session = useSession();
  const settings = useSettings();
  useEffect(() => {
    if (!session) return undefined;
    const t = setTimeout(() => saveAudioPrefs(settings), 600);
    return () => clearTimeout(t);
  }, [session?.username, settings.music, settings.sfx, settings.volume]);
  return null;
}
