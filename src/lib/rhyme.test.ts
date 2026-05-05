import { describe, it, expect } from 'vitest';
import { getRhymeGroup, analyzeRhyme } from './rhyme';

describe('getRhymeGroup', () => {
  it('回傳 null 當輸入非中文', () => {
    expect(getRhymeGroup('a')).toBeNull();
    expect(getRhymeGroup('1')).toBeNull();
    expect(getRhymeGroup('')).toBeNull();
  });

  it('「光」屬於十唐韻（ang）', () => {
    expect(getRhymeGroup('光')).toBe('十唐');
  });

  it('「霜」屬於十唐韻', () => {
    expect(getRhymeGroup('霜')).toBe('十唐');
  });

  it('「鄉」屬於十唐韻', () => {
    expect(getRhymeGroup('鄉')).toBe('十唐');
  });

  it('「家」屬於一麻韻（a/ia/ua）', () => {
    expect(getRhymeGroup('家')).toBe('一麻');
  });

  it('「來」屬於四開韻（ai）', () => {
    expect(getRhymeGroup('來')).toBe('四開');
  });

  it('「飛」屬於五微韻（ei）', () => {
    expect(getRhymeGroup('飛')).toBe('五微');
  });

  it('「好」屬於六豪韻（ao）', () => {
    expect(getRhymeGroup('好')).toBe('六豪');
  });

  it('「眼」屬於八寒韻（ian）', () => {
    expect(getRhymeGroup('眼')).toBe('八寒');
  });

  it('「人」屬於九文韻（en/in/un）', () => {
    expect(getRhymeGroup('人')).toBe('九文');
  });

  it('「風」屬於十一庚韻（eng/ing）', () => {
    expect(getRhymeGroup('風')).toBe('十一庚');
  });

  it('「中」屬於十二東韻（ong）', () => {
    expect(getRhymeGroup('中')).toBe('十二東');
  });
});

describe('analyzeRhyme', () => {
  it('靜夜思 4 行 — AABA 經典 pattern', () => {
    const r = analyzeRhyme('床前明月光\n疑是地上霜\n舉頭望明月\n低頭思故鄉');
    // 光、霜、鄉 都屬十唐；月屬三皆
    expect(r.endChars).toEqual(['光', '霜', '月', '鄉']);
    expect(r.rhymeGroups).toEqual(['十唐', '十唐', '三皆', '十唐']);
    expect(r.pattern).toBe('AABA');
  });

  it('AABB pattern', () => {
    const r = analyzeRhyme('我的家\n在山下\n月光美\n星閃飛');
    // 家(一麻), 下(一麻) → AA；美(五微), 飛(五微) → BB
    expect(r.pattern).toBe('AABB');
  });

  it('全部同韻 → AAAA', () => {
    const r = analyzeRhyme('長江東\n海風中\n夢已空\n念無窮');
    // 東、中、空、窮 都屬十二東
    expect(r.pattern).toBe('AAAA');
  });

  it('忽略空白行', () => {
    const r = analyzeRhyme('光\n\n霜');
    expect(r.lines).toHaveLength(2);
    expect(r.pattern).toBe('AA');
  });

  it('rhymeMap 正確映射 group 到字母', () => {
    const r = analyzeRhyme('光\n霜\n月');
    expect(r.rhymeMap['十唐']).toBe('A');
    expect(r.rhymeMap['三皆']).toBe('B');
  });

  it('空輸入回傳空結果', () => {
    const r = analyzeRhyme('');
    expect(r.lines).toHaveLength(0);
    expect(r.pattern).toBe('');
  });

  it('行尾無中文時 pattern 用 - 表示', () => {
    const r = analyzeRhyme('hello world\n你好');
    // 第一行末沒有中文 → null → '-'
    expect(r.pattern[0]).toBe('-');
  });

  it('混合中英取最後一個漢字', () => {
    const r = analyzeRhyme('我的 dream 是飛翔');
    expect(r.endChars[0]).toBe('翔');
    expect(r.rhymeGroups[0]).toBe('十唐');
  });
});
