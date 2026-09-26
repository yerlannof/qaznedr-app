import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { PUBLIC_PAGES, hiddenRouteRedirect } from '@/lib/seo/pages';

// Public pages (and the components they render) must not link into the
// hidden marketplace: such links only bounce the visitor through a 308,
// sometimes straight back to the same page.
const SRC = path.resolve(__dirname, '../..');

function resolveImport(spec: string): string | null {
  const base = path.join(SRC, spec.replace(/^@\//, ''));
  for (const f of [`${base}.tsx`, `${base}.ts`, `${base}/index.tsx`]) {
    if (existsSync(f)) return f;
  }
  return null;
}

// Page files for every indexable route plus the components they import,
// followed recursively within src/components.
function publicSourceFiles(): string[] {
  // The login page is not indexed, but the owner uses it; the 404 page is
  // embedded in every page's payload.
  const queue = [
    ...[...PUBLIC_PAGES, '/auth/login'].map((p) =>
      path.join(SRC, 'app/[locale]', p, 'page.tsx')
    ),
    path.join(SRC, 'app/[locale]/not-found.tsx'),
  ].filter(existsSync);
  const seen = new Set<string>();
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const src = readFileSync(file, 'utf8');
    for (const [, spec] of src.matchAll(/from '(@\/components\/[^']+)'/g)) {
      const dep = resolveImport(spec);
      if (dep) queue.push(dep);
    }
  }
  return [...seen];
}

function linkedPaths(src: string): string[] {
  const out: string[] = [];
  for (const [, p] of src.matchAll(/\/\$\{locale\}(\/[\w\-/]+)/g)) out.push(p);
  for (const [, p] of src.matchAll(/href[:=]\s*\{?['"](\/[\w\-/]+)['"]/g)) {
    out.push(p);
  }
  return out;
}

describe('public pages', () => {
  const files = publicSourceFiles();

  it('scans the home page and its sections', () => {
    const names = files.map((f) => path.basename(f));
    expect(names).toEqual(
      expect.arrayContaining(['HomePageContent.tsx', 'PortalWelcomeHero.tsx'])
    );
  });

  it('do not link to hidden marketplace routes', () => {
    const offenders = files.flatMap((f) =>
      linkedPaths(readFileSync(f, 'utf8'))
        .map((p) => (/^\/(ru|kz|en|zh)(\/|$)/.test(p) ? p : `/ru${p}`))
        .filter((p) => hiddenRouteRedirect(p) !== null)
        .map((p) => `${path.relative(SRC, f)} → ${p}`)
    );
    expect(offenders).toEqual([]);
  });

  it('do not invite visitors to register or post listings', () => {
    const offenders = files.filter((f) =>
      /home\.step(Register|Post)|portal\.statsListings/.test(
        readFileSync(f, 'utf8')
      )
    );
    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([]);
  });
});
