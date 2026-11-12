const TIER = {
  bronze: ['#F1A866', '#C77A3A'],
  silver: ['#C9D1E6', '#8D98B8'],
  gold: ['#FFD45A', '#E3A81E'],
};

/**
 * Medali lencana (SVG statis). Tier menentukan warna medali; `emblem` (teks pendek) menjadi
 * desain unik tiap lencana. Lencana yang belum diraih tampil abu-abu.
 */
export default function BadgeIcon({ tier = 'gold', earned = true, size = 44, emblem }) {
  const [light, dark] = earned ? TIER[tier] : ['#E3E3EE', '#B9BBCF'];
  const len = emblem ? [...emblem].length : 0;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <path d="M14 2h8l4 12h-8z" fill={earned ? '#7B6CF0' : '#C9C9D8'} />
      <path d="M34 2h-8l-4 12h8z" fill={earned ? '#5443D6' : '#B5B5C8'} />
      <circle cx="24" cy="29" r="16" fill={dark} />
      <circle cx="24" cy="29" r="12.5" fill={light} />
      {emblem ? (
        <text
          x="24"
          y="29"
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={len <= 1 ? 15 : len === 2 ? 12 : 10}
          fontWeight="900"
          fill={earned ? '#3A2A12' : '#9A9CB4'}
          fontFamily="Nunito, Arial, sans-serif"
        >
          {emblem}
        </text>
      ) : (
        <path d="M24 21l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill={earned ? '#fff' : '#F5F5FA'} />
      )}
    </svg>
  );
}
