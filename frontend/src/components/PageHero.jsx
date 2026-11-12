/** Kepala halaman berwarna yang konsisten (Mode Belajar, Progres, Pasang, Akun). */
export default function PageHero({ tone = 'learn', Icon, title, children, aside, decor }) {
  return (
    <header className={`page-hero page-hero--${tone}${decor ? ' page-hero--decor' : ''}`}>
      {decor}
      {Icon && (
        <span className="page-hero__icon" aria-hidden="true">
          <Icon />
        </span>
      )}
      <div className="page-hero__text">
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {aside && <div className="page-hero__aside">{aside}</div>}
    </header>
  );
}
