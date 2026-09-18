export type LyricsAiTask = 'generate' | 'edit-lyrics';

export interface LyricsAiContext {
  title?: string;
  concept?: string;
  language?: string;
  genres?: string;
  moods?: string;
  vocals?: string;
  structure?: string;
  additionalDirection?: string;
  editScope?: string;
  preserve?: string;
}

export interface BuildLyricsAiPromptOptions {
  task: LyricsAiTask;
  lyrics: string;
  instruction: string;
  context?: LyricsAiContext;
}

const CONTEXT_LABELS: Array<[keyof LyricsAiContext, string]> = [
  ['title', '歌名'],
  ['concept', '主題／故事'],
  ['language', '語言'],
  ['genres', '曲風'],
  ['moods', '情緒'],
  ['vocals', '演唱設定'],
  ['structure', '歌曲結構'],
  ['additionalDirection', '其他方向'],
];

function contextLines(context: LyricsAiContext): string[] {
  return CONTEXT_LABELS.flatMap(([key, label]) => {
    const value = context[key]?.trim();
    return value ? [`- ${label}：${value}`] : [];
  });
}

/** 建立要求 LLM 只回傳可直接貼入歌詞欄位之純文字的 prompt。 */
export function buildLyricsAiPrompt(options: BuildLyricsAiPromptOptions): string {
  const { task, lyrics, instruction, context = {} } = options;
  const sharedRules = [
    '你是專業流行歌曲作詞人。',
    '只輸出最終歌詞純文字，不要解釋、前言、Markdown code fence 或 JSON。',
    '保留 [Verse]、[Chorus]、[Bridge] 等必要段落標籤；不要輸出編曲分析。',
  ];
  const brief = contextLines(context);

  if (task === 'edit-lyrics') {
    const scope = context.editScope?.trim() || '依修改指令判斷必要範圍';
    const preserve = context.preserve?.trim() || '未被指示修改的文字、段落結構與敘事視角';
    return [
      ...sharedRules,
      '任務：局部修改既有歌詞。必須輸出修改後的完整歌詞，不能只輸出差異片段。',
      `修改範圍：${scope}`,
      `必須保留：${preserve}`,
      `修改指令：${instruction.trim() || '改善指定範圍的文字，但維持原意與可唱性。'}`,
      ...(brief.length ? ['', '歌曲背景：', ...brief] : []),
      '',
      '既有歌詞：',
      lyrics.trim(),
    ].join('\n');
  }

  return [
    ...sharedRules,
    '任務：根據歌曲背景創作一首完整、可演唱的歌詞。',
    `創作指令：${instruction.trim() || '建立清楚的敘事弧線與有記憶點的副歌。'}`,
    ...(brief.length ? ['', '歌曲背景：', ...brief] : []),
    ...(lyrics.trim() ? ['', '可參考或重寫的草稿：', lyrics.trim()] : []),
  ].join('\n');
}

/** 移除常見包裝，得到可直接回填 workspace 的純文字歌詞。 */
export function normalizeLyricsAiOutput(value: string): string {
  let result = value.trim();
  const fenced = result.match(/^```(?:text|markdown|md)?\s*\n?([\s\S]*?)\n?```$/i);
  if (fenced) result = fenced[1].trim();
  result = result.replace(/^(?:最終歌詞|歌詞|lyrics)\s*[：:]\s*\n?/i, '').trim();
  return result;
}

export function canRunLyricsAiTask(task: LyricsAiTask, lyrics: string): boolean {
  return task !== 'edit-lyrics' || lyrics.trim().length > 0;
}
