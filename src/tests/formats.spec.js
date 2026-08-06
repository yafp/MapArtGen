const { test, expect } = require('@playwright/test');
const { openApp, exportPoster } = require('./helpers');

const formats = [
  'a2-portrait', 'a2-landscape', 'a3-portrait', 'a3-landscape',
  'a4-portrait', 'a4-landscape', 'a5-portrait', 'a5-landscape',
  'square-large', 'square-medium', 'square-small'
];

for (const format of formats) {
  test(`format ${format}`, async ({ page }) => {
    await openApp(page);
    await page.selectOption('#formatSelect', format);
    expect((await exportPoster(page)).suggestedFilename()).toContain('.png');
  });
}

for (const dpi of ['150', '300', '600']) {
  test(`DPI ${dpi}`, async ({ page }) => {
    await openApp(page);
    await page.selectOption('#exportDpi', dpi);
    expect((await exportPoster(page)).suggestedFilename()).toContain(`_${dpi}dpi_`);
  });
}
