import { GUIDE, INSIGHTS, insightHref } from '@/lib/insights/registry';

describe('insightHref', () => {
  it('links to the reader language when the guide is written in it', () => {
    expect(insightHref('en', GUIDE.rightsTransfer)).toBe(
      `/en/insights/${GUIDE.rightsTransfer}`
    );
    expect(insightHref('zh', GUIDE.foreignInvestor)).toBe(
      `/zh/insights/${GUIDE.foreignInvestor}`
    );
  });

  it('links kz readers to the translated guide (no 308 hop)', () => {
    for (const slug of Object.values(GUIDE)) {
      expect(insightHref('kz', slug)).toBe(`/kz/insights/${slug}`);
    }
  });
});

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string): boolean {
  if (!ISO_DAY.test(value)) return false;
  return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

// A day of slack: the machine clock may be in UTC while dates are local (+05).
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

describe.each(INSIGHTS.map((e) => [e.slug, e] as const))(
  '%s registry dates',
  (_slug, entry) => {
    it('are real calendar dates and not in the future', () => {
      for (const d of [entry.published, entry.updated, entry.lawAsOf]) {
        if (d === undefined) continue;
        expect(isCalendarDate(d)).toBe(true);
        expect(d <= tomorrow).toBe(true);
      }
    });

    it('update on or after publishing', () => {
      expect(entry.published <= entry.updated).toBe(true);
    });

    it('legal guides say when the rules were checked', () => {
      if (!entry.legal) return;
      expect(entry.lawAsOf).toBeDefined();
      expect(entry.published <= (entry.lawAsOf as string)).toBe(true);
    });
  }
);
