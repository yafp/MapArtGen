const { expect } = require('@playwright/test');

async function openApp(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error));
  await page.goto('/MapArtGen.html');
  await page.waitForFunction(() => document.querySelector('#map canvas'));
  await page.selectOption('#exportDpi', '150');
  expect(errors).toEqual([]);
}

async function exportPoster(page) {
  const downloadPromise = page.waitForEvent('download');
  await page.click('#exportBtn');
  const download = await downloadPromise;
  await expect(page.locator('#statusMessage')).toHaveText('Poster exported.');
  return download;
}

module.exports = { openApp, exportPoster };
