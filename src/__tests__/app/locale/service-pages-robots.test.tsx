/** @jest-environment node */
import type { Metadata } from 'next';
import { renderToStaticMarkup } from 'react-dom/server';
import AdminLayout, {
  metadata as adminMetadata,
} from '@/app/[locale]/admin/layout';
import AuthLayout, {
  metadata as authMetadata,
} from '@/app/[locale]/auth/layout';
import { metadata as notFoundMetadata } from '@/app/[locale]/not-found';
import { generateMetadata as privacyMetadata } from '@/app/[locale]/legal/privacy/page';
import { privacyFor } from '@/lib/content/privacy';
import { LOCALES, SITE_NAME } from '@/lib/seo/site';

describe('admin and sign-in sections', () => {
  it.each([
    ['admin', adminMetadata],
    ['auth', authMetadata],
  ] as const)('keeps every /%s page out of the index', (_, metadata) => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it.each([
    ['admin', AdminLayout],
    ['auth', AuthLayout],
  ] as const)('/%s layout renders its pages unchanged', (_, Layout) => {
    expect(
      renderToStaticMarkup(
        <Layout>
          <p>child</p>
        </Layout>
      )
    ).toBe('<p>child</p>');
  });
});

it('leaves the 404 with the single noindex tag Next adds, not the site default', () => {
  // Without this the [locale] layout's "index, follow" was rendered next to
  // Next's own "noindex" on every 404 (e.g. /ru/auth/email while it is off).
  expect(notFoundMetadata).toEqual({ robots: null } satisfies Metadata);
});

it.each(LOCALES)(
  'names the brand once in the %s privacy title',
  async (locale) => {
    const meta = await privacyMetadata({ params: Promise.resolve({ locale }) });
    const title = (meta.title as { absolute: string }).absolute;
    expect(title).toBe(`${privacyFor(locale).heading} | ${SITE_NAME}`);
    expect(title.match(/QAZNEDR/g)).toHaveLength(1);
  }
);
