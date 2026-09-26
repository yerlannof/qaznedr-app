#!/usr/bin/env node
'use strict';

// Local visual QA for the two review prototypes. This is a focused contrast
// heuristic, not a complete WCAG audit. Run from the repository root:
//   node docs/design/review/qa-review.cjs [identity.html] [wireframes.html]
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const reviewDir = __dirname;
const root = path.resolve(reviewDir, '..');
const defaults = [
  path.join(reviewDir, '01-identity.html'),
  path.join(reviewDir, '02-wireframes.html'),
];
const inputPaths = process.argv.slice(2);
const pages = defaults.map((p, i) => path.resolve(inputPaths[i] || p));
const viewports = [
  { width: 375, height: 900 },
  { width: 1440, height: 1000 },
];

function isWithinDesign(candidate) {
  const relative = path.relative(root, candidate);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function outDirFor(pagePath, index) {
  const match = path.basename(pagePath).match(/^(01|02)/);
  const outputDir = path.resolve(root, 'mockups', match ? match[1] : String(index + 1).padStart(2, '0'));
  if (!isWithinDesign(outputDir)) throw new Error(`Refusing output outside docs/design: ${outputDir}`);
  return outputDir;
}

async function main() {
  const absent = pages.filter(p => !fs.existsSync(p));
  if (absent.length) {
    console.error(`Missing review page(s): ${absent.join(', ')}`);
    process.exitCode = 2;
    return;
  }
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const violations = [];
  try {
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const filePath = pages[pageIndex];
      const fileUrl = pathToFileURL(filePath).href;
      const outputDir = outDirFor(filePath, pageIndex);
      fs.mkdirSync(outputDir, { recursive: true });

      for (const viewport of viewports) {
        const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
        const label = `${path.basename(filePath)} @ ${viewport.width}x${viewport.height}`;
        page.on('pageerror', error => violations.push(`[JS] ${label}: ${error.message}`));
        page.on('requestfailed', request => {
          violations.push(`[request] ${label}: ${request.url()} (${request.failure()?.errorText || 'failed'})`);
        });
        page.on('request', request => {
          if (/^https?:/i.test(request.url())) violations.push(`[external] ${label}: ${request.url()}`);
        });
        await page.goto(fileUrl, { waitUntil: 'load' });
        const screenshotPath = path.resolve(outputDir, `qa-${viewport.width}.png`);
        if (!isWithinDesign(screenshotPath)) throw new Error(`Refusing output outside docs/design: ${screenshotPath}`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        const findings = await page.evaluate(() => {
          const issues = [];
          if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
            issues.push(`horizontal overflow (${document.documentElement.scrollWidth}px > ${document.documentElement.clientWidth}px)`);
          }
          for (const img of document.images) {
            if (!img.complete || img.naturalWidth === 0) issues.push(`broken image: ${img.currentSrc || img.src || '(no src)'}`);
          }
          const parseColor = value => {
            const m = value.match(/^rgba?\(([^)]+)\)$/i);
            if (!m) return null;
            const nums = m[1].split(',').map(s => parseFloat(s.trim()));
            if (nums.length < 3 || nums.slice(0, 3).some(Number.isNaN)) return null;
            return { r: nums[0], g: nums[1], b: nums[2], a: nums.length > 3 && !Number.isNaN(nums[3]) ? nums[3] : 1 };
          };
          const luminance = c => {
            const channel = v => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
            return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
          };
          const ratio = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
          const visible = el => {
            const s = getComputedStyle(el), rect = el.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) !== 0 && rect.width > 0 && rect.height > 0;
          };
          const bgFor = el => {
            for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
              const color = parseColor(getComputedStyle(n).backgroundColor);
              if (color && color.a === 1) return color;
              // Ignore semi-transparent layers: accurate compositing can be complex.
              if (color && color.a !== 0) return null;
            }
            return { r: 255, g: 255, b: 255, a: 1 };
          };
          const colorString = c => `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            const node = walker.currentNode;
            const text = node.nodeValue.replace(/\s+/g, ' ').trim();
            const el = node.parentElement;
            if (!text || !el || !visible(el)) continue;
            const fg = parseColor(getComputedStyle(el).color), bg = bgFor(el);
            if (!fg || !bg || fg.a !== 1) continue;
            const style = getComputedStyle(el), size = parseFloat(style.fontSize) || 16;
            const large = size >= 24 || (size >= 18.66 && (style.fontWeight === 'bold' || Number(style.fontWeight) >= 700));
            const actual = ratio(fg, bg), required = large ? 3 : 4.5;
            if (actual < required) issues.push(`contrast ${actual.toFixed(2)}:1 (needs ${required}:1), “${text.slice(0, 90)}”, ${colorString(fg)} on ${colorString(bg)}`);
          }
          return issues;
        });
        for (const finding of findings) {
          const prefix = finding.startsWith('contrast') ? '[AA contrast]' : '[layout/assets]';
          violations.push(`${prefix} ${label}: ${finding}`);
        }
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  if (violations.length) {
    console.log(`${violations.length} focused QA finding(s):`);
    for (const issue of violations) console.log(`- ${issue}`);
    process.exitCode = 1;
  } else {
    console.log('No focused QA findings. Contrast sampling is heuristic; this is not a full WCAG audit.');
  }
}

main().catch(error => {
  console.error(`QA runner failed: ${error.stack || error.message}`);
  process.exitCode = 2;
});
