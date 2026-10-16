/** @jest-environment node */
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import PlotPage, {
  generateMetadata,
  generateStaticParams,
} from '@/app/[locale]/prospecting/[code]/page';
import IndexPage, {
  generateMetadata as indexMetadata,
} from '@/app/[locale]/prospecting/page';
import { listPublicPlots } from '@/lib/prospecting/plots';
import { PUBLIC_PAGES } from '@/lib/seo/pages';
import { LOCALES } from '@/lib/seo/site';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

const params = (locale: string, code: string) => ({
  params: Promise.resolve({ locale, code }),
});
const render = async (locale: string, code: string) =>
  renderToStaticMarkup(await PlotPage(params(locale, code)));

describe('/prospecting/[code]', () => {
  it('prerenders every published plot in four languages', () => {
    expect(generateStaticParams()).toHaveLength(listPublicPlots().length * 4);
  });

  it('renders the plot with licence facts, outline, coordinates and contact', async () => {
    const html = await render('ru', 'QN-P07');
    expect(html).toContain('<h1');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('Старательский участок QN-P07');
    expect(html).toContain('KZ00VZJ00000560');
    expect(html).toContain('05.04.2029');
    expect(html).toContain('45°41&#x27;08.8534&quot;');
    expect(html).toContain('aria-label="Схема участка QN-P07');
    expect(html).toContain('id="contact"');
    expect(html).toContain('не продаётся и не передаётся');
    expect(html).toContain('/ru/insights/artisanal-mining-licence-kazakhstan');
  });

  it('embeds Place and BreadcrumbList JSON-LD without offers', async () => {
    const html = await render('en', 'QN-P15');
    const blocks = [
      ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g),
    ].map((m) => JSON.parse(m[1]));
    expect(blocks.map((b) => b['@type'])).toEqual(['Place', 'BreadcrumbList']);
    expect(html).not.toMatch(/"@type":"(Offer|Product|JobPosting)"/);
  });

  it('notes the corrected corner of QN-P03', async () => {
    const html = await render('ru', 'QN-P03');
    expect(html).toContain('напечатана с опечаткой');
  });

  it.each(['QN-P12', 'QN-P99', 'nope'])('404s for %s', async (code) => {
    await expect(render('ru', code)).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('sets a canonical qaznedr.kz URL and indexable metadata', async () => {
    const meta = await generateMetadata(params('kz', 'QN-P07'));
    expect(meta.alternates?.canonical).toBe(
      'https://qaznedr.kz/kz/prospecting/QN-P07'
    );
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it('keeps hidden plots out of the index', async () => {
    const meta = await generateMetadata(params('ru', 'QN-P12'));
    expect(meta.robots).toEqual({ index: false, follow: false });
  });
});

describe('/prospecting', () => {
  it('lists every published plot with one h1', async () => {
    const html = renderToStaticMarkup(
      await IndexPage({ params: Promise.resolve({ locale: 'ru' }) })
    );
    expect(html.match(/<h1/g)).toHaveLength(1);
    for (const plot of listPublicPlots()) {
      expect(html).toContain(`href="/ru/prospecting/${plot.code}"`);
    }
    expect(html).toContain('"@type":"CollectionPage"');
  });

  it('is a public page with its own metadata', async () => {
    expect(PUBLIC_PAGES).toContain('/prospecting');
    const meta = await indexMetadata({
      params: Promise.resolve({ locale: 'zh' }),
    });
    expect(meta.alternates?.canonical).toBe(
      'https://qaznedr.kz/zh/prospecting'
    );
  });
});

// The repo is public: holder names live only in the gitignored dossier.
const NAMES_FILE = path.join(
  process.cwd(),
  'data/prospecting/v1/private-names.json'
);
const describeLeak = existsSync(NAMES_FILE) ? describe : describe.skip;

describeLeak('holder names never reach public output', () => {
  const names: string[] = existsSync(NAMES_FILE)
    ? JSON.parse(readFileSync(NAMES_FILE, 'utf8')).names
    : [];
  const pattern = new RegExp(names.join('|'), 'i');

  it('plots.v1.json and the translations are clean', () => {
    for (const file of [
      'src/lib/prospecting/plots.v1.json',
      'src/lib/i18n/translations.ts',
      'public/llms.txt',
    ]) {
      expect(readFileSync(path.join(process.cwd(), file), 'utf8')).not.toMatch(
        pattern
      );
    }
  });

  it('rendered plot pages are clean in every language', async () => {
    for (const plot of listPublicPlots()) {
      for (const locale of LOCALES) {
        expect(await render(locale, plot.code)).not.toMatch(pattern);
      }
    }
  });
});

describe('while prospecting is switched off', () => {
  const saved = process.env.PROSPECTING_ENABLED;
  beforeEach(() => {
    delete process.env.PROSPECTING_ENABLED;
  });
  afterEach(() => {
    process.env.PROSPECTING_ENABLED = saved;
  });

  it('404s the plot pages', async () => {
    await expect(render('ru', 'QN-P07')).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('404s the list page and keeps it out of the index', async () => {
    await expect(
      IndexPage({ params: Promise.resolve({ locale: 'ru' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    const meta = await indexMetadata({
      params: Promise.resolve({ locale: 'ru' }),
    });
    expect(meta.robots).toEqual({ index: false, follow: false });
  });
});
