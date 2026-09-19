import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('./'); });

test('follows reference to Suno output flow', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Suno 音樂生成流程' })).toBeVisible();
  await page.getByPlaceholder(/樂團／音樂人/).fill('參考樂團的漸進編曲');
  await page.getByPlaceholder(/人聲/).fill('溫暖而有爆發力的女聲');
  await page.getByRole('button', { name: /轉成可調風格/ }).click();
  await expect.poll(() => page.locator('textarea').evaluateAll((items) => items.some((item) => (item as HTMLTextAreaElement).value.includes('參考樂團')))).toBe(true);
  await expect(page.getByText('Final Chorus').first()).toBeVisible();
});

test('builds lyrics handoff prompt and reviews pasted lyrics', async ({ page }) => {
  await page.getByPlaceholder('歌名').fill('雨停以前');
  await page.getByPlaceholder(/歌詞主題/).fill('在城市雨夜告別');
  await page.getByRole('button', { name: '複製填詞 Prompt' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: '生成完整歌詞並回填' })).toBeVisible();
  await page.getByRole('button', { name: '↗ 使用其它 AI' }).click();
  await expect(page.getByRole('button', { name: '📋 從剪貼簿匯入並檢查' })).toBeVisible();
  await page.getByPlaceholder(/把其他 AI/).fill('[Verse 1]\n走過雨夜\n\n[Chorus]\n記住我 記住我 再一次記住我');
  await expect(page.getByText(/待確認/)).toBeVisible();
  await expect(page.getByText('缺少 [Bridge]。')).toBeVisible();
});

test('shows final Suno style custom lyrics and settings', async ({ page }) => {
  await expect(page.getByRole('button', { name: '複製 Style' })).toBeVisible();
  await expect(page.getByRole('button', { name: '複製 Custom Lyrics' })).toBeVisible();
  await expect(page.getByText('Custom 設定')).toBeVisible();
  await expect(page.getByText(/"mode": "Custom"/)).toBeVisible();
});
