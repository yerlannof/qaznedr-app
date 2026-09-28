const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const base =
  'file://' + path.resolve(__dirname, '../../review/site-preview.html');
const codes = ['DEMO-A01', 'DEMO-B02', 'DEMO-C03'];
const expected = {
  en: ['Gold', 'Copper', 'Lead–zinc'],
  ru: ['Золото', 'Медь', 'Свинец–цинк'],
  zh: ['黄金', '铜', '铅锌'],
};
const result = [];
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });
  for (const lang of ['en', 'ru', 'zh'])
    for (let i = 0; i < 3; i++) {
      const page = await browser.newPage({
        viewport: { width: 375, height: 812 },
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(
        base + '?screen=teaser&lang=' + lang + '&theme=light&code=' + codes[i]
      );
      const data = await page.evaluate(() => ({
        heading: document.querySelector('h1')?.textContent,
        metal: document.querySelector('.spec b')?.textContent,
        status: document.querySelector('.page-intro h1')?.textContent,
        overflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      }));
      const correct =
        data.heading.includes(expected[lang][i]) &&
        data.metal.includes(expected[lang][i]) &&
        data.heading.includes(
          i === 2
            ? { en: 'Unavailable', ru: 'Недоступен', zh: '暂不可用' }[lang]
            : i === 1
              ? { en: 'In discussion', ru: 'В переговорах', zh: '洽谈中' }[lang]
              : {
                  en: 'Availability pending verification',
                  ru: 'Доступность требует проверки',
                  zh: '可申请状态待核实',
                }[lang]
        );
      const alternatives =
        i === 2
          ? (await page
              .locator('a')
              .filter({
                hasText: {
                  en: 'Other prospects',
                  ru: 'Другие участки',
                  zh: '查看其他项目',
                }[lang],
              })
              .count()) > 0
          : true;
      await page.screenshot({
        path: path.join(
          __dirname,
          'verified-teaser-' + lang + '-' + codes[i] + '.png'
        ),
        fullPage: true,
      });
      await page.locator('.float-contact').click();
      const contact =
        page.url().includes('code=' + codes[i]) &&
        (await page
          .locator('textarea')
          .inputValue()
          .then((x) => x === codes[i]));
      result.push({
        lang,
        code: codes[i],
        correct,
        alternatives,
        contact,
        overflow: data.overflow,
        errors,
      });
      await page.close();
    }
  for (const lang of ['en', 'ru', 'zh']) {
    const page = await browser.newPage({
      viewport: { width: 375, height: 812 },
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base + '?screen=article&lang=' + lang + '&theme=light');
    const x = await page.evaluate(() => ({
      head: document.querySelector('.article-body h2:nth-of-type(4)')
        ?.textContent,
      rows: document.querySelectorAll('.article-body tbody tr').length,
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      text: document.querySelector('.article-body').textContent,
    }));
    await page.screenshot({
      path: path.join(__dirname, 'verified-article-' + lang + '.png'),
      fullPage: true,
    });
    result.push({
      lang,
      screen: 'article',
      rows: x.rows,
      overflow: x.overflow,
      noEquivalenceTable:
        x.rows === 4 && !x.text.includes('To be confirmedTo be confirmed'),
      errors,
    });
    await page.close();
  }
  const bad = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await bad.goto(base + '?screen=teaser&lang=en&code=%3Cscript%3E');
  result.push({
    screen: 'unknown-code',
    safe:
      (await bad
        .locator('h1')
        .textContent()
        .then((x) => x.includes('not found'))) &&
      !(await bad
        .locator('body')
        .textContent()
        .then((x) => x.includes('<script>'))),
  });
  await bad.close();
  fs.writeFileSync(
    path.join(__dirname, 'qa-affected.json'),
    JSON.stringify(result, null, 2)
  );
  console.log(
    JSON.stringify(
      {
        checks: result.length,
        failures: result.filter(
          (x) =>
            x.correct === false ||
            x.alternatives === false ||
            x.contact === false ||
            x.overflow ||
            x.errors?.length ||
            x.noEquivalenceTable === false ||
            x.safe === false
        ),
      },
      null,
      2
    )
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
