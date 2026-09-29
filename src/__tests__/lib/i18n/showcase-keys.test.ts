import { translate } from '@/lib/i18n/translations';

const KEYS = [
  'showcase.rightsChecked',
  'showcase.disclaimer',
  'showcase.disclaimerLabel',
  'showcase.whatsappCta',
  'showcase.wechatCta',
  'showcase.more',
  'showcase.overviewLabel',
  'showcase.overviewCaption',
  'showcase.cardMapLabel',
  'showcase.cardMapCaption',
  'showcase.detailMapCaption',
  'showcase.scansHeading',
  'showcase.openScan',
  'showcase.rightsHeading',
  'showcase.contactHeading',
  'showcase.contactNote',
  'showcase.mapCredit',
  'showcase.seoTitle',
  'showcase.seoDescription',
];

describe.each(['ru', 'kz', 'en', 'zh'])('%s showcase copy', (locale) => {
  it.each(KEYS)('%s is translated', (key) => {
    const value = translate(locale, key);
    expect(value).not.toBe(key);
    expect(value.trim().length).toBeGreaterThan(0);
  });
});

it('keeps the Russian disclaimer verbatim from the geobase contract', () => {
  expect(translate('ru', 'showcase.disclaimer')).toBe(
    'Карточки подготовлены нашими геологами по фондовым геологическим отчётам. Числа приведены так, как они записаны в отчёте, с указанием типа значения (максимум отдельной пробы, среднее, прогнозные ресурсы и т. п.); это не запасы, подсчитанные по современным стандартам. Статус прав — наша проверка по публичной карте недропользования на указанную дату, не выписка и не юридическое заключение. Место объекта показано условно: он находится внутри круга, центр круга с объектом не совпадает. Витрина не является публичной офертой. Материалы по объекту — после встречи.'
  );
});

it('prints the rights date with the "not an extract" caveat', () => {
  expect(
    translate('ru', 'showcase.rightsChecked', { date: '28.09.2026' })
  ).toBe('Проверено 28.09.2026, не выписка.');
});
