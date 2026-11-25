import { describe, expect, it } from 'vitest';
import { MUSIC, SFX, midiToHz, playSfx, sfxDuration, startMusic } from './audio.js';
import { getSettings, updateSettings } from './settings.js';

describe('efek suara', () => {
  it('tujuh efek sesuai permintaan, singkat & lembut', () => {
    expect(Object.keys(SFX).sort()).toEqual(['badge', 'click', 'correct', 'level', 'menu', 'quiz', 'wrong']);
    for (const [name, notes] of Object.entries(SFX)) {
      expect(sfxDuration(name), name).toBeLessThanOrEqual(1.5);
      for (const n of notes) {
        expect(n.v, name).toBeLessThanOrEqual(0.6);
        expect(['sine', 'triangle']).toContain(n.type);
      }
    }
    expect(sfxDuration('click')).toBeLessThan(0.2);
  });

  it('A4 = 440 Hz', () => {
    expect(midiToHz(69)).toBe(440);
    expect(Math.round(midiToHz(72))).toBe(523);
  });

  it('tanpa interaksi / tanpa dukungan audio: tidak berbunyi dan tidak galat', () => {
    expect(() => playSfx('correct')).not.toThrow();
    expect(startMusic()).toBe(false);
  });
});

describe('musik latar', () => {
  it('8 birama berulang, melodi hanya nada pentatonik C (tanpa vokal)', () => {
    expect(MUSIC.chords).toHaveLength(8);
    expect(MUSIC.melody).toHaveLength(8);
    const pentatonic = new Set([0, 2, 4, 7, 9]); // C D E G A
    for (const bar of MUSIC.melody) {
      expect(bar).toHaveLength(8);
      for (const m of bar) if (m !== null) expect(pentatonic.has(m % 12), String(m)).toBe(true);
    }
  });
});

describe('pengaturan audio', () => {
  it('musik & efek suara aktif secara bawaan dan bisa dimatikan (penyimpanan diuji di browser)', () => {
    expect(getSettings().music).toBe(true);
    expect(getSettings().sfx).toBe(true);
    updateSettings({ music: false, sfx: false });
    expect(getSettings()).toMatchObject({ music: false, sfx: false });
    updateSettings({ music: true, sfx: true });
  });
});

describe('musik global & volume (21 Nov 2026)', async () => {
  const { MUSIC_MAX, musicGainFor } = await import('./audio.js');
  const { DEFAULT_VOLUME, cleanVolume } = await import('./settings.js');

  it('volume 0–100 → gain musik, dibatasi & bawaan 60', () => {
    expect(musicGainFor(100)).toBeCloseTo(MUSIC_MAX);
    expect(musicGainFor(0)).toBe(0);
    expect(musicGainFor(250)).toBeCloseTo(MUSIC_MAX);
    expect(DEFAULT_VOLUME).toBe(60);
    expect(cleanVolume(73.4)).toBe(73);
    expect(cleanVolume(-5)).toBe(0);
    expect(cleanVolume(Number.NaN)).toBeNull();
    updateSettings({ volume: 999 });
    expect(getSettings().volume).toBe(100);
    updateSettings({ volume: DEFAULT_VOLUME });
  });

  it('lagu langsung bermelodi di ketukan pertama (tanpa intro hening)', () => {
    expect(MUSIC.melody[0][0]).not.toBeNull();
  });
});
