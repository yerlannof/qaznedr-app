import fs from 'fs';
import path from 'path';
import raw from '@/lib/offers/offers.v1.json';
import { parseOffer, mediaSrc } from '@/lib/offers/contract';
import { getOffer, listPublishedOffers } from '@/lib/offers';
import { fromAssetOffer } from '@/lib/catalog/sources/offers';

const rows = raw as Record<string, unknown>[];
const LOCALES = ['ru', 'kz', 'en', 'zh'] as const;

describe('qaznedr-offer-v1 contract', () => {
  it('validates every shipped card', () => {
    for (const row of rows) expect(parseOffer(row)).not.toBeNull();
    expect(listPublishedOffers().map((o) => o.code)).toEqual(['QN-A01']);
  });

  it('rejects a card with a broken field instead of half-rendering it', () => {
    expect(parseOffer({ ...rows[0], key_figures: [] })).toBeNull();
    expect(parseOffer({ ...rows[0], code: 'QN-04' })).toBeNull();
    expect(
      parseOffer({
        ...rows[0],
        images: [
          {
            url: 'https://elsewhere.example/x.webp',
            width: 1,
            height: 1,
            v: 'aaaaaaaaaaaa',
            alt: { ru: 'x' },
          },
        ],
      })
    ).toBeNull();
  });

  it('has every media file on disk with the declared hash', () => {
    const offer = getOffer('QN-A01')!;
    const media = [...offer.images, ...(offer.video ? [offer.video] : [])];
    for (const m of media) {
      const file = path.join(process.cwd(), 'public', m.url);
      expect(fs.existsSync(file)).toBe(true);
      const sha = require('crypto')
        .createHash('sha256')
        .update(fs.readFileSync(file))
        .digest('hex');
      expect(sha.slice(0, 12)).toBe(m.v);
      expect(mediaSrc(m)).toBe(`${m.url}?v=${m.v}`);
    }
  });

  it('carries all four languages for the approved text', () => {
    const offer = getOffer('QN-A01')!;
    for (const l of LOCALES) {
      expect(offer.h1[l]).toBeTruthy();
      expect(offer.legal[l]).toBeTruthy();
      expect(offer.nda_documents[l]?.length).toBe(
        offer.nda_documents.ru.length
      );
      for (const s of offer.sections)
        expect(s.items[l]?.length).toBe(s.items.ru.length);
    }
  });

  it('maps to a catalogue item', () => {
    expect(fromAssetOffer(getOffer('QN-A01')!)).toMatchObject({
      kind: 'asset',
      path: '/offers/QN-A01',
      commodityGroup: 'opi',
      commodities: ['stone'],
      region: 'almaty-region',
      stage: 'production',
      hasInfrastructure: true,
    });
  });
});

// The repository is public: the seller stays anonymous until the owner says
// otherwise. Generic identifiers are blocked here; seller-specific names live
// in the gitignored dossier and are checked when it is present.
describe('anonymity of public offer cards', () => {
  const text = JSON.stringify(rows);

  it('contains no company forms, ids, e-mails, phones or exact coordinates', () => {
    expect(text).not.toMatch(/\bТОО\b|\bLLP\b|\bАО\b|ЖШС/);
    expect(text).not.toMatch(/\b\d{12}\b/); // БИН/ИИН
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(text).not.toMatch(
      /(?:\+7|\b8)[\s-]?\(?7\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/
    );
    expect(text).not.toMatch(/\d{2}°\s?\d{1,2}['′]/);
    expect(text).not.toMatch(/№\s?\d/);
  });

  it('contains none of the seller-specific terms from the local dossier', () => {
    const file = path.join(process.cwd(), 'data/offers/v1/forbidden-terms.txt');
    if (!fs.existsSync(file)) return;
    const terms = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const lower = text.toLowerCase();
    for (const term of terms)
      expect(lower.includes(term) ? term : null).toBeNull();
  });
});
