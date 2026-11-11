/** @jest-environment node */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// next.config.mjs is an ES module; read its evaluated config in a child Node.
function loadConfig() {
  const script = `
    const { default: c } = await import(${JSON.stringify(
      path.join(process.cwd(), 'next.config.mjs')
    )});
    process.stdout.write(JSON.stringify({ images: c.images, headers: await c.headers() }));
  `;
  return JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      encoding: 'utf8',
    })
  ) as {
    images: { domains?: string[]; minimumCacheTTL?: number };
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
}

const config = loadConfig();
const cacheControl = (source: string) =>
  config.headers
    .find((rule) => rule.source === source)
    ?.headers.find((h) => h.key === 'Cache-Control')?.value;

it.each(['/brand/:path*', '/offers/:path*'])(
  'lets browsers keep unhashed public files under %s for a day',
  (source) => {
    expect(cacheControl(source)).toBe(
      'public, max-age=86400, stale-while-revalidate=604800'
    );
  }
);

it('points every path-specific cache rule at an existing public folder', () => {
  for (const { source, headers } of config.headers) {
    if (source === '/:path*') continue;
    if (!headers.some((h) => h.key === 'Cache-Control')) continue;
    const folder = source.split('/')[1];
    expect(fs.existsSync(path.join(process.cwd(), 'public', folder))).toBe(
      true
    );
  }
});

it('keeps optimised images cached and drops placeholder image hosts', () => {
  expect(config.images.minimumCacheTTL).toBeGreaterThanOrEqual(3600);
  expect(config.images.domains ?? []).not.toEqual(
    expect.arrayContaining(['picsum.photos'])
  );
  expect(
    (config.images.domains ?? []).some((d) => d.includes('your-supabase'))
  ).toBe(false);
});
