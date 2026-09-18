import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('loads v6 workspace and applies a preset', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Suno v6 Creative Workspace' })).toBeVisible();
  await page.getByRole('button', { name: /華語電影感抒情/ }).click();
  await expect(page.getByText(/已套用「華語電影感抒情」/)).toBeVisible();
  await expect.poll(() => page.locator('input, textarea').evaluateAll((elements) =>
    elements.some((element) => /cinematic/i.test((element as HTMLInputElement).value)))).toBe(true);
});

test('edits structured sections and saves a project', async ({ page }) => {
  await page.getByRole('button', { name: '新增段落' }).click();
  await expect.poll(() => page.getByRole('textbox').evaluateAll((elements) =>
    elements.filter((element) => (element as HTMLInputElement).value === 'Verse').length)).toBeGreaterThan(0);
  await page.getByRole('button', { name: '儲存版本' }).click();
  await expect(page.getByText(/已建立新 Project|已建立新 Revision/)).toBeVisible();
  await expect(page.getByText(/1 revisions/)).toBeVisible();
});

test('persists project across reload', async ({ page }) => {
  await page.getByRole('button', { name: '儲存版本' }).click();
  await page.reload();
  await expect(page.getByText(/1 revisions/)).toBeVisible();
});
