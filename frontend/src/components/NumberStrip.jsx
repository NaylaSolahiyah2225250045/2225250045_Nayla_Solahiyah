/**
 * Deretan sel digit dengan celah koma di antaranya.
 * Celah ke-i berada sebelum sel ke-i (celah cells.length = setelah sel terakhir).
 *
 * Props:
 *  - cells: [{d, kind}] dari shiftInfo()
 *  - comma: posisi koma aktif (atau null)
 *  - ghostComma: posisi koma asal (ditampilkan samar bila berbeda)
 *  - trail: {from, to} celah yang dilewati koma (diberi titik jejak)
 *  - positions: tampilkan nomor posisi setelah koma asal sampai angka bukan nol pertama
 *  - markZeros: coret nol yang dibuang
 *  - highlightFirst: sorot angka bukan nol pertama
 *  - onCellClick / onGapClick: mode interaktif (langkah terpandu)
 *  - wrongCell / wrongGap: tandai pilihan salah
 *  - numbers: label di atas tiap sel (mis. nomor lompatan pada BackVisualizer); menggantikan `positions`
 */
export default function NumberStrip({
  cells,
  comma,
  ghostComma = null,
  trail = null,
  positions = false,
  markZeros = false,
  highlightFirst = true,
  onCellClick,
  onGapClick,
  wrongCell = null,
  wrongGap = null,
  numbers = null,
  label,
}) {
  const firstIndex = cells.findIndex((c) => c.kind === 'first');
  const lo = trail ? Math.min(trail.from, trail.to) : 0;
  const hi = trail ? Math.max(trail.from, trail.to) : -1;
  const dirClass = trail && trail.to < trail.from ? 'dir-left' : 'dir-right';

  const gap = (i) => {
    const showComma = comma === i;
    const showGhost = !showComma && ghostComma === i && ghostComma !== cells.length;
    const isTrail = trail && i >= lo && i <= hi && i !== comma;
    const cls = ['strip__gap', isTrail ? `is-trail ${dirClass}` : '', wrongGap === i ? 'is-wrong' : ''].join(' ');
    const content = showComma ? (
      <span className="comma">,</span>
    ) : showGhost ? (
      <span className="comma comma--ghost">,</span>
    ) : null;
    if (onGapClick) {
      const ariaLabel = i === 0 ? 'Taruh koma sebelum angka pertama' : `Taruh koma setelah angka ke-${i} (${cells[i - 1].d})`;
      return (
        <button type="button" key={`g${i}`} className={cls} onClick={() => onGapClick(i)} aria-label={ariaLabel}>
          {content}
        </button>
      );
    }
    return (
      <span key={`g${i}`} className={cls} aria-hidden="true">
        {content}
      </span>
    );
  };

  const items = [];
  cells.forEach((c, i) => {
    items.push(gap(i));
    const pos = numbers
      ? numbers[i]
      : positions && ghostComma !== null && i >= ghostComma && i <= firstIndex
        ? i - ghostComma + 1
        : null;
    const cls = ['strip__cell', highlightFirst && i === firstIndex ? 'is-first' : '', wrongCell === i ? 'is-wrong' : ''].join(' ');
    items.push(
      <span className="strip__cellwrap" key={`c${i}`}>
        <span className="strip__pos" aria-hidden="true">
          {pos ?? ''}
        </span>
        {onCellClick ? (
          <button type="button" className={cls} data-kind={c.kind} onClick={() => onCellClick(i)} aria-label={`Angka ${c.d}, urutan ke-${i + 1}`}>
            {c.d}
          </button>
        ) : (
          <span className={cls} data-kind={c.kind}>
            {c.d}
          </span>
        )}
      </span>,
    );
  });
  items.push(gap(cells.length));

  return (
    <div className="strip-scroll">
      <div className={`strip${markZeros ? ' strip--mark-zeros' : ''}`} role={onCellClick || onGapClick ? 'group' : 'img'} aria-label={label}>
        {items}
      </div>
    </div>
  );
}
