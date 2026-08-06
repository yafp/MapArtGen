const { test, expect } = require('@playwright/test');
const { openApp, exportPoster } = require('./helpers');

const layouts = [
  'none', 'style-box', 'style-bottom-right', 'style-bottom-right-absolute',
  'style-top', 'style-top-right', 'style-top-right-absolute',
  'style-fullwidth-left', 'style-fullwidth', 'style-fullwidth-right',
  'style-fullwidth-top-left', 'style-fullwidth-top', 'style-fullwidth-top-right',
  'style-minimal', 'style-deck', 'style-toptag', 'style-badge'
];

for (const layout of layouts) {
  test(`layout ${layout}`, async ({ page }) => {
    await openApp(page);
    await page.selectOption('#labelStyle', layout);
    const preview = await page.locator('#mapFrame').screenshot();
    expect(preview).toMatchSnapshot(`layout-${layout}.png`, { maxDiffPixelRatio: 0.02 });
    expect((await exportPoster(page)).suggestedFilename()).toMatch(/\.png$/);
  });
}
