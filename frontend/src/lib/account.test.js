import { describe, expect, it } from 'vitest';
import { getSession, login, logout, register, updateProfile, validateRegister } from './account.js';

const good = { name: 'Rani', username: 'rani_8a', password: 'rahasia1', confirm: 'rahasia1' };

describe('validateRegister', () => {
  it('menerima isian yang benar', () => {
    expect(validateRegister(good)).toEqual({});
  });

  it('menolak nama/username tidak valid, dan sandi pendek/tidak sama', () => {
    expect(validateRegister({ ...good, name: 'R' }).name).toBeTruthy();
    expect(validateRegister({ ...good, username: 'A B' }).username).toBeTruthy();
    expect(validateRegister({ ...good, password: '123', confirm: '123' }).password).toBeTruthy();
    expect(validateRegister({ ...good, confirm: 'lain' }).confirm).toBeTruthy();
  });
});

describe('akun lokal', () => {
  it('daftar → keluar → masuk, dan menolak sandi salah', async () => {
    const r = await register(good);
    expect(r.ok).toBe(true);
    expect(getSession()).toEqual({ name: 'Rani', username: 'rani_8a', kelas: 'VIII', avatar: 'toga' });
    logout();
    expect(getSession()).toBeNull();
    expect((await login('rani_8a', 'salah123')).ok).toBe(false);
    expect((await login('RANI_8A', 'rahasia1')).ok).toBe(true);
    expect(getSession()?.username).toBe('rani_8a');
  });

  it('menolak username ganda dan username yang belum terdaftar', async () => {
    const dup = await register({ ...good, name: 'Rani Dua' });
    expect(dup.ok).toBe(false);
    expect(dup.errors.username).toMatch(/sudah dipakai/);
    expect((await login('tidakada', 'rahasia1')).errors.username).toMatch(/belum terdaftar/);
  });
});

describe('kelas tetap VIII', () => {
  it('kelas selalu VIII walau isian membawa kelas lain', async () => {
    const r = await register({ name: 'Bayu', username: 'bayu', kelas: 'IX', password: 'rahasia1', confirm: 'rahasia1' });
    expect(r.ok).toBe(true);
    expect(r.profile.kelas).toBe('VIII');
    expect(getSession().kelas).toBe('VIII');
  });
});

describe('profil', () => {
  it('avatar bisa diganti dan tetap setelah masuk lagi', async () => {
    await register({ name: 'Dewi', username: 'dewi', password: 'rahasia1', confirm: 'rahasia1' });
    updateProfile({ avatar: 'bunga' });
    expect(getSession().avatar).toBe('bunga');
    logout();
    await login('dewi', 'rahasia1');
    expect(getSession().avatar).toBe('bunga');
  });
});
