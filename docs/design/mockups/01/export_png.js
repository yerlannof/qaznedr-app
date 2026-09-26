const path = require('path');
const { chromium } = require('playwright');

const dir = __dirname;
const review = path.resolve(dir, '../../review/01-identity.html');

(async () => {
  const browser = await chromium.launch({
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto('file://' + review);
  await page.locator('.overview-card').first().waitFor();
  for (const key of ['a', 'b', 'c']) {
    await page
      .locator('.overview-card.' + key)
      .screenshot({ path: path.join(dir, `${key}-overview.png`) });
    await page
      .locator('#' + key + ' .specimen')
      .first()
      .screenshot({ path: path.join(dir, `${key}-horizontal-preview.png`) });
    for (const size of [16, 32]) {
      const svg = path.join(dir, `${key}-favicon-${size}.svg`);
      await page.setContent(
        `<html><body style="margin:0"><img src="file://${svg}" width="${size}" height="${size}"></body></html>`
      );
      await page
        .locator('img')
        .screenshot({ path: path.join(dir, `${key}-favicon-${size}.png`) });
    }
    await page.goto('file://' + review);
    await page.locator('.overview-card').first().waitFor();
  }
  await page.screenshot({
    path: path.join(dir, 'review-1440.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({
    path: path.join(dir, 'review-375.png'),
    fullPage: true,
  });
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
