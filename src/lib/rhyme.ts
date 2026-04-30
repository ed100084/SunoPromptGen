import { pinyin } from 'pinyin-pro';

/**
 * 中華新韻 14 韻轍簡化對應
 * 將拼音韻母（final）映射到 14 個常用韻轍
 * 參考：https://baike.baidu.com/item/中华新韵
 */
const FINAL_TO_RHYME: Record<string, string> = {
  // 一麻：a, ia, ua
  a: '一麻',
  ia: '一麻',
  ua: '一麻',
  // 二波：o, e, uo
  o: '二波',
  e: '二波',
  uo: '二波',
  // 三皆：ie, üe, ue
  ie: '三皆',
  üe: '三皆',
  ue: '三皆',
  // 四開：ai, uai
  ai: '四開',
  uai: '四開',
  // 五微：ei, ui, uei
  ei: '五微',
  ui: '五微',
  uei: '五微',
  // 六豪：ao, iao
  ao: '六豪',
  iao: '六豪',
  // 七尤：ou, iu, iou
  ou: '七尤',
  iu: '七尤',
  iou: '七尤',
  // 八寒：an, ian, uan, üan
  an: '八寒',
  ian: '八寒',
  uan: '八寒',
  üan: '八寒',
  // 九文：en, in, un, ün, uen
  en: '九文',
  in: '九文',
  un: '九文',
  ün: '九文',
  uen: '九文',
  // 十唐：ang, iang, uang
  ang: '十唐',
  iang: '十唐',
  uang: '十唐',
  // 十一庚：eng, ing, ueng
  eng: '十一庚',
  ing: '十一庚',
  ueng: '十一庚',
  // 十二東：ong, iong
  ong: '十二東',
  iong: '十二東',
  // 十三支：i (zhi/chi/shi/ri/zi/ci/si 韻母)
  // 十四齊：i (其他)
  // 為簡化，將 i 統一歸到「十三支」
  i: '十三支',
  // 十五魚：ü, u (部分)
  ü: '十五魚',
  u: '十五魚',
  // er
  er: '十六兒',
};

/**
 * 提取拼音的韻母（final）
 */
function extractFinal(py: string): string {
  // pinyin-pro 已給出乾淨拼音，去聲調
  const clean = py.replace(/[1-5·]/g, '').toLowerCase().trim();
  if (!clean) return '';

  // 去掉聲母（initial）
  // 雙字母聲母優先
  const doubleInitials = ['zh', 'ch', 'sh'];
  for (const di of doubleInitials) {
    if (clean.startsWith(di)) return clean.slice(di.length);
  }
  // 單字母聲母
  const singleInitials = 'bpmfdtnlgkhjqxrzcsy w'.split(' ').join('').split('');
  if (singleInitials.includes(clean[0])) return clean.slice(1);

  return clean;
}

/**
 * 取一個漢字的韻轍
 */
export function getRhymeGroup(char: string): string | null {
  if (!char || !/[一-鿿]/.test(char)) return null;
  try {
    const py = pinyin(char, { toneType: 'none', type: 'string' }) as string;
    if (!py) return null;
    const final = extractFinal(py);
    return FINAL_TO_RHYME[final] || null;
  } catch {
    return null;
  }
}

/**
 * 分析多行歌詞的押韻 pattern
 * 例如 ["床前明月光", "疑是地上霜", "舉頭望明月", "低頭思故鄉"]
 * → ["十唐", "十唐", "二波", "十唐"]
 * → pattern: AABA
 */
export interface RhymeAnalysis {
  lines: string[];
  endChars: string[];
  rhymeGroups: (string | null)[];
  pattern: string;     // 例如 "AABA"
  rhymeMap: Record<string, string>; // group → letter
}

export function analyzeRhyme(lyrics: string): RhymeAnalysis {
  const lines = lyrics.split('\n').map((l) => l.trim()).filter(Boolean);
  const endChars: string[] = [];
  const rhymeGroups: (string | null)[] = [];

  for (const line of lines) {
    // 取最後一個漢字
    const chineseMatch = line.match(/[一-鿿]/g);
    const last = chineseMatch ? chineseMatch[chineseMatch.length - 1] : '';
    endChars.push(last);
    rhymeGroups.push(last ? getRhymeGroup(last) : null);
  }

  // 建立 group → letter（A, B, C...）
  const rhymeMap: Record<string, string> = {};
  let nextLetter = 'A';
  const pattern = rhymeGroups
    .map((g) => {
      if (!g) return '-';
      if (!rhymeMap[g]) {
        rhymeMap[g] = nextLetter;
        nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
      }
      return rhymeMap[g];
    })
    .join('');

  return { lines, endChars, rhymeGroups, pattern, rhymeMap };
}
