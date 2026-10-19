import { translate, translations } from '@/lib/i18n/translations';
import { FAQ } from '@/lib/content/faq';
import offers from '@/lib/offers/offers.v1.json';

// Chinese copy audit (2026-10-20): one term per concept, no Cyrillic leaking
// into Chinese text (ГКЗ, С₂ with a Cyrillic С), 矿区 for our areas and
// 地块 only for prospecting plots with corner points.

const CYRILLIC = /[Ѐ-ӿ]/;

function strings(value: unknown, path: string, out: [string, string][]) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value))
    value.forEach((v, i) => strings(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) strings(v, `${path}.${k}`, out);
  return out;
}

function zhFields(value: unknown, path: string, out: [string, string][]) {
  if (Array.isArray(value))
    value.forEach((v, i) => zhFields(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) {
      if (k === 'zh' && typeof v === 'string') out.push([`${path}.zh`, v]);
      else zhFields(v, `${path}.${k}`, out);
    }
  return out;
}

const zh = strings(translations.zh, 'zh', []);

it('has no Cyrillic characters in any zh translation', () => {
  expect(zh.filter(([, v]) => CYRILLIC.test(v))).toEqual([]);
});

it('has no Cyrillic characters in zh fields of the offers', () => {
  expect(
    zhFields(offers, 'offers', []).filter(([, v]) => CYRILLIC.test(v))
  ).toEqual([]);
});

it('has no Cyrillic characters in the zh FAQ', () => {
  const faq = FAQ.zh.map(({ q, a }) => `${q} ${a}`);
  expect(faq.filter((v) => CYRILLIC.test(v))).toEqual([]);
});

it('calls an ore occurrence 矿点, not 矿化点', () => {
  expect(translate('zh', 'catalog.stages.occurrence')).toBe('矿点');
});

it('keeps 地块 only for prospecting plots', () => {
  expect(
    zh.filter(
      ([path, v]) => v.includes('地块') && !path.startsWith('zh.prospecting.')
    )
  ).toEqual([]);
});

it('uses one Chinese name per legal term', () => {
  const all = [...zh, ...zhFields(offers, 'offers', [])].map(([, v]) => v);
  const faq = FAQ.zh.map(({ a }) => a);
  for (const v of [...all, ...faq]) {
    expect(v).not.toMatch(
      /《底土法》|手工采矿|个体小规模采矿|前苏联|千立方米|公斤/
    );
  }
});

it('localizes the mineral hub title for zh only', () => {
  expect(translate('zh', 'minerals.hubTitle', { mineral: '金' })).toBe(
    '哈萨克斯坦金矿区'
  );
  expect(translate('ru', 'minerals.hubTitle', { mineral: 'Золото' })).toBe(
    `Золото · ${translate('ru', 'leadDetail.breadcrumbLeads')}`
  );
  expect(translate('kz', 'minerals.hubTitle', { mineral: 'Алтын' })).toBe(
    `Алтын · ${translate('kz', 'leadDetail.breadcrumbLeads')}`
  );
  expect(translate('en', 'minerals.hubTitle', { mineral: 'Gold' })).toBe(
    `Gold · ${translate('en', 'leadDetail.breadcrumbLeads')}`
  );
});

it('names Almaty as the office city in every locale', () => {
  expect(translate('ru', 'footerNav.bottom.city')).toBe('Алматы, Казахстан');
  expect(translate('kz', 'footerNav.bottom.city')).toBe('Алматы, Қазақстан');
  expect(translate('en', 'footerNav.bottom.city')).toBe('Almaty, Kazakhstan');
  expect(translate('zh', 'footerNav.bottom.city')).toBe('哈萨克斯坦阿拉木图');
});

it('states in every FAQ that the subsoil belongs to the state', () => {
  expect(FAQ.ru[1].a).toMatch(/^Недра принадлежат государству\./);
  expect(FAQ.kz[1].a).toMatch(/^Жер қойнауы мемлекетке тиесілі\./);
  expect(FAQ.en[1].a).toMatch(/^The subsoil belongs to the state\./);
  expect(FAQ.zh[1].a).toMatch(/^底土归国家所有。/);
});
