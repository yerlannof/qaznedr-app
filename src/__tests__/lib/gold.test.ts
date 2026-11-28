/** @jest-environment node */
jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/leads/private-access', () => ({
  getActiveEntitlement: jest.fn(),
}));

import { renderGoldMd, dropRightsRow, cropUrl } from '@/lib/gold/markdown';
import { rightsFresh } from '@/lib/gold/cards';

const OPEN = [
  '| | |',
  '|---|---|',
  '| Регион | Восточно-Казахстанская область |',
  '| Права | 🟠 **под разведкой** |',
  '| Уровень / цена | 4 · $900 (предварительно) |',
].join('\n');

describe('gold markdown', () => {
  it('keeps listed crops and routes them through the gated API', () => {
    const html = renderGoldMd(
      'Скан:\n\n![кроп](crops/AU-0001.jpg)',
      'AU-0001',
      ['AU-0001.jpg']
    );
    expect(html).toContain(`src="${cropUrl('AU-0001', 'AU-0001.jpg')}"`);
    expect(html).toContain('/api/gold/AU-0001/crop/AU-0001.jpg');
    expect(html).not.toContain('src="crops/');
  });

  it('drops crops not listed in the card and any outside image', () => {
    const html = renderGoldMd(
      '![a](crops/AU-0002.jpg) ![b](https://evil.example/x.jpg) ![c](crops/../KEY_NOT_FOR_BUYER.tsv)',
      'AU-0001',
      ['AU-0001.jpg']
    );
    expect(html).not.toContain('<img');
    expect(html).not.toContain('evil.example');
  });

  it('prints raw HTML as text and keeps only link words', () => {
    const html = renderGoldMd(
      '<script>alert(1)</script>\n\nТекст [слово](https://x.example) <b onclick=x>b</b>',
      'AU-0001'
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('слово');
    expect(html).not.toContain('x.example');
    expect(html).not.toContain('<b ');
  });

  it('renders the open table and drops only the rights row when stale', () => {
    const html = renderGoldMd(OPEN, 'AU-0001');
    expect(html).toContain('<table>');
    expect(html).not.toContain('<thead>');
    expect(
      renderGoldMd('| вид | золото |\n|---|---|\n| C1 | 5 |', 'AU-0001')
    ).toContain('<thead>');
    const stale = dropRightsRow(OPEN);
    expect(stale).not.toContain('под разведкой');
    expect(stale).toContain('Уровень / цена');
    expect(stale).toContain('Регион');
  });
});

describe('rights caption lifetime', () => {
  it('is fresh for 30 days after the live check and withdrawn after', () => {
    expect(rightsFresh('2026-11-28', new Date('2026-11-28T12:00:00Z'))).toBe(
      true
    );
    expect(rightsFresh('2026-11-28', new Date('2026-12-27T23:00:00Z'))).toBe(
      true
    );
    expect(rightsFresh('2026-11-28', new Date('2026-12-29T00:00:00Z'))).toBe(
      false
    );
    expect(rightsFresh('', new Date())).toBe(false);
  });
});
