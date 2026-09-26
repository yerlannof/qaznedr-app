import { GUIDE, insightHref } from '@/lib/insights/registry';

describe('insightHref', () => {
  it('links to the reader language when the guide is written in it', () => {
    expect(insightHref('en', GUIDE.rightsTransfer)).toBe(
      `/en/insights/${GUIDE.rightsTransfer}`
    );
    expect(insightHref('zh', GUIDE.foreignInvestor)).toBe(
      `/zh/insights/${GUIDE.foreignInvestor}`
    );
  });

  it('links kz readers straight to the ru version (no 308 hop)', () => {
    expect(insightHref('kz', GUIDE.rightsTransfer)).toBe(
      `/ru/insights/${GUIDE.rightsTransfer}`
    );
  });
});
