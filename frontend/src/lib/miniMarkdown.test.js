import { describe, expect, it } from 'vitest';
import { parseMarkdown } from './miniMarkdown.js';

describe('Markdown kecil untuk Asisten Belajar', () => {
  it('tabel dengan kepala, paragraf, dan diagram teks', () => {
    const md = 'Yuk lihat nolnya.\n10⁹ = 1.000.000.000\n\n| Pangkat | Nilai | Sebutan |\n| :--- | :--- | :--- |\n| 10³ | 1.000 | seribu |\n| 10⁶ | 1.000.000 | satu juta |\n\n```\n4,7 → 47 → 470\n```\nMenurutmu 10¹² disebut apa?';
    expect(parseMarkdown(md)).toEqual([
      { type: 'p', lines: ['Yuk lihat nolnya.', '10⁹ = 1.000.000.000'] },
      { type: 'table', header: ['Pangkat', 'Nilai', 'Sebutan'], rows: [['10³', '1.000', 'seribu'], ['10⁶', '1.000.000', 'satu juta']] },
      { type: 'pre', text: '4,7 → 47 → 470' },
      { type: 'p', lines: ['Menurutmu 10¹² disebut apa?'] },
    ]);
  });

  it('daftar berpoin & bernomor; teks HTML tetap teks biasa', () => {
    expect(parseMarkdown('- Pahami\n- Modelkan\n1. satu\n2. dua')).toEqual([
      { type: 'list', ordered: false, items: ['Pahami', 'Modelkan'] },
      { type: 'list', ordered: true, items: ['satu', 'dua'] },
    ]);
    expect(parseMarkdown('<img src=x onerror=alert(1)>')).toEqual([{ type: 'p', lines: ['<img src=x onerror=alert(1)>'] }]);
  });

  it('tabel tanpa baris pemisah tetap tabel tanpa kepala; blok ``` tanpa penutup tidak hilang', () => {
    expect(parseMarkdown('| 10² | 100 |')).toEqual([{ type: 'table', header: null, rows: [['10²', '100']] }]);
    expect(parseMarkdown('```\n0,0056\n ↑')).toEqual([{ type: 'pre', text: '0,0056\n ↑' }]);
  });
});
