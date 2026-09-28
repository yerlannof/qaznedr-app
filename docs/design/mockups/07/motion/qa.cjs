const { chromium } = require('../../../../../node_modules/playwright');
const sharp = require('../../../../../node_modules/sharp');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const review =
    'file://' +
    path.resolve(__dirname, '../../../review/07-geology-motion.html');
  const errors = [];
  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  desktop.on('pageerror', (error) => errors.push(error.message));
  await desktop.goto(review);
  await desktop.locator('.art').evaluate((image) => image.decode());
  for (let i = 0; i < 3; i++) {
    await desktop
      .locator(`.step-marker[data-step="${i}"]`)
      .scrollIntoViewIfNeeded();
    await desktop.waitForTimeout(800);
    await desktop.screenshot({
      path: path.join(__dirname, `desktop-${i + 1}.png`),
    });
  }
  const panels = [];
  for (let i = 0; i < 3; i++)
    panels.push({
      input: await sharp(path.join(__dirname, `desktop-${i + 1}.png`))
        .resize(640, 400)
        .png()
        .toBuffer(),
      left: i * 640,
      top: 0,
    });
  await sharp({
    create: { width: 1920, height: 400, channels: 3, background: '#253740' },
  })
    .composite(panels)
    .png()
    .toFile(path.join(__dirname, 'storyboard.png'));
  const desktopQA = {
    overflow: await desktop.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    image: await desktop
      .locator('.art')
      .evaluate((image) => image.complete && image.naturalWidth > 0),
    stage: await desktop.locator('.canvas').getAttribute('data-stage'),
  };
  const mobile = await browser.newPage({
    viewport: { width: 375, height: 812 },
  });
  mobile.on('pageerror', (error) => errors.push(error.message));
  await mobile.goto(review);
  await mobile.locator('.mobile-image img').evaluate((image) => image.decode());
  await mobile.screenshot({
    path: path.join(__dirname, 'mobile-375-ru.png'),
    fullPage: true,
  });
  await mobile.locator('.mobile-story button[data-stage="2"]').click();
  await mobile.locator('.lang[data-lang="zh"]').click();
  await mobile.waitForTimeout(700);
  await mobile.screenshot({
    path: path.join(__dirname, 'mobile-375-zh-stage3.png'),
    fullPage: true,
  });
  const mobileQA = {
    overflow: await mobile.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    stage: await mobile.locator('.mobile-image').getAttribute('data-stage'),
    pressed: await mobile
      .locator('.mobile-story button[data-stage="2"]')
      .getAttribute('aria-pressed'),
    image: await mobile
      .locator('.mobile-image img')
      .evaluate((image) => image.complete && image.naturalWidth > 0),
  };
  const reduced = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  await reduced.goto(review);
  const reducedQA = {
    staticVisible: await reduced.locator('.static-story').isVisible(),
    stickyVisible: await reduced.locator('.sticky').isVisible(),
  };
  const noJS = await browser.newPage({
    viewport: { width: 375, height: 812 },
    javaScriptEnabled: false,
  });
  await noJS.goto(review);
  const noJSQA = {
    staticVisible: await noJS.locator('.static-story').isVisible(),
  };
  console.log(
    JSON.stringify(
      {
        desktop: desktopQA,
        mobile: mobileQA,
        reduced: reducedQA,
        noJS: noJSQA,
        errors,
      },
      null,
      2
    )
  );
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
