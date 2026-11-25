import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BANK, FINAL_QUIZ } from '../content/bank.js';
import { assistantStatus, buildAssistantContext, HISTORY_WINDOW, historyForServer } from './assistant.js';
import { visualsFor } from './assistantVisuals.js';

const allQuestions = () => [
  ...Object.entries(BANK).flatMap(([t, b]) => [...Object.values(b.levels).flat(), ...b.quiz].map((q) => [t, q])),
  ...FINAL_QUIZ.map((q) => [null, q]),
];

describe('Asisten Belajar: konteks soal', () => {
  it('setiap soal menghasilkan konteks berisi teks soal, pertanyaan pemandu, dan tidak mengubah soal', () => {
    for (const [t, q] of allQuestions()) {
      const before = JSON.stringify(q);
      const ctx = buildAssistantContext(q, t);
      expect(JSON.stringify(q)).toBe(before);
      expect(ctx.text.length).toBeGreaterThan(0);
      expect(ctx.text.length).toBeLessThanOrEqual(1500);
      expect(ctx.guide).toBeTruthy();
      expect(Object.keys(ctx).sort()).toEqual(['guide', 'key_texts', 'rule', 'skill', 'task', 'text', 'topic', 'visuals']); // tanpa data siswa
      expect(ctx.key_texts.length).toBeLessThanOrEqual(8);
    }
  });

  it('soal bentuk baku: kunci jawaban ada di key_texts, tetapi bilangan soal sendiri tidak dianggap kunci', () => {
    const ctx = buildAssistantContext({ type: 'to_scientific', value: '4.500.000' }, 't2');
    expect(ctx.text).toContain('4.500.000');
    expect(ctx.key_texts).toContain('4,5 × 10⁶');
    expect(ctx.key_texts).not.toContain('4.500.000');
  });

  it('soal operasi: kunci bentuk baku & bentuk biasa hasilnya dihitung lib/sci', () => {
    const ctx = buildAssistantContext({ type: 'operation', op: 'kali', x: { a: '4', n: 3 }, y: { a: '5', n: 4 } }, 't4');
    expect(ctx.key_texts).toEqual(expect.arrayContaining(['2 × 10⁸', '200.000.000']));
    expect(ctx.skill).toBe('kali');
  });

  it('di luar mode server (tanpa token) asisten tidak tersedia & tidak memanggil jaringan', async () => {
    const s = await assistantStatus();
    expect(s.available).toBe(false);
  });
});

describe('Asisten Belajar: kunci API tidak pernah ada di frontend', () => {
  const walk = (dir) =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });

  it('kode frontend tidak menyebut GROQ_API_KEY, api.groq.com, atau VITE_ untuk kunci AI', () => {
    const src = walk(join(process.cwd(), 'src')).filter((f) => /\.(js|jsx)$/.test(f) && !f.endsWith('.test.js'));
    for (const f of src) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toMatch(/GROQ_API_KEY|api\.groq\.com|gsk_[A-Za-z0-9]{10,}|VITE_[A-Z_]*(GROQ|AI_KEY|API_KEY)/);
    }
  });
});

describe('kunci pilihan ganda (25 Nov 2026)', () => {
  it('ekspresi di dalam pilihan benar ikut menjadi kunci', async () => {
    const { BANK } = await import('../content/bank.js');
    const ana = BANK.t4.levels[1].find((x) => x.form === 'kesalahan-aturan-bagi');
    expect(buildAssistantContext(ana, 't4').key_texts).toContain('3 × 10³');
  });
});

describe('Asisten Belajar: riwayat & visual (26 Nov 2026)', () => {
  it('riwayat panjang dikirim sebagai jendela yang dimulai dari pesan siswa (dulu pesan ke-11 gagal)', () => {
    const msgs = [];
    for (let i = 0; i < 15; i++) {
      msgs.push({ role: 'user', content: `tanya ${i}` });
      msgs.push({ role: 'assistant', content: `jawab ${i}`, source: i % 2 ? 'fallback' : 'ai', visual: i === 14 ? 'geser-koma' : null });
    }
    msgs.push({ role: 'user', content: 'terakhir' });
    const h = historyForServer(msgs);
    expect(h.length).toBeLessThanOrEqual(HISTORY_WINDOW);
    expect(h[0].role).toBe('user');
    expect(h.at(-1)).toEqual({ role: 'user', content: 'terakhir' });
    expect(h.at(-2)).toEqual({ role: 'assistant', content: 'jawab 14\n[[visual:geser-koma]]', source: 'ai' });
    expect(h.some((m) => m.source === 'fallback')).toBe(true);
    expect(h.filter((m) => m.role === 'user').every((m) => !('source' in m))).toBe(true);
  });

  it('garis bilangan mengikuti ukuran bilangan soal dan nilainya benar', () => {
    const line = (q) => visualsFor(q, 't2').find((v) => v.id === 'garis-bilangan');
    const small = line({ type: 'choose_correct', focus: 'compare', text: 'Manakah yang paling kecil? 4,7 × 10⁻³', options: [] });
    expect(small.data.points.map((p) => p.text)).toEqual(['0,00001', '0,0001', '0,001', '0,01', '0,1']);
    const big = line({ type: 'choose_correct', focus: 'compare', value: '32.000', options: [] });
    expect(big.data.points.map((p) => p.text)).toEqual(['10', '100', '1.000', '10.000', '100.000']);
    expect(big.summary).toBe('Garis bilangan pangkat 10 dari 10¹ = 10 sampai 10⁵ = 100.000. Satu langkah ke kanan, nilainya menjadi 10 kali lipat.');
  });
});
