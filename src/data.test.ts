/**
 * 確保 SCENARIOS 內每筆引用的 key（語言、曲風、情緒、樂器、人聲、紋理、
 * Negatives、結構骨架）都存在於對應的字典 — 避免新增情境時 typo 導致
 * buildStylePrompt 退化成原始中文鍵。
 */
import { describe, it, expect } from 'vitest';
import {
  SCENARIOS,
  STRUCTURE_TEMPLATES,
  GENRES,
  MOODS,
  INSTRUMENTS,
  VOCALS,
  TEXTURES,
  NEGATIVES,
  LANGUAGES,
  ENERGY,
} from './data';

describe('SCENARIOS 完整性檢查', () => {
  for (const [name, sc] of Object.entries(SCENARIOS)) {
    describe(`「${name}」`, () => {
      it('language 有效', () => {
        expect(LANGUAGES, `language=${sc.language}`).toHaveProperty(sc.language);
      });
      it('genre 有效', () => {
        expect(GENRES, `genre=${sc.genre}`).toHaveProperty(sc.genre);
      });
      it('energy 有效', () => {
        expect(ENERGY, `energy=${sc.energy}`).toHaveProperty(sc.energy);
      });
      it('moods 全部有效', () => {
        for (const m of sc.moods) {
          expect(MOODS, `mood=${m}`).toHaveProperty(m);
        }
      });
      it('instruments 全部有效', () => {
        for (const i of sc.instruments) {
          expect(INSTRUMENTS, `instrument=${i}`).toHaveProperty(i);
        }
      });
      it('vocals 全部有效', () => {
        for (const v of sc.vocals) {
          expect(VOCALS, `vocal=${v}`).toHaveProperty(v);
        }
      });
      it('textures 全部有效', () => {
        for (const t of sc.textures) {
          expect(TEXTURES, `texture=${t}`).toHaveProperty(t);
        }
      });
      it('negatives 全部有效', () => {
        for (const n of sc.negatives) {
          expect(NEGATIVES, `negative=${n}`).toHaveProperty(n);
        }
      });
      it('structure 有效', () => {
        expect(STRUCTURE_TEMPLATES, `structure=${sc.structure}`).toHaveProperty(sc.structure);
      });
    });
  }

  it('情境數量符合預期（>= 20）', () => {
    expect(Object.keys(SCENARIOS).length).toBeGreaterThanOrEqual(20);
  });
});
