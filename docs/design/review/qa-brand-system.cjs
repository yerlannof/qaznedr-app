const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pages = [
  'review/07-brand-system.html',
  'review/01-master-candidate.html',
  'review/07-geology-motion.html',
  'brand/book/brand-book.html',
];
const outputPath = path.join(__dirname, 'qa-brand-system.json');
const screenshotsMap = {
  'review/07-brand-system.html': {
    1440: path.join(__dirname, 'screenshotreview07-1440.png'),
    375: path.join(__dirname, 'review07-375.png'),
  },
};
const chromePath =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function inspectTargets(html, pagePath) {
  const urls = [...html.matchAll(/(?:href|src)\s*=\s*(["'])(.*?)\1/gi)].map(
    (match) => match[2]
  );
  const issues = [];
  const ids = new Set(
    [...html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)].map((match) => match[2])
  );
  for (const raw of urls) {
    if (
      !raw ||
      raw.startsWith('data:') ||
      raw.startsWith('blob:') ||
      raw.startsWith('javascript:') ||
      /^[a-z]+:/i.test(raw)
    )
      continue;
    const [pathPart, fragmentPart] = raw.split('#');
    if (
      fragmentPart &&
      !pathPart &&
      !ids.has(decodeURIComponent(fragmentPart))
    ) {
      issues.push({ type: 'missing-fragment', target: raw });
      continue;
    }
    const filePath = pathPart
      ? path.resolve(
          path.dirname(pagePath),
          decodeURIComponent(pathPart.split('?')[0])
        )
      : pagePath;
    if (!fs.existsSync(filePath))
      issues.push({
        type: 'missing-local-file',
        target: raw,
        resolved: path.relative(root, filePath),
      });
    else if (fragmentPart) {
      try {
        const targetHtml = fs.readFileSync(filePath, 'utf8');
        const targetIds = new Set(
          [...targetHtml.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)].map(
            (match) => match[2]
          )
        );
        if (!targetIds.has(decodeURIComponent(fragmentPart)))
          issues.push({ type: 'missing-fragment', target: raw });
      } catch {}
    }
  }
  return issues;
}

(async () => {
  if (!fs.existsSync(chromePath))
    throw new Error(`Installed Chrome not found at ${chromePath}`);
  let browser;
  let browserLaunchError = null;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: chromePath,
      args: ['--allow-file-access-from-files'],
    });
  } catch (error) {
    browserLaunchError = error.message;
  }
  const results = [];
  try {
    if (!browser) {
      for (const relative of pages) {
        const filePath = path.join(root, relative);
        results.push(
          fs.existsSync(filePath)
            ? {
                file: relative,
                localTargetIssues: inspectTargets(
                  fs.readFileSync(filePath, 'utf8'),
                  filePath
                ),
                viewports: [],
                renderBlocked: browserLaunchError,
              }
            : { file: relative, missing: true }
        );
      }
    } else {
      for (const relative of pages) {
        const filePath = path.join(root, relative);
        if (!fs.existsSync(filePath)) {
          results.push({ file: relative, missing: true });
          continue;
        }
        const html = fs.readFileSync(filePath, 'utf8');
        const result = {
          file: relative,
          localTargetIssues: inspectTargets(html, filePath),
          viewports: [],
        };
        const sizes =
          relative === 'review/07-brand-system.html'
            ? [
                [1440, 1000],
                [375, 812],
              ]
            : [
                [1440, 1000],
                [375, 812],
              ];
        for (const [width, height] of sizes) {
          const page = await browser.newPage({
            viewport: { width, height },
            deviceScaleFactor: 1,
          });
          const jsErrors = [],
            consoleErrors = [],
            failedRequests = [];
          page.on('pageerror', (error) => jsErrors.push(error.message));
          page.on('console', (msg) => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
          });
          page.on('requestfailed', (request) =>
            failedRequests.push({
              url: request.url(),
              error: request.failure()?.errorText,
            })
          );
          await page.goto(`file://${filePath}`, {
            waitUntil: 'load',
            timeout: 60000,
          });
          await page.evaluate(() => document.fonts.ready);
          await page.evaluate(async () => {
            document
              .querySelectorAll('img[loading=\"lazy\"]')
              .forEach((image) => {
                image.loading = 'eager';
              });
            await Promise.all(
              [...document.images].map((image) =>
                image.decode().catch(() => null)
              )
            );
          });
          const visual = await page.evaluate(() => ({
            viewport: { width: innerWidth, height: innerHeight },
            document: {
              width: document.documentElement.scrollWidth,
              height: document.documentElement.scrollHeight,
            },
            horizontalOverflow:
              document.documentElement.scrollWidth > innerWidth + 1,
            overflowNodes:
              document.documentElement.scrollWidth > innerWidth + 1
                ? [...document.body.querySelectorAll('*')]
                    .map((el) => ({
                      tag: el.tagName,
                      id: el.id,
                      className:
                        typeof el.className === 'string' ? el.className : '',
                      left: Math.round(el.getBoundingClientRect().left),
                      right: Math.round(el.getBoundingClientRect().right),
                      width: Math.round(el.getBoundingClientRect().width),
                      scrollWidth: el.scrollWidth,
                      clientWidth: el.clientWidth,
                    }))
                    .filter(
                      (el) =>
                        el.right > innerWidth + 1 ||
                        el.left < -1 ||
                        el.scrollWidth > el.clientWidth + 1
                    )
                    .slice(0, 20)
                : [],
            fonts: {
              status: document.fonts.status,
              failed: [...document.fonts]
                .filter((f) => f.status === 'error')
                .map((f) => f.family),
            },
            images: [...document.images].map((i) => ({
              src: (i.getAttribute('src') || '').startsWith('data:')
                ? '[embedded data image]'
                : i.getAttribute('src'),
              complete: i.complete,
              naturalWidth: i.naturalWidth,
              naturalHeight: i.naturalHeight,
            })),
          }));
          if (screenshotsMap[relative]?.[width])
            await page.screenshot({
              path: screenshotsMap[relative][width],
              fullPage: true,
              animations: 'disabled',
            });
          result.viewports.push({
            width,
            height,
            ...visual,
            jsErrors,
            consoleErrors,
            failedRequests,
          });
          await page.close();
        }
        results.push(result);
      }
    }
  } finally {
    if (browser) await browser.close();
  }
  const issues = results.flatMap((r) =>
    (r.viewports || [])
      .filter(
        (v) =>
          v.horizontalOverflow ||
          v.images.some((i) => !i.complete || !i.naturalWidth) ||
          v.fonts.failed.length ||
          v.jsErrors.length ||
          v.consoleErrors.length ||
          v.failedRequests.length
      )
      .map((v) => ({
        file: r.file,
        width: v.width,
        horizontalOverflow: v.horizontalOverflow,
        documentWidth: v.document.width,
        viewportWidth: v.viewport.width,
        overflowNodes: v.overflowNodes,
      }))
  );
  const screenshots = Object.fromEntries(
    Object.entries(screenshotsMap).flatMap(([file, sets]) =>
      Object.entries(sets).map(([width, filePath]) => [
        `${file} @ ${width}px`,
        path.relative(root, filePath),
      ])
    )
  );
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        browser: 'installed Google Chrome via Playwright',
        browserLaunchError,
        viewports: [1440, 375],
        summary: {
          pageCount: results.length,
          viewportCount: results.reduce(
            (n, r) => n + (r.viewports?.length || 0),
            0
          ),
          issues,
        },
        screenshots,
        pages: results,
      },
      null,
      2
    ) + '\n'
  );
  console.log(
    JSON.stringify(
      results.map((r) => ({
        file: r.file,
        missing: r.missing,
        localIssues: r.localTargetIssues?.length,
        viewports: r.viewports?.map((v) => ({
          width: v.width,
          overflow: v.horizontalOverflow,
          images: v.images.filter((i) => !i.complete || !i.naturalWidth).length,
          fontErrors: v.fonts.failed.length,
          js: v.jsErrors.length,
          console: v.consoleErrors.length,
          failedRequests: v.failedRequests.length,
        })),
      })),
      null,
      2
    )
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
