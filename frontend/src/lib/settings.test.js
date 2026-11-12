import { describe, expect, it } from 'vitest';
import { getSettings, updateSettings } from './settings.js';

describe('pengaturan animasi', () => {
  it('aktif secara bawaan dan bisa dimatikan/dinyalakan', () => {
    expect(getSettings().animations).toBe(true);
    updateSettings({ animations: false });
    expect(getSettings().animations).toBe(false);
    updateSettings({ animations: true });
    expect(getSettings().animations).toBe(true);
  });
});
