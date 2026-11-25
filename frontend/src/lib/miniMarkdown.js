/**
 * Pengurai Markdown kecil untuk balasan Asisten Belajar (25 Nov 2026).
 * Hanya yang dibutuhkan untuk penjelasan matematika: paragraf, daftar, tabel `| … |`, dan blok ``` diagram teks.
 * Menghasilkan data (bukan HTML), lalu dirender React — tidak ada innerHTML, jadi teks AI tidak bisa menyisipkan kode.
 *
 * @typedef {{type: 'p', lines: string[]}
 *   | {type: 'list', ordered: boolean, items: string[]}
 *   | {type: 'table', header: string[] | null, rows: string[][]}
 *   | {type: 'pre', text: string}} MdBlock
 */

const SEPARATOR = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/;
const LIST_ITEM = /^\s*(?:[-•*]|(\d+)[.)])\s+(.*)$/;

const cellsOf = (line) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());

/**
 * @param {string} text
 * @returns {MdBlock[]}
 */
export function parseMarkdown(text) {
  const lines = String(text ?? '').replace(/\r/g, '').split('\n');
  /** @type {MdBlock[]} */
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const s = line.trim();
    if (!s) {
      i++;
      continue;
    }
    if (s.startsWith('```')) {
      const body = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) body.push(lines[i++]);
      i++; // penutup ``` (atau akhir teks)
      blocks.push({ type: 'pre', text: body.join('\n').replace(/\s+$/, '') });
      continue;
    }
    if (s.startsWith('|')) {
      const raw = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) raw.push(lines[i++].trim());
      const hasHeader = raw.length > 1 && SEPARATOR.test(raw[1]);
      const rows = raw.filter((r) => !SEPARATOR.test(r)).map(cellsOf);
      blocks.push({ type: 'table', header: hasHeader ? rows[0] : null, rows: hasHeader ? rows.slice(1) : rows });
      continue;
    }
    const li = s.match(LIST_ITEM);
    if (li) {
      const ordered = !!li[1];
      const items = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(LIST_ITEM);
        if (!m || !!m[1] !== ordered) break;
        items.push(m[2]);
        i++;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }
    const para = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t || t.startsWith('```') || t.startsWith('|') || LIST_ITEM.test(t)) break;
      para.push(t);
      i++;
    }
    blocks.push({ type: 'p', lines: para });
  }
  return blocks;
}
