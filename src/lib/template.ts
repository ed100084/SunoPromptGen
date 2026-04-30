import { IMAGE_BANK } from '../data';
import type { Section } from '../types';

export interface TemplateOptions {
  moods: string[];
  keywords: string;
  theme: string;
}

export function generateTemplateLyrics(sections: Section[], opts: TemplateOptions): { sections: Section[]; filled: number } {
  const moodKey = opts.moods[0] || '希望';
  const bank = IMAGE_BANK[moodKey] || IMAGE_BANK['希望'];
  const kwList = opts.keywords.split(/[,，、]/).map((k) => k.trim()).filter(Boolean);
  const pool = [...kwList, ...bank];
  const theme = opts.theme.trim() || '心之所向';

  const pick = (n = 1): string[] => {
    const out: string[] = [];
    const used = new Set<string>();
    let tries = 0;
    while (out.length < n && tries < n * 10) {
      const w = pool[Math.floor(Math.random() * pool.length)];
      if (!used.has(w)) {
        used.add(w);
        out.push(w);
      }
      tries++;
    }
    while (out.length < n) {
      out.push(pool[Math.floor(Math.random() * pool.length)] || '光');
    }
    return out;
  };

  let filled = 0;
  const next = sections.map((s) => {
    const tag = (s.tag || '').toLowerCase();
    if (
      tag.includes('intro') ||
      tag.includes('outro') ||
      tag.includes('solo') ||
      /\b[ab]\s*section\b/.test(tag)
    ) {
      return { ...s, lyrics: '' };
    }
    if (tag.includes('pre')) {
      const [w1, w2] = pick(2);
      filled++;
      return { ...s, lyrics: `當${w1}點亮整個${w2}\n我聽見心跳的方向` };
    }
    if (tag.includes('bridge')) {
      const [w1, w2, w3] = pick(3);
      filled++;
      return {
        ...s,
        lyrics: `如果${w1}終究會${w2}\n至少還有${w3}陪我走\n這一刻的擁有\n就是答案`,
      };
    }
    if (tag.includes('chorus') || tag.includes('drop')) {
      const [w1, w2] = pick(2);
      filled++;
      return {
        ...s,
        lyrics: `${theme} ${theme}\n是${w1}最美的${w2}\n讓我記住這一刻\n讓${theme}永遠停留`,
      };
    }
    const [w1, w2, w3, w4] = pick(4);
    filled++;
    return {
      ...s,
      lyrics: `${w1}飄散在${w2}的午後\n我看見${w3}在${w4}閃爍\n走過${w2}的時候想起你\n風裡有${w1}的味道`,
    };
  });

  return { sections: next, filled };
}
