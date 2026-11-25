import { updateSettings, useSettings } from '../lib/settings.js';
import { unlockAudio } from '../lib/audio.js';

const LABEL = { music: 'Musik', sfx: 'Efek suara' };

/**
 * Sakelar ON/OFF untuk musik latar atau efek suara (role="switch", bisa dengan keyboard).
 * Preferensi disimpan di nobaku.settings.v1.
 * @param {{ kind: 'music'|'sfx', compact?: boolean }} props
 */
export default function SoundToggle({ kind, compact = false }) {
  const settings = useSettings();
  const on = settings[kind];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${LABEL[kind]} ${on ? 'aktif' : 'nonaktif'}`}
      className={`switch${compact ? ' switch--compact' : ''} switch--sound`}
      onClick={() => {
        unlockAudio();
        updateSettings({ [kind]: !on });
      }}
    >
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
      <span className="switch__label" aria-hidden="true">
        {compact && kind === 'music' ? '♪ ' : ''}
        {LABEL[kind]} <b>{on ? 'ON' : 'OFF'}</b>
      </span>
    </button>
  );
}
