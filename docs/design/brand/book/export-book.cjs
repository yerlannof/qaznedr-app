const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('requestfailed', (r) => errors.push(r.url()));
  await p.goto('file://' + path.join(__dirname, 'brand-book.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.emulateMedia({ media: 'print' });
  const sheets = await p.locator('.sheet').evaluateAll((els) =>
    els.map((e, i) => {
      const box = e.getBoundingClientRect(),
        footer = e.querySelector('footer').getBoundingClientRect();
      const content = [...e.children].filter((c) => c.tagName !== 'FOOTER');
      const lowest = Math.max(
        ...content.map((c) => c.getBoundingClientRect().bottom)
      );
      return {
        page: i + 1,
        height: box.height,
        contentBottom: lowest - box.top,
        footerTop: footer.top - box.top,
        overlap: lowest > footer.top - 8,
      };
    })
  );
  const badImages = await p.evaluate(() =>
    [...document.images]
      .filter((i) => !i.complete || !i.naturalWidth)
      .map((i) => i.src)
  );
  await p.pdf({
    path: path.join(__dirname, 'qaznedr-brand-book-v1.pdf'),
    printBackground: true,
    preferCSSPageSize: true,
  });
  await p.emulateMedia({ media: 'screen' });
  for (const i of [0, 2, 4, 5, 7, 10]) {
    if ((await p.locator('.sheet').count()) > i)
      await p
        .locator('.sheet')
        .nth(i)
        .screenshot({
          path: path.join(__dirname, `page-${i + 1}-browser.png`),
        });
  }
  await p.setViewportSize({ width: 375, height: 850 });
  const mobile = await p.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  const result = { pages: sheets.length, sheets, badImages, errors, mobile };
  fs.writeFileSync(
    path.join(__dirname, 'qa.json'),
    JSON.stringify(result, null, 2)
  );
  console.log(JSON.stringify(result));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
