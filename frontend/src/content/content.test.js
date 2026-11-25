import { describe, expect, it } from 'vitest';
import { BANK, FINAL_QUIZ, isPassed, PASS_COUNT, PER_SESSION } from './bank.js';
import { MIGRATE, MODULES } from './modules.js';
import { skillOf } from '../lib/rmt.js';
import {
  answerKey,
  backResult,
  backSteps,
  checkAnswer,
  compareValues,
  explanationFor,
  hintsFor,
  operationKey,
  operationSteps,
  parseScientific,
  parseStandard,
  placeValueOf,
  powText,
  sciText,
  splitDecimal,
  toScientific,
  valueOf,
  workedSteps,
  zeroRoles,
  zeroSteps,
} from '../lib/sci/index.js';

const levelQs = Object.entries(BANK).flatMap(([t, b]) => Object.entries(b.levels).flatMap(([lv, qs]) => qs.map((q, i) => [`${t} L${lv} #${i + 1}`, q])));
const quizQs = Object.entries(BANK).flatMap(([t, b]) => b.quiz.map((q, i) => [`${t} kuis #${i + 1}`, q]));
const finalQs = FINAL_QUIZ.map((q, i) => [`Kuis Akhir #${i + 1}`, q]);
const all = [...levelQs, ...quizQs, ...finalQs];

/** "3,4 × 10⁶" → { a: '3,4', n: '6' } */
const SUPS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
const parseSciText = (t) => {
  const m = t.match(/(-?\d+(?:,\d+)?) × 10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/);
  return m && { a: m[1], n: m[2].split('').map((c) => SUPS[c]).join('') };
};

/** Kelompok keterampilan + bilangan yang ditampilkan — dipakai untuk mendeteksi soal kembar. */
const canon = (x) => `${x.digits}e${x.exp}`;
function signature(q) {
  if (q.type === 'choose_correct' && !q.focus) return `mc:${q.text}`;
  if (q.focus === 'compare') return `banding:${q.items.map((p) => canon(valueOf(p))).sort().join('|')}`;
  switch (q.type) {
    case 'power_of_ten':
      return `pangkat10:${canon(parseStandard(q.value))}`;
    case 'ten_to_standard':
      return `pangkat10:1e${q.n}`;
    case 'place_value':
      return `nilaitempat:${q.value}`;
    case 'normalize':
      return `normal:${q.a}e${q.n}`;
    case 'operation':
      return `op:${q.op}:${canon(valueOf(q.x))}|${canon(valueOf(q.y))}`;
    default: {
      // to_scientific / to_standard / pilihan ganda nol & bentuk biasa: satu keluarga "konversi"
      const v = q.value !== undefined ? parseStandard(q.value) : valueOf(q);
      return `konversi:${canon(v)}`;
    }
  }
}

/**
 * POLA soal = keterampilan + bentuk pertanyaan + cara penyelesaian (bukan angkanya). Dua soal berpola
 * sama hanya berbeda angka/konteks, jadi dianggap berulang. Pilihan ganda konsep memakai `form`.
 */
function pattern(q) {
  if (q.form) return `pg:${q.form}`;
  const story = q.text ? ':cerita' : '';
  if (q.focus === 'compare') {
    const exps = new Set(q.items.map((p) => p.n));
    return `banding:${q.items.length > 2 ? 'banyak' : 'dua'}:${exps.size === 1 ? 'pangkat-sama' : 'pangkat-beda'}${story}`;
  }
  if (q.type === 'choose_correct') return `pg-${q.focus}${q.literacy ? ':cerita' : ''}`;
  const sign = (n) => (n > 0 ? 'positif' : n < 0 ? 'negatif' : 'nol');
  switch (q.type) {
    case 'power_of_ten':
      return `pangkat10:ke-pangkat:${sign(parseStandard(q.value).exp)}${story}`;
    case 'ten_to_standard':
      return `pangkat10:ke-biasa:${sign(q.n)}`;
    case 'place_value':
      return `nilai-tempat:${q.pos >= 0 ? 'bulat' : 'desimal'}`;
    case 'normalize':
      return `normal:${parseStandard(q.a).exp >= 1 ? 'a≥10' : 'a<1'}${story}`;
    case 'to_standard': {
      const dec = (q.a.split(',')[1] ?? '').length;
      const pad = q.n < 0 || q.n > dec ? 'tambah-nol' : 'tanpa-tambah-nol';
      return `biasa:${sign(q.n)}:${pad}${/[1-9]0+[1-9]/.test(q.a.replace(',', '')) ? ':nol-tengah' : ''}`;
    }
    case 'to_scientific': {
      const x = parseStandard(q.value);
      const { n } = toScientific(x);
      if (q.focus === 'zero') {
        const middle = zeroMiddle(q.value);
        return `nol-tengah:${sign(n)}${q.value.includes(',') && n > 0 ? ':berkoma' : ''}${middle > 1 ? ':banyak-nol' : ''}`;
      }
      return `baku:${sign(n)}:${x.digits.length > 1 ? 'banyak-angka' : 'satu-angka'}${q.value.includes(',') && n > 0 ? ':berkoma' : ''}${story}`;
    }
    case 'operation': {
      const k = operationKey(q);
      const raw = q.op === 'kali' ? 'kali' : 'bagi';
      const neg = q.x.n < 0 || q.y.n < 0 ? ':negatif' : '';
      const dec = q.x.a.includes(',') || q.y.a.includes(',') ? ':berkoma' : '';
      // Hasil perlu dinormalkan bila pangkat kunci ≠ jumlah/selisih pangkat (tanpa floating point)
      const plain = raw === 'kali' ? q.x.n + q.y.n : q.x.n - q.y.n;
      const fix = Number(k.n) !== plain ? ':dinormalkan' : '';
      return `op:${raw}${fix}${neg}${dec}${q.traps ? ':satuan' : ''}${story}`;
    }
    default:
      return q.type;
  }
}
const zeroMiddle = (value) => zeroRoles(value)?.middle ?? 0;

/** Bilangan yang dipakai sebagai contoh di materi interaktif (tidak boleh muncul lagi sebagai soal latihan). */
const exampleSigs = new Set(
  MODULES.flatMap((m) =>
    m.items.flatMap((it) => {
      if (it.type === 'guided') return [signature({ type: 'to_scientific', value: it.value })];
      if (it.type !== 'worked' && it.type !== 'faded') return [];
      if (it.qtype === 'operation') return [signature({ type: 'operation', op: it.op, x: it.x, y: it.y })];
      if (it.qtype === 'to_standard') return [signature({ type: 'to_standard', a: it.a, n: it.n })];
      return [signature({ type: it.qtype, value: it.value })];
    }),
  ),
);

describe('susunan bank soal', () => {
  it('5 topik, masing-masing SATU level latihan 10 soal + kuis topik 5 soal (23 Nov 2026)', () => {
    expect(Object.keys(BANK)).toEqual(MODULES.map((m) => m.id));
    for (const b of Object.values(BANK)) {
      expect(Object.keys(b.levels)).toEqual(['1']);
      expect(b.levels[1]).toHaveLength(PER_SESSION);
      expect(b.quiz.length).toBe(5);
    }
    expect(PER_SESSION).toBe(10);
    expect(PASS_COUNT).toBe(6);
  });

  it('jumlah soal dikunci: 10 per topik, total 50 soal latihan (jangan dipangkas tanpa persetujuan)', () => {
    const counts = Object.fromEntries(Object.entries(BANK).map(([t, b]) => [t, Object.values(b.levels).map((qs) => qs.length)]));
    expect(counts).toEqual({ t1: [10], t2: [10], t3: [10], t4: [10], t5: [10] });
  });

  it('kesulitan naik bertahap: 3 mudah → 4 sedang → 3 sulit; awal = mengenali, akhir = penalaran/konteks', () => {
    for (const [t, b] of Object.entries(BANK)) {
      const qs = b.levels[1];
      expect(qs.map((q) => q.tier), t).toEqual(['mudah', 'mudah', 'mudah', 'sedang', 'sedang', 'sedang', 'sedang', 'sulit', 'sulit', 'sulit']);
      // soal sulit: pilihan ganda penalaran, soal berkonteks, atau langkah ganda (bukan sekadar konversi biasa)
      for (const q of qs.slice(7)) {
        const reasoning = q.type === 'choose_correct' || !!q.text || !!q.literacy || /[1-9]0+[1-9]/.test(String(q.a ?? '').replace(',', ''));
        expect(reasoning, `${t} soal sulit: ${q.type} ${q.text ?? q.value ?? q.a}`).toBe(true);
      }
      // soal mudah: tanpa operasi bertahap / campuran
      for (const q of qs.slice(0, 3)) expect(['normalize'].includes(q.type), `${t} soal mudah`).toBe(false);
    }
    expect(isPassed(3, 5) && isPassed(3, 4) && isPassed(6, 10) && !isPassed(5, 10) && !isPassed(2, 5)).toBe(true);
  });

  it('setiap topik hanya melatih kompetensinya sendiri (tidak ada soal isian antar-topik yang tumpang tindih)', () => {
    // Keterampilan soal isian/mesin (lib/rmt skillOf) yang boleh muncul di latihan tiap topik (23 Nov 2026).
    // Pilihan ganda konsep (skill null) dibatasi lewat `form` yang unik di seluruh bank.
    const ALLOWED = {
      t1: ['pangkat10', 'nilaiTempat'],
      t2: ['banding'],
      t3: ['keBaku', 'keBiasa', 'nolTengah'],
      t4: ['kali', 'bagi', 'normal', 'cerita'],
      t5: ['banding', 'cerita', 'kali', 'bagi'],
    };
    for (const [t, b] of Object.entries(BANK)) {
      for (const [i, q] of b.levels[1].entries()) {
        const skill = skillOf(q);
        if (skill) expect(ALLOWED[t], `${t} #${i + 1}: ${skill}`).toContain(skill);
      }
    }
    // konversi bebas (bentuk biasa ⇄ bentuk baku) hanya di Topik 3
    const conv = Object.entries(BANK).flatMap(([t, b]) => b.levels[1].filter((q) => ['to_scientific', 'to_standard'].includes(q.type)).map(() => t));
    expect(new Set(conv)).toEqual(new Set(['t3']));
  });

  it('Kuis Akhir: 10 soal, 2 dari setiap topik', () => {
    expect(FINAL_QUIZ).toHaveLength(10);
    for (const m of MODULES) expect(FINAL_QUIZ.filter((q) => q.topic === m.no), m.id).toHaveLength(2);
  });

  it('tidak ada soal kembar di seluruh bank (level, kuis topik, Kuis Akhir)', () => {
    const seen = new Map();
    for (const [name, q] of all) {
      const sig = signature(q);
      expect(seen.get(sig), `${name} sama dengan ${seen.get(sig)} (${sig})`).toBeUndefined();
      seen.set(sig, name);
    }
  });

  it('soal latihan tidak memakai bilangan contoh terurai di materi', () => {
    for (const [name, q] of all) expect(exampleSigs.has(signature(q)), `${name}: ${signature(q)}`).toBe(false);
  });

  it('setiap level bervariasi: minimal 2 jenis soal', () => {
    for (const [t, b] of Object.entries(BANK)) {
      for (const [lv, qs] of Object.entries(b.levels)) {
        const kinds = new Set(qs.map((q) => (q.type === 'choose_correct' ? `mc-${q.focus ?? 'konsep'}` : `${q.type}-${q.focus ?? ''}`)));
        expect(kinds.size, `${t} L${lv}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('satu pola hanya sekali di Level 1–4 sebuah topik, tidak berulang di dalam kuis', () => {
    for (const [t, b] of Object.entries(BANK)) {
      const seen = new Map();
      for (const [lv, qs] of Object.entries(b.levels)) {
        qs.forEach((q, i) => {
          const p = pattern(q);
          expect(seen.get(p), `${t} L${lv} #${i + 1} berpola sama dengan ${seen.get(p)} (${p})`).toBeUndefined();
          seen.set(p, `${t} L${lv} #${i + 1}`);
        });
      }
      const quizPatterns = b.quiz.map(pattern);
      expect(new Set(quizPatterns).size, `${t} kuis: ${quizPatterns.join(' · ')}`).toBe(quizPatterns.length);
    }
    const finalPatterns = FINAL_QUIZ.map(pattern);
    expect(new Set(finalPatterns).size, finalPatterns.join(' · ')).toBe(finalPatterns.length);
  });

  it('pilihan ganda konsep: bentuk, kalimat, dan susunan pilihan tidak dipakai dua kali', () => {
    const mcs = all.filter(([, q]) => q.type === 'choose_correct');
    const forms = mcs.filter(([, q]) => q.form).map(([n, q]) => [n, q.form]);
    const stems = mcs.filter(([, q]) => q.focus !== 'compare').map(([n, q]) => [n, q.text.replace(/[\d⁰¹²³⁴⁵⁶⁷⁸⁹⁻.,]+/g, '#')]);
    const optionSets = mcs.map(([n, q]) => [n, q.options.map((o) => o.text).sort().join(' | ')]);
    for (const list of [forms, stems, optionSets]) {
      const seen = new Map();
      for (const [n, v] of list) {
        expect(seen.get(v), `${n} sama dengan ${seen.get(v)}: ${v}`).toBeUndefined();
        seen.set(v, n);
      }
    }
    // (kalimat soal membandingkan dibuat mesin dan sama untuk semua; bilangan & pilihannya berbeda)
    // Pilihan ganda tanpa mesin (focus) wajib punya bentuk, 3 petunjuk khusus, dan pembahasan
    for (const [n, q] of mcs.filter(([, x]) => !x.focus || x.form)) {
      expect(q.form, n).toBeTruthy();
      expect(q.hints, n).toHaveLength(3);
      expect(q.explain?.length, n).toBeGreaterThanOrEqual(3);
    }
  });

  it('letak jawaban benar pilihan ganda bervariasi di setiap level & kuis', () => {
    const groups = [...Object.entries(BANK).flatMap(([t, b]) => [...Object.entries(b.levels).map(([lv, qs]) => [`${t} L${lv}`, qs]), [`${t} kuis`, b.quiz]]), ['Kuis Akhir', FINAL_QUIZ]];
    for (const [name, qs] of groups) {
      const keys = qs.filter((q) => q.type === 'choose_correct' && q.focus !== 'compare').map((q) => q.answer);
      if (keys.length >= 2) expect(new Set(keys).size, `${name}: ${keys.join('')}`).toBeGreaterThan(1);
    }
  });

  it('soal berkonteks (soal cerita) punya label literasi', () => {
    for (const [name, q] of all) {
      const contextual = q.type !== 'choose_correct' ? !!q.text : /\d\s?(km|m|kg|g|jiwa|ton|byte|L|hari|detik)\b|Rp\d/.test(q.text);
      if (contextual) {
        expect(q.literacy, name).toBeTruthy();
        expect(['PERSONAL', 'SOSBUD', 'SAINTIFIK']).toContain(q.literacy.context);
        q.literacy.process.forEach((p) => expect(['RUMUS', 'TERAP', 'TAFSIR', 'NALAR']).toContain(p));
      }
    }
    // Topik 5 = penerapan: setiap soalnya berkonteks
    for (const [name, q] of all.filter(([n]) => n.startsWith('t5'))) expect(q.literacy, name).toBeTruthy();
  });
});

describe('setiap soal benar secara matematis', () => {
  it.each(all)('%s: kunci valid, lolos pemeriksa, ada petunjuk & pembahasan', (_, q) => {
    const key = answerKey(q);
    const response = q.type === 'power_of_ten' ? String(key) : key;
    expect(checkAnswer(q, response).correct).toBe(true);
    expect(hintsFor(q)).toHaveLength(3);
    expect(explanationFor(q).length).toBeGreaterThanOrEqual(3);
  });

  it.each(all.filter(([, q]) => q.type === 'choose_correct'))('%s: pengecoh punya kode kesalahan', (_, q) => {
    q.options.filter((o) => o.key !== q.answer).forEach((o) => expect(o.errorCode, o.text).toBeTruthy());
    expect(q.options.filter((o) => o.key === q.answer)).toHaveLength(1);
    // Pilihan benar yang berbentuk a × 10ⁿ untuk soal "bentuk baku dari <bilangan>" = hasil mesin.
    const num = q.text.match(/\d[\d.]*,\d+|\d{1,3}(?:\.\d{3})+/);
    const right = q.options.find((o) => o.key === q.answer).text;
    if (num && /bentuk baku/i.test(q.text) && right.includes('×')) {
      const { a, n } = toScientific(parseStandard(num[0]));
      expect(right).toContain(sciText(a, n));
    }
  });

  it.each(all.filter(([, q]) => q.type === 'choose_correct' && q.focus))('%s: jawaban dihitung mesin & setiap pengecoh didiagnosis dengan kodenya', (_, q) => {
    if (q.focus === 'compare') {
      const vals = q.items.map(valueOf);
      const best = vals.reduce((b, v) => ((q.want === 'besar' ? compareValues(v, b) > 0 : compareValues(v, b) < 0) ? v : b));
      const right = q.options.find((o) => o.key === q.answer).text;
      expect(right).toBe(sciText(...Object.values(toScientific(best))));
      expect(new Set(vals.map((v) => `${v.digits}e${v.exp}`)).size).toBe(vals.length);
      return;
    }
    if (q.explain) return; // pilihan berupa kalimat (penalaran); pembahasannya ditulis
    for (const o of q.options) {
      const d =
        q.focus === 'zero'
          ? checkAnswer({ type: 'to_scientific', value: q.value }, parseSciText(o.text))
          : checkAnswer({ type: 'to_standard', a: q.a, n: q.n }, o.text.split(' ')[0]);
      if (o.key === q.answer) expect(d.correct, o.text).toBe(true);
      else expect(d.errorCode, o.text).toBe(o.errorCode);
    }
  });

  it('operasi: pembagian tepat (tidak berulang) & pembahasan berakhir dengan kunci', () => {
    for (const [name, q] of all.filter(([, x]) => x.type === 'operation')) {
      const key = operationKey(q);
      expect(key.a.replace(',', '').length, name).toBeLessThanOrEqual(6);
      expect(operationSteps(q).at(-1), name).toContain(sciText(key.a, key.n));
      for (const t of q.traps ?? []) expect(checkAnswer(q, { a: t.a, n: String(t.n) }).errorCode, name).toBe(t.code);
    }
  });

  it('nilai tempat: angka yang ditanyakan hanya muncul sekali', () => {
    for (const [name, q] of all.filter(([, x]) => x.type === 'place_value')) {
      const p = splitDecimal(q.value);
      const { digit } = placeValueOf(q.value, q.pos);
      expect((p.int + p.frac).split(digit).length - 1, name).toBe(1);
    }
  });
});

describe('topik materi (modul interaktif)', () => {
  it('lima topik, masing-masing lengkap: tujuan, materi, contoh, setengah jadi, latihan, kuis', () => {
    expect(MODULES.map((m) => m.id)).toEqual(['t1', 't2', 't3', 't4', 't5']);
    expect(MODULES.map((m) => m.no)).toEqual([1, 2, 3, 4, 5]);
    for (const m of MODULES) {
      const types = m.items.map((i) => i.type);
      for (const t of ['intro', 'concept', 'worked', 'faded', 'practice', 'quiz']) expect(types, `${m.id} ${t}`).toContain(t);
      expect(types[0]).toBe('intro');
      expect(types.filter((t) => t === 'intro')).toHaveLength(1);
      expect(types.slice(-2)).toEqual(['practice', 'quiz']);
      expect(BANK[m.id]).toBeTruthy();
    }
  });

  it('contoh dihitung lib/sci, setengah jadi tidak membocorkan jawaban, layar ≤ 40 kata', () => {
    for (const m of MODULES) {
      for (const item of m.items) {
        if (item.type === 'worked' || item.type === 'faded') {
          let steps;
          let answer;
          if (item.steps) {
            steps = item.steps;
          } else if (item.qtype === 'to_standard') {
            expect(parseScientific(item.a, item.n)?.normalized).toBe(true);
            steps = backSteps(item.a, item.n);
            answer = backResult(item.a, item.n);
          } else if (item.qtype === 'operation') {
            steps = operationSteps(item);
            const k = operationKey(item);
            answer = sciText(k.a, k.n);
          } else if (item.focus === 'zero') {
            steps = zeroSteps(item.value);
            answer = powText(parseStandard(item.value).exp);
          } else {
            steps = workedSteps(item.value);
            answer = item.qtype === 'to_scientific' ? powText(parseStandard(item.value).exp) : null;
          }
          expect(steps.length, item.value ?? item.a ?? item.op).toBeGreaterThanOrEqual(3);
          if (item.type === 'faded' && answer && !item.steps) expect(steps.slice(0, item.shown).join(' ')).not.toContain(answer);
        }
        if (item.type === 'guided') expect(parseStandard(item.value)).not.toBeNull();
        if (item.visual?.kind === 'back') expect(parseScientific(item.visual.a, item.visual.n)?.normalized).toBe(true);
        if (item.visual?.kind === 'zeros' || item.visual?.kind === 'comma') expect(parseStandard(item.visual.value)).not.toBeNull();
        const words = [item.text, ...(item.list ?? [])].filter(Boolean).join(' ').split(/\s+/).length;
        if (item.type === 'concept' || item.type === 'intro') expect(words, `${m.id} ${item.title}`).toBeLessThanOrEqual(40);
      }
    }
  });

  it('peta progres modul lama → topik mencakup m1–m5 dan menunjuk layar yang ada', () => {
    expect(Object.keys(MIGRATE).sort()).toEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
    expect(Object.fromEntries(Object.entries(MIGRATE).map(([k, v]) => [k, v.to]))).toEqual({ m1: 't1', m2: 't2', m3: 't2', m4: 't3', m5: 't3' });
    for (const { to, map } of Object.values(MIGRATE)) {
      const len = MODULES.find((m) => m.id === to).items.length;
      for (let i = 0; i < 16; i++) expect(map(i)).toBeLessThan(len);
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
            if (it.op) expect(operationKey(it).a.replace(',', '').length).toBeLessThanOrEqual(6);
            else if (it.a !== undefined) expect(parseScientific(it.a, it.n)?.normalized, it.a).toBe(true);
            else expect(zeroRoles(it.value)?.middle, it.value).toBeGreaterThan(0);
          }
        }
        if (b.t === 'op') expect(operationSteps(b).at(-1)).toContain(sciText(operationKey(b).a, operationKey(b).n));
        if (b.t === 'places' || b.t === 'expand') expect(splitDecimal(b.value)).not.toBeNull();
        if (b.t === 'compare') b.items.forEach((p) => expect(parseScientific(p.a, p.n)?.normalized).toBe(true));
        if (b.t === 'units') b.rows.forEach((r) => expect(Number.isInteger(r.n)).toBe(true));
      }
      // satu konsep per halaman: teks paragraf + daftar ≤ 40 kata
      const words = page.blocks.flatMap((b) => (b.t === 'p' ? [b.text] : b.t === 'list' ? b.items : [])).join(' ').split(/\s+/).filter(Boolean).length;
      expect(words, page.blocks[0].text).toBeLessThanOrEqual(40);
    }
    // lima bab = lima topik (judul sama), berurutan; halaman penutup di akhir
    const order = BOOK_PAGES.slice(1).map((p) => CHAPTERS.findIndex((c) => c.id === p.chapter));
    expect(order).toEqual([...order].sort((x, y) => x - y));
    expect(CHAPTERS.map((c) => c.id)).toEqual(['bab1', 'bab2', 'bab3', 'bab4', 'bab5']);
    expect(CHAPTERS.map((c) => c.title)).toEqual(MODULES.map((m) => m.title));
    CHAPTERS.forEach((c) => expect(BOOK_PAGES.filter((p) => p.chapter === c.id).length, c.id).toBeGreaterThanOrEqual(5));
    // judul halaman tidak kembar di dalam satu bab
    for (const c of CHAPTERS) {
      const titles = BOOK_PAGES.filter((p) => p.chapter === c.id).map((p) => p.blocks[0].text);
      expect(new Set(titles).size, c.id).toBe(titles.length);
    }
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
