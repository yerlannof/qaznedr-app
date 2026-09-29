/** @jest-environment node */
import { renderToStaticMarkup } from 'react-dom/server';
import About from '@/app/[locale]/about/page';
import Contact from '@/app/[locale]/contact/page';
import { translate } from '@/lib/i18n/translations';
import { GUIDE } from '@/lib/insights/registry';
jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('@/lib/config/contacts', () => ({
  getContactConfig: () => ({
    whatsappNumber: '77001234567',
    wechatQrSrc: '/contacts/wechat-qr.png',
    wechatId: null,
    email: null,
  }),
  hasAnyChannel: () => true,
  whatsappLink: (n: string, text: string) =>
    'https://wa.me/' + n + '?text=' + encodeURIComponent(text),
}));
it.each(['ru', 'kz', 'en', 'zh'])(
  'renders approved %s company copy and one localized page heading',
  async (locale) => {
    const html = renderToStaticMarkup(
      await About({ params: Promise.resolve({ locale }) })
    );
    expect(html).toContain(translate(locale, 'holdingCompany.intro'));
    expect(html).toContain('Organization');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
  }
);
it.each(['ru', 'kz', 'en', 'zh'])(
  'keeps %s service context in contact UI and editable form',
  async (locale) => {
    const html = renderToStaticMarkup(
      await Contact({
        params: Promise.resolve({ locale }),
        searchParams: Promise.resolve({ service: 'analytics' }),
      })
    );
    const title = translate(locale, 'holdingServices.analytics.title');
    expect(html).toContain(title);
    expect(decodeURIComponent(html)).toContain(title);
    expect(html).toContain('>' + title + '</textarea>');
    expect(html).not.toContain('<main');
  }
);
it('ignores unapproved query text', async () => {
  const html = renderToStaticMarkup(
    await Contact({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({ service: 'untrusted-business-offer' }),
    })
  );
  expect(html).not.toContain('untrusted-business-offer');
});

it.each(['ru', 'kz', 'en', 'zh'] as const)(
  'keeps the %s guide topic in contact channels and form',
  async (locale) => {
    const html = renderToStaticMarkup(
      await Contact({
        params: Promise.resolve({ locale }),
        searchParams: Promise.resolve({ guide: GUIDE.geologicalDueDiligence }),
      })
    );
    const title = translate(locale, 'insights.links.geologicalDueDiligence');
    expect(html).toContain(title);
    expect(decodeURIComponent(html)).toContain(title);
    expect(html).toContain(`href="/${locale}/contact"`);
    expect(html).toContain(`>${title}</textarea>`);
  }
);

it('ignores unknown and repeated guide values', async () => {
  for (const guide of ['private-notes', [GUIDE.geologicalMap]]) {
    const html = renderToStaticMarkup(
      await Contact({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({ guide }),
      })
    );
    expect(html).not.toContain('private-notes');
    expect(html).not.toContain(
      'Geological maps of Kazakhstan: choosing a scale'
    );
  }
});

it.each(['ru', 'kz', 'en', 'zh'])(
  'identifies the confirmed Instagram profile on %s company/contact pages',
  async (locale) => {
    for (const Page of [About, Contact]) {
      const html = renderToStaticMarkup(
        await Page({ params: Promise.resolve({ locale }) })
      );
      const scripts = [
        ...html.matchAll(
          /<script type="application\/ld\+json">(.*?)<\/script>/g
        ),
      ];
      const organization = scripts
        .map((match) => JSON.parse(match[1]))
        .find((schema) => schema.mainEntity)?.mainEntity;
      expect(organization?.sameAs).toEqual([
        'https://www.instagram.com/qaznedr.kz/',
      ]);
      if (Page === Contact) {
        // Footer is mocked: this is a visible link in the contact page itself.
        expect(html).toContain('href="https://www.instagram.com/qaznedr.kz/"');
        expect(html).toContain('Instagram @qaznedr.kz</a>');
      }
    }
  }
);
