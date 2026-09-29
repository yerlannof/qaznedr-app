/** @jest-environment node */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InsightsPage from '@/app/[locale]/insights/page';
import { listArticles } from '@/lib/insights/content';
import { translate } from '@/lib/i18n/translations';
import { formatCheckDate } from '@/lib/leads/check-date';
import type { Locale } from '@/lib/seo/site';

jest.mock('@/components/layouts/Navigation', () => () => null);
jest.mock('@/components/layouts/Footer', () => () => null);

it.each(['ru', 'kz', 'en', 'zh'])(
  'renders the full %s article index as editorial rows with existing facts and links',
  async (rawLocale) => {
    const locale = rawLocale as Locale;
    const html = renderToStaticMarkup(
      await InsightsPage({ params: Promise.resolve({ locale }) })
    );
    const visible = html
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
    const cards = listArticles(locale);
    expect(html.match(/class="insight-index-row/g) ?? []).toHaveLength(
      cards.length
    );
    for (const card of cards) {
      expect(html).toContain(`href="/${card.locale}/insights/${card.slug}"`);
      expect(visible).toContain(card.title);
      expect(visible).toContain(card.description);
      expect(html).toContain(
        translate(locale, `insights.categories.${card.category}`)
      );
      expect(html).toContain(formatCheckDate(card.updated, locale));
      expect(html).toContain(
        translate(locale, 'insights.readingTime', { n: card.readingMinutes })
      );
    }
    expect(html).not.toContain('/brand/archive-to-field');
  }
);
