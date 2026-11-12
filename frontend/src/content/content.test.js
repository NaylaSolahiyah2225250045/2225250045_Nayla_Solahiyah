import { describe, expect, it } from 'vitest';
import { BANK, PER_SESSION } from './bank.js';
import { MODULES } from './modules.js';
import { answerKey, checkAnswer, hintsFor, parseStandard, sciText, workedSteps } from '../lib/sci/index.js';

const all = Object.entries(BANK).flatMap(([m, b]) => [
  ...Object.entries(b.levels).flatMap(([lv, qs]) => qs.map((q, i) => [`${m} L${lv} #${i + 1}`, q])),
  ...b.quiz.map((q, i) => [`${m} kuis #${i + 1}`, q]),
]);

describe('bank soal', () => {
  it('setiap level punya cukup soal untuk satu sesi', () => {
    for (const b of Object.values(BANK)) {
      for (const qs of Object.values(b.levels)) expect(qs.length).toBeGreaterThanOrEqual(PER_SESSION);
      expect(b.quiz.length).toBe(5);
    }
  });

  it.each(all)('%s: kunci jawaban valid & lolos pemeriksa', (_, q) => {
    const key = answerKey(q);
    let response = key;
    if (q.type === 'power_of_ten') response = String(key);
    expect(checkAnswer(q, response).correct).toBe(true);
    expect(hintsFor(q)).toHaveLength(3);
  });

  it.each(all.filter(([, q]) => q.type === 'choose_correct'))('%s: pilihan benar sesuai mesin & pengecoh punya kode', (_, q) => {
    const wrong = q.options.filter((o) => o.key !== q.answer);
    wrong.forEach((o) => expect(o.errorCode).toBeTruthy());
    // Jika teks soal menyebut bilangan, pilihan benar harus sama dengan hasil mesin.
    const num = q.text.match(/\d[\d.]*,\d+|\d{1,3}(?:\.\d{3})+/);
    const right = q.options.find((o) => o.key === q.answer).text;
    if (num && /bentuk baku/i.test(q.text)) {
      const x = parseStandard(num[0]);
      const { a, n } = { a: x.digits[0] + (x.digits.length > 1 ? ',' + x.digits.slice(1) : ''), n: x.exp };
      expect(right).toContain(sciText(a, n));
    }
  });
});

/** "3,4 × 10⁶" → { a: '3,4', n: '6' } (untuk memeriksa pengecoh pilihan ganda Modul 4). */
const SUPS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
const parseSciText = (t) => {
  const m = t.match(/(-?\d+(?:,\d+)?) × 10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/);
  return m && { a: m[1], n: m[2].split('').map((c) => SUPS[c]).join('') };
};

describe('pilihan ganda Modul 4–5 (focus)', () => {
  const mcs = all.filter(([, q]) => q.type === 'choose_correct' && q.focus);
  it('ada pilihan ganda ber-focus', () => expect(mcs.length).toBeGreaterThanOrEqual(6));

  it.each(mcs)('%s: jawaban benar dihitung mesin & setiap pengecoh didiagnosis dengan kodenya', (_, q) => {
    for (const o of q.options) {
      const d =
        q.focus === 'zero'
          ? checkAnswer({ type: 'to_scientific', value: q.value }, parseSciText(o.text))
          : checkAnswer({ type: 'to_standard', a: q.a, n: q.n }, o.text.split(' ')[0]);
      if (o.key === q.answer) expect(d.correct, o.text).toBe(true);
      else expect(d.errorCode, o.text).toBe(o.errorCode);
    }
  });
});

describe('modul', () => {
  it('Modul 1–5 tersedia, Modul 6–8 masih "Segera hadir"', () => {
    const open = MODULES.filter((m) => !m.comingSoon).map((m) => m.id);
    expect(open).toEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
    for (const id of open) {
      expect(BANK[id], id).toBeTruthy();
      const types = MODULES.find((m) => m.id === id).items.map((i) => i.type);
      for (const t of ['intro', 'concept', 'worked', 'faded', 'practice', 'quiz']) expect(types, `${id} ${t}`).toContain(t);
    }
  });

  it('contoh Modul 4–5 dihitung lib/sci & layar materi ≤ 40 kata', async () => {
    const { zeroSteps, backSteps, backResult, powText, parseScientific } = await import('../lib/sci/index.js');
    for (const m of MODULES.filter((x) => x.id === 'm4' || x.id === 'm5')) {
      for (const item of m.items) {
        if (item.qtype === 'to_standard') {
          expect(parseScientific(item.a, item.n)?.normalized, `${item.a} ${item.n}`).toBe(true);
          expect(backSteps(item.a, item.n)).toHaveLength(4);
        }
        if (item.focus === 'zero') expect(zeroSteps(item.value)).toHaveLength(5);
        if (item.visual?.kind === 'back') expect(parseScientific(item.visual.a, item.visual.n)?.normalized).toBe(true);
        if (item.visual?.kind === 'zeros') expect(parseStandard(item.visual.value)).not.toBeNull();
        // Contoh setengah jadi tidak boleh membocorkan jawaban akhir di langkah yang ditampilkan.
        if (item.type === 'faded') {
          const shown = (item.qtype === 'to_standard' ? backSteps(item.a, item.n) : zeroSteps(item.value)).slice(0, item.shown).join(' ');
          const answer = item.qtype === 'to_standard' ? backResult(item.a, item.n) : powText(parseStandard(item.value).exp);
          expect(shown, `${item.value ?? item.a}`).not.toContain(answer);
        }
        const words = [item.text, ...(item.list ?? [])].filter(Boolean).join(' ').split(/\s+/).length;
        expect(words, item.title).toBeLessThanOrEqual(40);
      }
    }
  });

  it('contoh terurai & setengah jadi menghasilkan langkah', () => {
    for (const m of MODULES) {
      for (const item of m.items) {
        if ((item.type === 'worked' || item.type === 'faded') && item.qtype === 'to_scientific') {
          expect(workedSteps(item.value)).toHaveLength(4);
        }
        if (item.type === 'guided') expect(parseStandard(item.value)).not.toBeNull();
      }
    }
  });
});

describe('Lab Koma', () => {
  it('setiap contoh bilangan valid untuk Lab & tidak ganda', async () => {
    const { LAB_PRESETS } = await import('./lab.js');
    const { prepareLab } = await import('../lib/sci/index.js');
    const values = LAB_PRESETS.map((p) => p.value);
    expect(new Set(values).size).toBe(values.length);
    for (const p of LAB_PRESETS) {
      const r = prepareLab(p.value);
      expect(r.ok, p.value).toBe(true);
      expect(r.lab.value).toBe(p.value);
    }
  });
});

describe('Buku materi & Catatan Pintar', () => {
  it('semua blok buku valid & bisa dihitung lib/sci', async () => {
    const { BOOK_PAGES, CHAPTERS } = await import('./book.js');
    const { parseScientific, zeroSteps, zeroRoles, backSteps } = await import('../lib/sci/index.js');
    const chapterIds = new Set(CHAPTERS.map((c) => c.id));
    expect(BOOK_PAGES[0].cover).toBe(true);
    for (const page of BOOK_PAGES.slice(1)) {
      expect(chapterIds.has(page.chapter)).toBe(true);
      expect(page.blocks[0].t).toBe('h');
      for (const b of page.blocks) {
        if (b.t === 'convert') expect(parseStandard(b.value), b.value).not.toBeNull();
        if (b.t === 'facts') b.items.forEach((i) => expect(parseStandard(i.value)).not.toBeNull());
        if (b.t === 'back') expect(parseScientific(b.a, b.n)?.normalized).toBe(true);
        if (b.t === 'power') expect(Number.isInteger(b.base) && Number.isInteger(b.exp) && b.exp >= 1).toBe(true);
        if (b.t === 'convert' && b.focus === 'zero') expect(zeroSteps(b.value)).toHaveLength(5);
        if (b.t === 'zeros') expect(zeroRoles(b.value)?.middle, b.value).toBeGreaterThan(0);
        if (b.t === 'backWork') {
          expect(parseScientific(b.a, b.n)?.normalized).toBe(true);
          expect(backSteps(b.a, b.n)).toHaveLength(4);
        }
        if (b.t === 'list') expect(b.items.length).toBeGreaterThan(0);
        if (b.t === 'try') {
          for (const it of b.items) {
            if (it.a !== undefined) expect(parseScientific(it.a, it.n)?.normalized, it.a).toBe(true);
            else expect(zeroRoles(it.value)?.middle, it.value).toBeGreaterThan(0);
          }
        }
      }
      // satu konsep per halaman: teks paragraf + daftar ≤ 40 kata
      const words = page.blocks.flatMap((b) => (b.t === 'p' ? [b.text] : b.t === 'list' ? b.items : [])).join(' ').split(/\s+/).filter(Boolean).length;
      expect(words, page.blocks[0].text).toBeLessThanOrEqual(40);
    }
    // urutan bab 1 → 4, halaman penutup di akhir
    const order = BOOK_PAGES.slice(1).map((p) => CHAPTERS.findIndex((c) => c.id === p.chapter));
    expect(order).toEqual([...order].sort((x, y) => x - y));
    expect(CHAPTERS.map((c) => c.id)).toEqual(['bab1', 'bab2', 'bab3', 'bab4']);
    expect(BOOK_PAGES.at(-1).blocks.some((b) => b.t === 'links')).toBe(true);
    // pengantar bilangan berpangkat ada sebelum bab bentuk baku
    expect(BOOK_PAGES.findIndex((p) => p.chapter === 'bab1')).toBeLessThan(BOOK_PAGES.findIndex((p) => p.chapter === 'bab2'));
  });

  it('kesalahan umum memang didiagnosis dengan kodenya', async () => {
    const { MISTAKES, QUICK_EXAMPLES } = await import('./notes.js');
    for (const m of MISTAKES) {
      const d = checkAnswer({ type: 'to_scientific', value: m.value }, m.wrong);
      expect(d.correct, m.code).toBe(false);
      expect(d.errorCode, m.code).toBe(m.code);
    }
    QUICK_EXAMPLES.forEach((v) => expect(workedSteps(v).length).toBe(4));
  });
});
