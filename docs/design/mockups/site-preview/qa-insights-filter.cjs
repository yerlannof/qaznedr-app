const { chromium } = require('../../../../node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const file =
    'file://' + path.resolve(__dirname, '../../review/site-preview.html');
  const report = { cases: [], errors: [] };
  for (const width of [1440, 375])
    for (const uiLang of ['ru', 'en', 'zh'])
      for (const theme of ['light', 'dark']) {
        const page = await browser.newPage({
          viewport: { width, height: width === 375 ? 812 : 900 },
        });
        page.on('pageerror', (error) =>
          report.errors.push(`${width}/${uiLang}/${theme}: ${error.message}`)
        );
        const url = `${file}?screen=insights&lang=${uiLang}&theme=${theme}&code=DEMO-A01&topic=field`;
        await page.goto(url);
        const originalSearch = await page.evaluate(() => location.search);
        assert.equal(await page.locator('#insightResults article').count(), 2);
        assert.equal(await page.locator('body').getAttribute('lang'), uiLang);
        assert.equal(
          await page
            .locator('body')
            .evaluate((el) => el.classList.contains('dark')),
          theme === 'dark'
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth
          ),
          false
        );

        for (const contentLang of ['ru', 'en', 'zh']) {
          await page.locator('#languageFilter').selectOption(contentLang);
          const expected = contentLang === 'zh' ? 1 : 2;
          const cards = page.locator('#insightResults article');
          assert.equal(await cards.count(), expected);
          assert.match(
            await page.locator('#insightCount').textContent(),
            new RegExp(String(expected))
          );
          for (const card of await cards.all()) {
            const available = (await card.getAttribute('data-languages')).split(
              ','
            );
            assert.ok(available.includes(contentLang));
            assert.ok(
              (await card.locator('.kicker').textContent()).endsWith(
                contentLang.toUpperCase()
              )
            );
            const href = await card.locator('a').getAttribute('href');
            assert.ok(
              href.includes(`lang=${uiLang}`) && href.includes(`theme=${theme}`)
            );
          }
          assert.equal(await page.locator('body').getAttribute('lang'), uiLang);
          assert.equal(
            await page.evaluate(() => location.search),
            originalSearch
          );
        }

        await page.locator('#topicFilter').selectOption('geology');
        assert.equal(await page.locator('#insightResults article').count(), 0);
        assert.equal(await page.locator('#insightEmpty').isVisible(), true);
        assert.match(await page.locator('#insightCount').textContent(), /0/);
        if (width === 375 && uiLang === 'zh' && theme === 'dark') {
          await page.screenshot({
            path: path.join(__dirname, 'insights-375-zh-dark-empty.png'),
            fullPage: true,
          });
        }
        await page.locator('#insightEmptyReset').click();
        assert.equal(await page.locator('#topicFilter').inputValue(), 'all');
        assert.equal(await page.locator('#languageFilter').inputValue(), 'all');
        assert.equal(await page.locator('#insightResults article').count(), 2);
        assert.equal(await page.locator('#insightEmpty').isVisible(), false);
        assert.equal(
          await page.evaluate(() => location.search),
          originalSearch
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth
          ),
          false
        );
        const images = await page.locator('img').evaluateAll((items) => ({
          count: items.length,
          broken: items.filter((el) => !el.complete || el.naturalWidth === 0)
            .length,
        }));
        assert.equal(images.broken, 0);
        if (width === 1440 && uiLang === 'en' && theme === 'light') {
          await page.screenshot({
            path: path.join(__dirname, 'insights-1440-en-light.png'),
            fullPage: true,
          });
        }
        report.cases.push({
          width,
          uiLang,
          theme,
          initial: 2,
          filteredRU: 2,
          filteredEN: 2,
          filteredZH: 1,
          emptyReset: true,
          images,
        });
        await page.close();
      }
  const page = await browser.newPage();
  await page.goto(`${file}?screen=insights&lang=en&theme=light`);
  await page.locator('[data-lang="zh"]').first().click();
  assert.equal(await page.locator('body').getAttribute('lang'), 'zh');
  assert.match(page.url(), /lang=zh/);
  report.headerLocaleSwitch = 'passed';
  assert.deepEqual(report.errors, []);
  fs.writeFileSync(
    path.join(__dirname, 'qa-insights-filter.json'),
    JSON.stringify(report, null, 2) + '\n'
  );
  console.log(
    `Passed ${report.cases.length} viewport/locale/theme cases; independent language filtering, empty/reset, routing, overflow, and header switch.`
  );
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
