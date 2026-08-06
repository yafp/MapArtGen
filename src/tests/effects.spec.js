const { test, expect } = require('@playwright/test');
const { openApp, exportPoster } = require('./helpers');

for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
  test(`output ${type}`, async ({ page }) => {
    await openApp(page);
    await page.selectOption('#exportType', type);
    const extension = type === 'image/jpeg' ? '.jpg' : `.${type.split('/')[1]}`;
    expect((await exportPoster(page)).suggestedFilename().endsWith(extension)).toBeTruthy();
  });
}

for (const mode of ['all', 'cities_only', 'streets_only', 'water_only', 'none']) {
  test(`names ${mode}`, async ({ page }) => {
    await openApp(page);
    await page.selectOption('#textFilter', mode);
    expect((await exportPoster(page)).suggestedFilename()).toMatch(/\.(png)$/);
  });
}
