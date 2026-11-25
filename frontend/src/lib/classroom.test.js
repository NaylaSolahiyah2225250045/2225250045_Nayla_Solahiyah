import { describe, expect, it } from 'vitest';
import { getSession, login, logout, register, registerTeacher, validateTeacherRegister } from './account.js';
import { CLASS_NAMES, local } from './classroom.js';
import { summarizeSnapshot, compactSession } from './snapshot.js';
import { PATH } from './learner.js';

const guru = { name: 'Sari Wulandari', login: 'sari@smpn1.sch.id', password: 'rahasia123', confirm: 'rahasia123', school: 'SMP Negeri 1' };

describe('akun guru', () => {
  it('validasi: nama, email/username, sandi ≥ 8, sekolah', () => {
    expect(validateTeacherRegister(guru)).toEqual({});
    expect(validateTeacherRegister({ ...guru, login: 'bukan email@' }).login).toBeTruthy();
    expect(validateTeacherRegister({ ...guru, login: 'pak_budi' }).login).toBeUndefined();
    expect(validateTeacherRegister({ ...guru, password: 'pendek1', confirm: 'pendek1' }).password).toBeTruthy();
    expect(validateTeacherRegister({ ...guru, school: '' }).school).toBeTruthy();
  });

  it('daftar guru → peran guru; masuk lagi dikenali otomatis sebagai guru', async () => {
    const r = await registerTeacher(guru);
    expect(r.ok).toBe(true);
    expect(getSession()).toMatchObject({ role: 'teacher', name: 'Sari Wulandari', school: 'SMP Negeri 1', status: 'active', tourPending: true });
    logout();
    expect((await login('SARI@smpn1.sch.id', 'rahasia123')).profile.role).toBe('teacher');
    expect((await registerTeacher(guru)).errors.login).toMatch(/sudah terdaftar/);
    logout();
  });
});

describe('kelas (mode lokal)', () => {
  it('guru membuat VIII-A–E, siswa bergabung dengan kode, hak akses dijaga', async () => {
    await login('sari@smpn1.sch.id', 'rahasia123');
    const made = [];
    for (const name of CLASS_NAMES) made.push(await local.createClass({ name, academic_year: '2026/2027' }));
    expect(new Set(made.map((c) => c.join_code)).size).toBe(5);
    await expect(local.createClass({ name: 'VIII-A' })).rejects.toThrow(/sudah kamu buat/);
    await expect(local.createClass({ name: 'IX-A' })).rejects.toThrow(/VIII-A sampai VIII-E/);
    const a = made[0];
    logout();

    await register({ name: 'Rani', username: 'rani_kls', password: 'rahasia1', confirm: 'rahasia1' });
    await expect(local.listClasses()).rejects.toThrow(/tidak tersedia/); // siswa tidak bisa memakai fitur guru
    await expect(local.joinClass('ZZZZZZ')).rejects.toThrow(/tidak ditemukan/);
    const joined = await local.joinClass(a.join_code.toLowerCase());
    expect(joined).toMatchObject({ name: 'VIII-A', teacher_name: 'Sari Wulandari', school: 'SMP Negeri 1' });
    await expect(local.joinClass(made[1].join_code)).rejects.toThrow(/kelas lain/);
    await local.pushSnapshot({ v: 1, modules: { t1: { answered: 4, correct: 3, levelUnlocked: 2 } }, history: [], days: { '2026-11-17': { latihan: { count: 4, correct: 3 } } }, bookRead: 5 });
    logout();

    // guru lain tidak melihat kelas & siswa milik guru pertama
    await registerTeacher({ ...guru, name: 'Budi Santoso', login: 'budi_guru' });
    expect(await local.listClasses()).toEqual([]);
    await expect(local.studentDetail('rani_kls')).rejects.toThrow(/tidak ditemukan/);
    await expect(local.deleteClass(a.id)).rejects.toThrow(/tidak ditemukan/);
    logout();

    await login('sari@smpn1.sch.id', 'rahasia123');
    const ov = await local.overview();
    const kelasA = ov.classes.find((c) => c.klass.name === 'VIII-A');
    expect(kelasA.klass.student_count).toBe(1);
    expect(kelasA.students[0]).toMatchObject({ id: 'rani_kls', display_name: 'Rani' });
    const sum = summarizeSnapshot(kelasA.students[0].snapshot);
    expect(sum).toMatchObject({ answered: 4, correct: 3, accuracy: 75, bookRead: 5, hasData: true });
    expect(sum.stats.activeDays).toBe(1);
    // kode baru: kode lama tidak berlaku; menutup pendaftaran
    const renewed = await local.regenerateCode(a.id);
    expect(renewed.join_code).not.toBe(a.join_code);
    await local.updateClass(made[1].id, { join_enabled: false });
    await local.removeStudent(a.id, 'rani_kls');
    expect((await local.overview()).classes.find((c) => c.klass.id === a.id).students).toEqual([]);
    logout();

    await login('rani_kls', 'rahasia1');
    await expect(local.joinClass(a.join_code)).rejects.toThrow(/tidak ditemukan/);
    await expect(local.joinClass(made[1].join_code)).rejects.toThrow(/tidak menerima/);
    expect(await local.myClasses()).toEqual([]);
    logout();
  });
});

describe('ringkasan belajar untuk guru', () => {
  it('siswa tanpa data: semua nol & titik pertama sedang dikerjakan', () => {
    const s = summarizeSnapshot(null);
    expect(s).toMatchObject({ hasData: false, answered: 0, nodesDone: 0 });
    expect(s.statuses[PATH[0].id]).toBe('current');
  });

  it('sesi riwayat diringkas tanpa objek soal (teks soal, jawaban, benar/salah)', () => {
    const c = compactSession({
      id: 'x',
      at: '2026-11-17T08:00:00Z',
      kind: 'latihan',
      nodeId: 't1-latihan',
      moduleId: 't1',
      title: 'Topik 1 · Latihan',
      correct: 1,
      total: 10,
      score: 10,
      items: [{ q: { type: 'ten_to_standard', n: 3 }, response: '1.000', correct: true, errorCode: null }],
    });
    expect(c.items[0]).toEqual({ prompt: 'Tulis dalam bentuk biasa:', response: '1.000', correct: true, errorCode: null });
    expect(JSON.stringify(c)).not.toContain('"q"');
    const sum = summarizeSnapshot({ modules: {}, history: [c], days: {}, bookRead: 0 });
    expect(sum.statuses['t1-latihan']).toBe('current'); // baru 1 dari 10 benar: belum lulus (perlu ≥ 6), rumus sama dengan Dashboard Siswa
    expect(summarizeSnapshot({ history: [{ ...c, correct: 6, total: 10 }] }).statuses['t1-latihan']).toBe('done');
    // riwayat lama: lulus Level 4 (5 soal, 3 benar) tetap dihitung selesai
    expect(summarizeSnapshot({ history: [{ ...c, nodeId: 't1-l4', correct: 3, total: 5 }] }).statuses['t1-latihan']).toBe('done');
  });
});

describe('preferensi suara & panduan per akun (21 Nov 2026)', async () => {
  const { getSettings, updateSettings } = await import('./settings.js');
  const { completeTour, saveAudioPrefs } = await import('./account.js');

  it('preferensi musik tersimpan per akun dan berlaku lagi saat masuk kembali', async () => {
    await register({ name: 'Dodi', username: 'dodi_pref', password: 'rahasia1', confirm: 'rahasia1' });
    updateSettings({ music: false, volume: 35 });
    expect(saveAudioPrefs()).toBe(true);
    logout();
    updateSettings({ music: true, volume: 80 }); // pengguna lain di perangkat yang sama
    await login('dodi_pref', 'rahasia1');
    expect(getSettings()).toMatchObject({ music: false, volume: 35 });
    logout();
    updateSettings({ music: true, volume: 60 });
  });

  it('guru baru mendapat panduan guru sekali; tidak muncul lagi setelah selesai', async () => {
    const r = await registerTeacher({ ...guru, name: 'Rina Guru', login: 'rina_guru' });
    expect(r.profile.tourPending).toBe(true);
    completeTour();
    expect(getSession().tourPending).toBe(false);
    logout();
    expect((await login('rina_guru', 'rahasia123')).profile.tourPending).toBe(false);
    logout();
  });
});
