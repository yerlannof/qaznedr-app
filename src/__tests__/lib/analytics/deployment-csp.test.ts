import { readFileSync } from 'fs';
import { join } from 'path';

const deployment = JSON.parse(
  readFileSync(join(process.cwd(), 'vercel.json'), 'utf8')
);
const policy: string = deployment.headers
  .find((rule: { source: string }) => rule.source === '/(.*)')
  .headers.find(
    (header: { key: string }) => header.key === 'Content-Security-Policy'
  ).value;
const scriptSources = policy
  .split(';')
  .find((entry) => entry.trim().startsWith('script-src '))!
  .trim()
  .split(/\s+/)
  .slice(1);

it('allows the consent-gated production measurement SDKs through the deployed CSP', () => {
  expect(scriptSources).toContain('https://www.googletagmanager.com/gtag/js');
  expect(scriptSources).toContain('https://mc.yandex.ru/metrika/');
});

it('does not grant scripts a blanket HTTPS or wildcard permission', () => {
  expect(scriptSources).not.toContain('https:');
  expect(scriptSources).not.toContain('*');
  expect(scriptSources).not.toContain('https://*.google.com');
});
