const { test, expect } = require('@playwright/test');
const { openApp, exportPoster } = require('./helpers');

test('accordion navigation remains interactive', async ({ page }) => {
  await openApp(page);
  const colors = page.locator('.section-block', { hasText: '5. Colors' });
  await colors.locator('.section-header').click();
  await expect(colors).not.toHaveClass(/collapsed/);
});

test('palette catalog is complete and Alpine is selected', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#colorPresetSelect option')).toHaveCount(212);
  await expect(page.locator('#colorPresetSelect')).toHaveValue('alpine');
});

for (const border of [true, false]) {
  test(`border ${border ? 'on' : 'off'}`, async ({ page }) => {
    await openApp(page);
    await page.locator('#borderCheckbox').setChecked(border);
    expect((await exportPoster(page)).suggestedFilename()).toMatch(/\.png$/);
  });
}
