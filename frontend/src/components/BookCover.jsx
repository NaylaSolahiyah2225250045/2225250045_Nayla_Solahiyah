/** Ilustrasi sampul buku modul (SVG statis) untuk kartu "Lanjutkan Belajar". */
export default function BookCover({ title = 'Bentuk Baku', size = 120 }) {
  const [l1, l2] = title.split(' ').length > 1 ? [title.split(' ')[0], title.split(' ').slice(1).join(' ')] : [title, ''];
  return (
    <svg viewBox="0 0 140 140" width={size} height={size} aria-hidden="true">
      <rect x="0" y="0" width="140" height="140" rx="20" fill="var(--primary-soft)" />
      <path d="M22 18l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#fff" opacity="0.9" />
      <path d="M118 96l2 4 4 .6-3 3 .7 4-3.7-2-3.7 2 .7-4-3-3 4-.6z" fill="#fff" opacity="0.9" />
      <g transform="rotate(-12 70 72)">
        <rect x="34" y="30" width="72" height="88" rx="8" fill="#5443d6" />
        <rect x="40" y="30" width="66" height="88" rx="8" fill="#7b6cf0" />
        <rect x="40" y="110" width="66" height="8" fill="#e9e6ff" />
        <text x="73" y="66" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily="Nunito, Arial, sans-serif">
          {l1}
        </text>
        <text x="73" y="84" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily="Nunito, Arial, sans-serif">
          {l2}
        </text>
      </g>
      <path d="M30 112l4.5 9.5 10.5 1.5-7.5 7.3 1.8 10.4L30 135.8l-9.3 4.9 1.8-10.4-7.5-7.3 10.5-1.5z" fill="#ffd45a" />
    </svg>
  );
}
