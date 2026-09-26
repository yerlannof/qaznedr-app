import { HREFLANG, localeUrl, toLocale } from '@/lib/seo/site';
import {
  buildLanguageAlternates,
  buildPageMetadata,
  buildTranslatedPageMetadata,
} from '@/lib/seo/metadata';

describe('seo/site', () => {
  it('builds locale urls without trailing slash', () => {
    expect(localeUrl('zh')).toBe('https://qaznedr.kz/zh');
    expect(localeUrl('en', '/leads/')).toBe('https://qaznedr.kz/en/leads');
    expect(localeUrl('ru', 'about')).toBe('https://qaznedr.kz/ru/about');
  });

  it('falls back to ru for unknown locales', () => {
    expect(toLocale('de')).toBe('ru');
    expect(toLocale(undefined)).toBe('ru');
    expect(toLocale('zh')).toBe('zh');
  });

  it('uses zh-CN and kk as language codes', () => {
    expect(HREFLANG.zh).toBe('zh-CN');
    expect(HREFLANG.kz).toBe('kk');
  });
});

describe('seo/metadata', () => {
  it('lists every locale plus x-default in alternates', () => {
    expect(buildLanguageAlternates('/leads')).toEqual({
      ru: 'https://qaznedr.kz/ru/leads',
      kk: 'https://qaznedr.kz/kz/leads',
      en: 'https://qaznedr.kz/en/leads',
      'zh-CN': 'https://qaznedr.kz/zh/leads',
      'x-default': 'https://qaznedr.kz/ru/leads',
    });
  });

  it('sets a self-referencing canonical and branded OG title', () => {
    const m = buildPageMetadata({
      locale: 'en',
      path: '/about',
      title: 'About',
      description: 'd',
    });
    expect(m.alternates?.canonical).toBe('https://qaznedr.kz/en/about');
    expect(m.title).toBe('About');
    expect((m.openGraph as { title: string }).title).toBe(
      'About | QAZNEDR HOLDING'
    );
    expect((m.openGraph as { locale: string }).locale).toBe('en_US');
    expect(m.robots).toEqual({ index: true, follow: true });
  });

  it('supports absolute titles and noindex', () => {
    const m = buildPageMetadata({
      locale: 'ru',
      path: '',
      title: 'Home',
      description: 'd',
      absoluteTitle: true,
      noindex: true,
    });
    expect(m.title).toEqual({ absolute: 'Home' });
    expect(m.alternates?.canonical).toBe('https://qaznedr.kz/ru');
    expect(m.robots).toEqual({ index: false, follow: false });
  });

  it('reads localized strings from translations', () => {
    const zh = buildTranslatedPageMetadata('zh', '/leads', 'leads');
    const ru = buildTranslatedPageMetadata('ru', '/leads', 'leads');
    expect(String(zh.title)).toMatch(/[一-鿿]/);
    expect(zh.title).not.toEqual(ru.title);
    expect(zh.alternates?.canonical).toBe('https://qaznedr.kz/zh/leads');
  });
});
