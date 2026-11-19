/**
 * @jest-environment node
 */
import {
  countsAsOpen,
  isPublicDoc,
  keyMatches,
  parseManifest,
} from '@/lib/offer-files/manifest';

describe('offer-files manifest helpers', () => {
  it('serves only the three public languages', () => {
    expect(['ru', 'en', 'zh'].every(isPublicDoc)).toBe(true);
    expect(isPublicDoc('search_ru')).toBe(false);
    expect(isPublicDoc('s')).toBe(false);
  });

  it('matches only the exact long key', () => {
    const key = 'abcdefghijklmnopqrstuvwx';
    expect(keyMatches(key, key)).toBe(true);
    expect(keyMatches(key.slice(0, -1) + 'y', key)).toBe(false);
    expect(keyMatches(key + 'z', key)).toBe(false);
    expect(keyMatches('', '')).toBe(false);
    expect(keyMatches('short', 'short')).toBe(false);
    expect(keyMatches(key, undefined)).toBe(false);
  });

  it('does not count link previews, crawlers or HEAD requests', () => {
    const phone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1';
    expect(countsAsOpen('GET', phone)).toBe(true);
    expect(countsAsOpen('HEAD', phone)).toBe(false);
    expect(countsAsOpen('GET', 'WhatsApp/2.23.20')).toBe(false);
    expect(countsAsOpen('GET', 'TelegramBot (like TwitterBot)')).toBe(false);
    expect(countsAsOpen('GET', 'Googlebot/2.1')).toBe(false);
    expect(countsAsOpen('GET', null)).toBe(false);
  });

  it('rejects a broken manifest', () => {
    expect(parseManifest('{')).toBeNull();
    expect(parseManifest('{"docs":{}}')).toBeNull();
    expect(parseManifest('{"docs":{},"keys":{"search":"a","muhtar":"b"}}')).not.toBeNull();
  });
});
