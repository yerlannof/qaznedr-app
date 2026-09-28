const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const pageUrl = 'file://' + path.join(root, 'review/site-preview.html');
const screens = [
  'home',
  'portfolio',
  'teaser',
  'services',
  'about',
  'contact',
  'insights',
  'article',
  'metal',
];
const runs = [];
for (const screen of screens)
  for (const theme of ['light', 'dark'])
    for (const width of [375, 1440])
      runs.push({ screen, theme, width, lang: 'en' });
for (const screen of ['home', 'portfolio', 'teaser', 'contact'])
  for (const theme of ['light', 'dark'])
    runs.push({ screen, theme, width: 375, lang: 'zh' });
for (const screen of ['services', 'about', 'insights', 'article', 'metal'])
  for (const theme of ['light', 'dark'])
    runs.push({ screen, theme, width: 375, lang: 'zh' });
for (const width of [375, 1440])
  runs.push({ screen: 'home', theme: 'light', width, lang: 'ru' });
for (const screen of screens)
  runs.push({ screen, theme: 'light', width: 768, lang: 'en' });
const errors = [];
const results = [];
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  for (const r of runs) {
    const page = await context.newPage();
    await page.setViewportSize({ width: r.width, height: 900 });
    const pageErrors = [];
    const externalRequests = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('requestfailed', (req) =>
      pageErrors.push('request ' + req.url() + ' ' + req.failure().errorText)
    );
    page.on('request', (req) => {
      if (!req.url().startsWith('file:')) externalRequests.push(req.url());
    });
    const url =
      pageUrl + '?screen=' + r.screen + '&lang=' + r.lang + '&theme=' + r.theme;
    await page.goto(url, { waitUntil: 'load' });
    await page.locator('main').waitFor();
    const metrics = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      images: [...document.images]
        .filter((i) => !i.complete || i.naturalWidth === 0)
        .map((i) => i.src),
      title: document.querySelector('h1')?.textContent,
    }));
    const name = [r.screen, r.lang, r.theme, r.width].join('-') + '.png';
    await page.screenshot({ path: path.join(__dirname, name), fullPage: true });
    if (r.screen === 'home' && r.width === 375)
      await page.screenshot({
        path: path.join(
          __dirname,
          ['thumb', r.lang, r.theme].join('-') + '.png'
        ),
        fullPage: false,
      });
    const outcome = {
      ...r,
      file: name,
      overflow: metrics.scroll > metrics.client,
      images: metrics.images,
      pageErrors,
      externalRequests,
      title: metrics.title,
    };
    results.push(outcome);
    if (
      outcome.overflow ||
      outcome.images.length ||
      outcome.pageErrors.length ||
      outcome.externalRequests.length
    )
      errors.push(outcome);
    await page.close();
  }
  fs.writeFileSync(
    path.join(__dirname, 'qa.json'),
    JSON.stringify({ runs: results.length, errors, results }, null, 2)
  );
  console.log(
    JSON.stringify({ runs: results.length, errors: errors.length }, null, 2)
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
