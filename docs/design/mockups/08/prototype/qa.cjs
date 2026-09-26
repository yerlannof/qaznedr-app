const { chromium } = require('../../../../../node_modules/playwright');
const sharp = require('../../../../../node_modules/sharp');
const fs = require('fs');
const path = require('path');

const here = __dirname;
const url = 'file://' + path.resolve(here, '../../../review/08-geology-layers.html');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const failures = [];
const checks = [];
const errors = [];

function check(name, pass, detail) {
  checks.push({ name, pass: !!pass, detail });
  if (!pass) failures.push(name);
}

async function pageAt(browser, width, height, opts = {}) {
  const page = await browser.newPage({ viewport: { width, height }, ...opts });
  page.on('pageerror', e => errors.push(`${width}px: ${e.message}`));
  await page.goto(url);
  return page;
}

async function imageReady(page) {
  return page.locator('.artboard .layer.top').evaluate(async el => {
    const css = getComputedStyle(el).backgroundImage;
    const match = css.match(/url\("?(.*?)"?\)/);
    if (!match) return false;
    const src = match[1].replace(/"$/, '');
    const image = new Image();
    image.src = src;
    try { await image.decode(); } catch { return false; }
    return image.naturalWidth > 0 && image.naturalHeight > 0;
  });
}

async function basics(page, tag) {
  check(`${tag}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), await page.evaluate(() => `${document.documentElement.scrollWidth}/${innerWidth}`));
  check(`${tag}: sprite loads`, await imageReady(page));
  check(`${tag}: logo loads`, await page.locator('.logo-light').evaluate(el => el.complete && el.naturalWidth > 0));
  check(`${tag}: three independent scene planes`, await page.locator('.artboard .layer').count() === 3);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chrome });
  const desktop = await pageAt(browser, 1440, 900);
  await basics(desktop, '1440');
  for (let stage = 0; stage < 3; stage++) {
    if (stage) {
      await desktop.locator(`.scene-copy .stage-nav button[data-stage="${stage}"]`).click();
      await desktop.waitForTimeout(1150);
    } else {
      await desktop.locator('.marker[data-step="0"]').scrollIntoViewIfNeeded();
      await desktop.waitForTimeout(350);
    }
    check(`1440: stage ${stage + 1} selected`, await desktop.locator('.artboard').getAttribute('data-stage') === String(stage));
    await desktop.screenshot({ path: path.join(here, `desktop-${stage + 1}.png`) });
  }
  const panels = [];
  for (let n = 1; n <= 3; n++) panels.push({ input: await sharp(path.join(here, `desktop-${n}.png`)).resize(600, 375).png().toBuffer(), left: (n - 1) * 600, top: 0 });
  await sharp({ create: { width: 1800, height: 375, channels: 3, background: '#253740' } }).composite(panels).png().toFile(path.join(here, 'storyboard-desktop.png'));
  await desktop.locator('.lang[data-lang="en"]').click();
  check('1440: EN translation', (await desktop.locator('#stage-title').textContent()).includes('Choose'));
  await desktop.locator('.theme-toggle').click();
  check('1440: dark theme', await desktop.locator('body').getAttribute('data-theme') === 'dark');
  check('1440: language/theme preserve stage', await desktop.locator('.artboard').getAttribute('data-stage') === '2');
  await desktop.locator('.scene-copy .stage-nav button[data-stage="1"]').click();
  for (const [code, label] of [['ru', 'Контакты пород'], ['en', 'Rock contacts'], ['zh', '岩层接触']]) {
    await desktop.locator(`.lang[data-lang="${code}"]`).click();
    check(`1440: ${code} contact label`, (await desktop.locator('.art-label.middle').textContent()).trim() === label);
    check(`1440: ${code} contact label backing`, await desktop.locator('.art-label.middle').evaluate(el => getComputedStyle(el).backgroundColor === 'rgb(37, 55, 64)'));
  }

  const tablet = await pageAt(browser, 768, 1024);
  await basics(tablet, '768');
  await tablet.locator('.stage-nav button[data-stage="1"]').click();
  check('768: button switches scene', await tablet.locator('.artboard').getAttribute('data-stage') === '1');
  check('768: page remains near scene', await tablet.evaluate(() => Math.abs(document.querySelector('.story').getBoundingClientRect().top) < innerHeight));

  const mobile = await pageAt(browser, 375, 812);
  await basics(mobile, '375');
  await mobile.screenshot({ path: path.join(here, 'mobile-375-ru.png'), fullPage: true });
  await mobile.locator('.stage-nav button[data-stage="2"]').click();
  await mobile.locator('.lang[data-lang="zh"]').click();
  await mobile.locator('.theme-toggle').click();
  check('375: ZH stage title', (await mobile.locator('#stage-title').textContent()).includes('核查'));
  check('375: ZH dark preserves stage', await mobile.locator('.artboard').getAttribute('data-stage') === '2');
  check('375: control height >=44', await mobile.locator('.stage-nav button').evaluateAll(nodes => nodes.every(n => n.getBoundingClientRect().height >= 44)));
  await mobile.screenshot({ path: path.join(here, 'mobile-375-zh-stage3.png'), fullPage: true });
  check('375: no horizontal overflow after ZH', await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  const reduced = await pageAt(browser, 1440, 900, { reducedMotion: 'reduce' });
  check('reduced: static explanation visible', await reduced.locator('.static-explanation').isVisible());
  check('reduced: scene is not sticky', await reduced.locator('.scene').evaluate(el => getComputedStyle(el).position !== 'sticky'));
  check('reduced: three steps in static text', await reduced.locator('.static-explanation article').count() === 3);
  await reduced.locator('.story').scrollIntoViewIfNeeded();
  await reduced.screenshot({ path: path.join(here, 'reduced-motion.png') });

  const noJS = await pageAt(browser, 375, 812, { javaScriptEnabled: false });
  check('no-JS: static explanation visible', await noJS.locator('.static-explanation').isVisible());
  check('no-JS: scene art visible', await noJS.locator('.artboard').isVisible());
  check('no-JS: stage controls hidden', !(await noJS.locator('.stage-nav').isVisible()));
  check('no-JS: no overflow', await noJS.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  check('no page errors', errors.length === 0, errors);
  const report = { url, timestamp: new Date().toISOString(), passed: failures.length === 0, failures, checks, errors };
  fs.writeFileSync(path.join(here, 'qa.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, failures, errors }, null, 2));
  await browser.close();
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exit(1); });
