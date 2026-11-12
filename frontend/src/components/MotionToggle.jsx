import { updateSettings, useSettings } from '../lib/settings.js';

/** Sakelar "Animasi Aktif/Nonaktif" (role="switch", bisa dengan keyboard). */
export default function MotionToggle({ compact = false }) {
  const { animations } = useSettings();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={animations}
      className={`switch${compact ? ' switch--compact' : ''}`}
      onClick={() => updateSettings({ animations: !animations })}
    >
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
      <span className="switch__label">
        Animasi <b>{animations ? 'Aktif' : 'Nonaktif'}</b>
      </span>
    </button>
  );
}
