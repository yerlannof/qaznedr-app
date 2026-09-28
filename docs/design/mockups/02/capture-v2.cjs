const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'review/02-wireframes-v2.html');
const base = pathToFileURL(file).href;
const screens = [
  'home',
  'portfolio',
  'teaser',
  'contact',
  'services',
  'about',
  'guide',
  'metal',
];
const sizes = {
  mobile: { width: 375, height: 900 },
  desktop: { width: 1440, height: 960 },
};
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const issues = [];
  try {
    for (const screen of screens) {
      for (const language of [
        'ru',
        ...(screens.indexOf(screen) < 4 ? ['en', 'zh'] : []),
      ]) {
        for (const [size, viewport] of Object.entries(sizes)) {
          if (language !== 'ru' && size === 'desktop') continue;
          const page = await browser.newPage({
            viewport,
            deviceScaleFactor: 1,
          });
          page.on('pageerror', (e) =>
            issues.push(`${screen}/${language}/${size}: ${e.message}`)
          );
          await page.goto(
            `${base}?screen=${screen}&lang=${language}&theme=light`,
            { waitUntil: 'load' }
          );
          const width = await page.evaluate(
            () => document.documentElement.scrollWidth
          );
          if (width > viewport.width)
            issues.push(
              `${screen}/${language}/${size}: overflow ${width}>${viewport.width}`
            );
          const stem = `${screen}-${language}-${size}`;
          await page.screenshot({
            path: path.join(__dirname, `${stem}.png`),
            fullPage: true,
          });
          await page.screenshot({
            path: path.join(__dirname, `${stem}-thumb.png`),
            fullPage: false,
          });
          await page.close();
          console.log(stem);
        }
      }
    }
    const home = await browser.newPage({ viewport: sizes.mobile });
    await home.goto(`${base}?screen=home&lang=zh`);
    const headings = await home.locator('main h2').allInnerTexts();
    if (
      headings.indexOf('地质专业能力') < 0 ||
      headings.indexOf('按矿种浏览项目') < 0 ||
      headings.indexOf('地质专业能力') > headings.indexOf('按矿种浏览项目')
    )
      issues.push('home scene order failed');
    await home.close();
    const page = await browser.newPage({ viewport: sizes.mobile });
    await page.goto(`${base}?screen=portfolio&lang=zh`);
    await page.locator('#metalFilter').selectOption('0');
    if ((await page.locator('#projectResults article').count()) !== 1)
      issues.push('portfolio filter failed');
    await page.locator('#projectResults a.btn').click();
    if (
      !page.url().includes('DEMO-A01') ||
      !(await page.locator('h1').innerText()).includes('DEMO-A01')
    )
      issues.push('card to teaser failed');
    if (
      (await page.locator('.bottom-nav').count()) !== 0 ||
      (await page.locator('.contact-float').count()) !== 1
    )
      issues.push('mobile contact navigation failed');
    if (
      !(await page.locator('.contact-float').getAttribute('href')).includes(
        'DEMO-A01'
      )
    )
      issues.push('floating contact lost site code');
    await page.locator('.actions a.btn').first().click();
    if (
      !page.url().includes('DEMO-A01') ||
      !(await page.locator('textarea').inputValue()).includes('DEMO-A01')
    )
      issues.push('teaser to contact failed');
    await page.locator('#contact-name').fill('Demo');
    await page.locator('#contact-reply').fill('test@example.com');
    await page.locator('#contact-message').fill('DEMO-A01');
    await page.locator('.demo-form button[type=submit]').click();
    if (!(await page.locator('.form-status').isVisible()))
      issues.push('form demo status failed');
    await page.close();
    const overview = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    await overview.goto(base, { waitUntil: 'load' });
    await overview.screenshot({
      path: path.join(__dirname, 'review-overview.png'),
      fullPage: true,
    });
    await overview.close();
  } finally {
    await browser.close();
  }
  fs.writeFileSync(
    path.join(__dirname, 'qa-v2.json'),
    JSON.stringify(
      { passed: issues.length === 0, issues, screens: screens.length },
      null,
      2
    )
  );
  if (issues.length) {
    console.error(issues.join('\n'));
    process.exitCode = 1;
  } else console.log('QA PASSED');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
