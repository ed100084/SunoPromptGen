import { Section as SectionBlock } from './Section';
import { getActiveVersion } from '../lib/sunoVersions';

interface Props {
  stylePrompt: string;
  lyricsPrompt: string;
  fullPrompt: string;
  styleLen: number;
  tagCount: number;
  copied: Record<string, boolean>;
  onCopy: (text: string, key: string) => void;
}

/**
 * 右欄輸出區：Style / Lyrics / Full Prompt + 心法提示。
 * 字數/tag 上限與心法提示由 active Suno 版本提供。
 */
export function OutputPanel({
  stylePrompt,
  lyricsPrompt,
  fullPrompt,
  styleLen,
  tagCount,
  copied,
  onCopy,
}: Props) {
  const ver = getActiveVersion();
  const { maxStyleLength, recommendedTagRange, tagWarnThreshold } = ver.constraints;
  const [tagMin, tagMax] = recommendedTagRange;

  return (
    <div className="lg:sticky lg:top-4">
      <SectionBlock
        title="📤 Style Prompt"
        hint={`複製到 Suno 的 Style 欄位｜${ver.label} 上限約 ${maxStyleLength} 字元`}
      >
        <textarea
          value={stylePrompt}
          readOnly
          rows={7}
          className="w-full p-3 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm"
        />
        <div className="flex flex-wrap justify-between items-center mt-2 gap-2 text-xs">
          <div className="space-x-2">
            <span
              className={
                styleLen > maxStyleLength
                  ? 'text-rose-600 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }
            >
              {styleLen} 字元 {styleLen > maxStyleLength && `(超過 ${maxStyleLength})`}
            </span>
            <span
              className={
                tagCount > tagWarnThreshold ? 'text-amber-600' : 'text-slate-500 dark:text-slate-400'
              }
            >
              · {tagCount} tags{' '}
              {tagCount > tagWarnThreshold && `(建議 ${tagMin}-${tagMax})`}
            </span>
          </div>
          <button
            onClick={() => onCopy(stylePrompt, 'style')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${
              copied.style ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {copied.style ? '✓ 已複製' : '複製 Style'}
          </button>
        </div>
      </SectionBlock>

      <SectionBlock title="📝 Lyrics" hint="複製到 Suno 的 Lyrics 欄位">
        <textarea
          value={lyricsPrompt}
          readOnly
          rows={14}
          className="w-full p-3 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm whitespace-pre-wrap"
        />
        <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">{lyricsPrompt.length} 字元</span>
          <button
            onClick={() => onCopy(lyricsPrompt, 'lyrics')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${
              copied.lyrics ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {copied.lyrics ? '✓ 已複製' : '複製 Lyrics'}
          </button>
        </div>
      </SectionBlock>

      <SectionBlock title="📦 完整 Prompt">
        <textarea
          value={fullPrompt}
          readOnly
          rows={8}
          className="w-full p-3 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={() => onCopy(fullPrompt, 'full')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${
              copied.full ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-800'
            }`}
          >
            {copied.full ? '✓ 已複製' : '複製完整版'}
          </button>
        </div>
      </SectionBlock>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
        <div className="font-semibold mb-2">💡 {ver.label} Prompt 心法</div>
        <ul className="list-disc list-inside space-y-1">
          {ver.promptTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
