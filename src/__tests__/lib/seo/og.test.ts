import { LOCALES } from '@/lib/seo/site';
import { OG_ALT, ogHomeTitle, ogImageUrl, ogTitleSize } from '@/lib/seo/og';

describe('ogHomeTitle', () => {
  it.each(LOCALES)('%s: approved home title without the brand prefix', (l) => {
    const title = ogHomeTitle(l);
    expect(title.length).toBeGreaterThan(10);
    expect(title).not.toMatch(/QAZNEDR/);
    expect(title).not.toMatch(/Платформа геологической|ecosystem|экосистем/i);
  });

  it('ru reads as the home page promise, capitalised', () => {
    expect(ogHomeTitle('ru')).toBe('Участки недр Казахстана для инвесторов');
  });
});

describe('ogTitleSize', () => {
  it('shrinks long titles, counting CJK characters double', () => {
    expect(ogTitleSize('Участки недр Казахстана')).toBe(64);
    expect(ogTitleSize('x'.repeat(60))).toBe(52);
    expect(ogTitleSize('x'.repeat(90))).toBe(44);
    // 25 CJK chars = 50 units → middle size.
    expect(ogTitleSize('矿'.repeat(25))).toBe(52);
  });
});

describe('ogImageUrl', () => {
  it('points at the locale card', () => {
    expect(ogImageUrl('zh')).toBe(
      'https://qaznedr.kz/zh/opengraph-image?v=20260927-areas'
    );
    expect(ogImageUrl('en', '/insights/x')).toBe(
      'https://qaznedr.kz/en/insights/x/opengraph-image?v=20260927-areas'
    );
    expect(OG_ALT).toBe('QAZNEDR HOLDING');
  });
});
