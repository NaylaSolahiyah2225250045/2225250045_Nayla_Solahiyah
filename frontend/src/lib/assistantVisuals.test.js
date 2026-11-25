import { describe, expect, it } from 'vitest';
import { BANK, FINAL_QUIZ } from '../content/bank.js';
import { VISUAL_LABELS } from '../content/visuals.js';
import { assistantVisuals, buildAssistantContext } from './assistant.js';
import { formatMath, leaksKey, MAX_VISUALS, supText, visualsFor, visualText } from './assistantVisuals.js';

const all = [
  ...Object.entries(BANK).flatMap(([t, b]) => [...b.levels[1], ...b.quiz].map((q, i) => [`${t} #${i + 1}`, q, t])),
  ...FINAL_QUIZ.map((q, i) => [`Kuis Akhir #${i + 1}`, q, null]),
];

/** Normalisasi sama dengan backend guardrails._norm_expr: superskrip → ^n, tanpa spasi, tanpa titik ribuan. */
const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
const norm = (s) =>
  String(s)
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => '^' + m.split('').map((c) => SUP[c]).join(''))
    .replace(/−/g, '-')
    .replace(/\s+/g, '')
    .replace(/(?<=\d)\.(?=\d{3})/g, '');
const shown = visualText;

describe('visual Asisten Belajar', () => {
  it.each(all)('%s: ada visual yang cocok (1–4), id dikenal, kunci jawaban tidak bocor', (_, q, t) => {
    const vs = assistantVisuals(q, t);
    expect(vs.length).toBeGreaterThanOrEqual(1);
    expect(vs.length).toBeLessThanOrEqual(MAX_VISUALS);
    for (const v of vs) {
      expect(VISUAL_LABELS[v.id], v.id).toBeTruthy();
      expect(v.summary.length).toBeLessThanOrEqual(400); // batas backend
    }
    const keys = buildAssistantContext(q, t).key_texts.filter((k) => /\d/.test(k));
    for (const v of vs) for (const k of keys) expect(leaksKey(visualText(v), [k]), `${v.id} memuat kunci "${k}"`).toBe(false);
    // ekspresi kunci (a × 10ⁿ) juga tidak muncul sebagai potongan teks mana pun
    for (const v of vs) for (const k of keys.filter((x) => /×|\^|10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/.test(x))) expect(norm(shown(v)).includes(norm(k)), `${v.id}: ${k}`).toBe(false);
  });

  it.each(all)('%s: konteks membawa topik & maksud soal (bahasa sehari-hari) tanpa kunci jawaban', (_, q, t) => {
    const ctx = buildAssistantContext(q, t);
    expect(ctx.topic, 'topik').toMatch(/^Topik [1-5] · /);
    expect(ctx.task, 'maksud soal').toBeTruthy();
    expect(ctx.task.length).toBeLessThanOrEqual(400); // batas backend
    expect(ctx.topic.length).toBeLessThanOrEqual(200);
    expect(ctx.task).not.toMatch(/\{digit\}/);
    for (const k of ctx.key_texts.filter((x) => /\d/.test(x))) expect(leaksKey(ctx.task, [k]), `maksud soal memuat kunci "${k}"`).toBe(false);
  });

  it('soal pemodelan (literasi RUMUS/TERAP) selalu mendapat tabel PMSTP lebih dulu', () => {
    for (const [name, q, t] of all.filter(([, x]) => x.literacy?.process.some((p) => p === 'RUMUS' || p === 'TERAP'))) expect(assistantVisuals(q, t)[0].id, name).toBe('pmstp');
  });

  it('angka contoh dihitung mesin dengan benar (kali, bagi, tambah, kurang, geser koma)', () => {
    const vis = (q, t) => Object.fromEntries(visualsFor(q, t).map((v) => [v.id, v]));
    const kali = vis({ type: 'operation', op: 'kali', x: { a: '9', n: 1 }, y: { a: '9', n: 1 } }, 't4')['kali-bagi'];
    expect(kali.data.lines.map((l) => l.text)).toEqual(['(3 × 10²) × (4 × 10⁵)', '(3 × 4) × (10² × 10⁵)', '12 × 10²⁺⁵ = 12 × 10⁷', '1,2 × 10⁸']);
    const bagi = vis({ type: 'operation', op: 'bagi', x: { a: '9', n: 1 }, y: { a: '9', n: 1 } }, 't4')['kali-bagi'];
    expect(bagi.data.lines.at(-1).text).toBe('4 × 10⁹⁻³ = 4 × 10⁶');
    const tambah = vis({ type: 'choose_correct', text: '(1 × 10²) + (1 × 10²) = …', options: [] }, 't4')['tambah-kurang'];
    expect(tambah.data.lines.at(-1).text).toBe('(2,1 + 3,4) × 10⁵ = 5,5 × 10⁵');
    const kurang = vis({ type: 'choose_correct', text: '(1 × 10²) − (1 × 10¹) = …', options: [] }, 't4')['tambah-kurang'];
    expect(kurang.data.lines.map((l) => l.text)).toEqual(['(7 × 10⁶) − (2 × 10⁵)', '(70 × 10⁵) − (2 × 10⁵)', '(70 − 2) × 10⁵ = 68 × 10⁵', '6,8 × 10⁶']);
    const geser = vis({ type: 'to_scientific', value: '12.000' }, 't3')['geser-koma'];
    expect(geser.summary).toBe('67.000 → 6,7 × 10⁴: koma melompat 4 kali ke kiri, jadi pangkatnya 4.');
    const kecil = vis({ type: 'to_standard', a: '3', n: -2 }, 't3')['geser-koma'];
    expect(kecil.summary).toBe('5,6 × 10⁻³ → 0,0056: pangkat −3, jadi koma bergeser 3 kali ke kiri; tempat kosong diisi nol.');
  });

  it('contoh yang sama dengan bilangan soal dilewati', () => {
    const q = { type: 'to_scientific', value: '67.000' };
    expect(assistantVisuals(q, 't3').find((v) => v.id === 'geser-koma').data.value).toBe('830.000');
  });

  it('konteks ke backend hanya membawa id + ringkasan visual', () => {
    const ctx = buildAssistantContext({ type: 'to_scientific', value: '0,0072' }, 't3');
    expect(ctx.visuals.length).toBeGreaterThan(0);
    for (const v of ctx.visuals) expect(Object.keys(v).sort()).toEqual(['id', 'summary']);
  });

  it('pemeriksa kebocoran: bilangan utuh vs potongan ekspresi', () => {
    expect(leaksKey('10⁵ = 100.000', ['1.000'])).toBe(false);
    expect(leaksKey('hasilnya 1.000 ya', ['1.000'])).toBe(true);
    expect(leaksKey('12 × 10⁷ = 1,2 × 10⁸', ['1,2 × 10⁸'])).toBe(true);
    expect(leaksKey('10² dan 10³', ['10'])).toBe(false); // basis 10 bukan bilangan 10
  });

  it('formatMath merapikan notasi tanpa menambah angka', () => {
    expect(formatMath('3 x 10^-4 dan 10^(5) -> besar')).toBe('3 × 10⁻⁴ dan 10⁵ → besar');
    expect(supText('6−(−2)')).toBe('⁶⁻⁽⁻²⁾');
    expect(formatMath('bentuk \\(a \\times 10^{n}\\) dan 10^{-3}')).toBe('bentuk a × 10ⁿ dan 10⁻³');
    expect(formatMath('$\\frac{1}{10} = 0{,}1$ dan $1 \\le a < 10$, `8 \\div 2`')).toBe('1/10 = 0,1 dan 1 ≤ a < 10, 8 : 2');
    expect(formatMath('\\[ (a \\times 10^{m}) \\div (b \\times 10^{n}) = \\left(\\frac{a}{b}\\right) \\times 10^{m-n} \\]')).toBe(' (a × 10ᵐ) : (b × 10ⁿ) = (a/b) × 10ᵐ⁻ⁿ ');
  });
});
