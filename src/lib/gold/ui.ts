// UI words of the gold showcase. Cards themselves are Russian (APPSALE export); the frame is RU for ru/kz and EN
// for en/zh (an English frame reads better for Chinese guests than a Russian one).
const RU = {
  title: 'Золото — витрина объектов',
  lead: 'Советские паспорта и отчёты по золоту: регион, тип, главная цифра, права. Название, лист и точка — после покупки.',
  mapTitle: 'Карта квадратами ~100 км: число карточек в квадрате',
  mapNote:
    'Квадрат — ячейка сетки 1° × 1,4°, а не место объекта. Точки нет до покупки.',
  all: 'Все',
  level: 'Уровень',
  cards: (n: number) =>
    `${n} карточ${n % 10 === 1 && n % 100 !== 11 ? 'ка' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'ки' : 'ек'}`,
  code: 'Код',
  region: 'Регион',
  type: 'Тип',
  main: 'Главная цифра',
  rights: 'Права',
  price: 'Цена',
  rightsAsOf: (d: string) => `права по e-qazyna на ${d}`,
  rightsStale: (d: string) => `права не перепроверялись после ${d}`,
  noSquare: 'место уточняется — на карте нет',
  sold: (n: number) => `уже продана: ${n}`,
  clear: 'Сбросить фильтр',
  inSquare: 'Карточки в выбранном квадрате',
  open: 'Открыть',
  buy: 'Купить',
  exclusive: 'Хочу эксклюзив',
  buyHint:
    'Заявка → счёт ТОО «Qaznedr Holding» → после оплаты открываем полную карточку в вашем кабинете (обычно в течение рабочего дня). Онлайн-оплаты нет.',
  exclusiveHint:
    'Эксклюзив: карточку продаём одному покупателю, после сделки снимаем с витрины. Цену называем отдельно.',
  phone: 'Телефон или WhatsApp',
  message: 'Комментарий (необязательно)',
  send: 'Отправить заявку',
  sent: 'Заявка принята. Мы свяжемся с вами и пришлём счёт.',
  failed: 'Не получилось отправить. Попробуйте ещё раз или напишите нам.',
  paidTitle: 'Полная карточка',
  paidLocked:
    'Полная карточка (название, лист, координата каталога, запасы, источники, кроп скана) открывается после оплаты.',
  back: '← Вся витрина',
  preliminary: 'предварительно',
};
type Dict = typeof RU;
const EN: Dict = {
  title: 'Gold — object showcase',
  lead: 'Soviet passports and reports on gold: region, type, headline figure, rights. Name, map sheet and point come after purchase.',
  mapTitle: 'Map in ~100 km squares: number of cards per square',
  mapNote:
    'A square is a 1° × 1.4° grid cell, not the object location. No point before purchase.',
  all: 'All',
  level: 'Level',
  cards: (n: number) => `${n} card${n === 1 ? '' : 's'}`,
  code: 'Code',
  region: 'Region',
  type: 'Type',
  main: 'Headline figure',
  rights: 'Rights',
  price: 'Price',
  rightsAsOf: (d: string) => `rights per e-qazyna as of ${d}`,
  rightsStale: (d: string) => `rights not rechecked since ${d}`,
  noSquare: 'location being clarified — not on the map',
  sold: (n: number) => `already sold: ${n}`,
  clear: 'Clear filter',
  inSquare: 'Cards in the selected square',
  open: 'Open',
  buy: 'Buy',
  exclusive: 'I want exclusivity',
  buyHint:
    'Request → invoice from Qaznedr Holding LLP → after payment we open the full card in your account (usually within a business day). No online payment.',
  exclusiveHint:
    'Exclusive: the card is sold to one buyer and taken off the showcase after the deal. Price is quoted separately.',
  phone: 'Phone or WhatsApp',
  message: 'Comment (optional)',
  send: 'Send request',
  sent: 'Request received. We will contact you and send the invoice.',
  failed: 'Could not send. Try again or write to us.',
  paidTitle: 'Full card',
  paidLocked:
    'The full card (name, map sheet, catalogue coordinate, reserves, sources, scan crop) opens after payment.',
  back: '← Whole showcase',
  preliminary: 'preliminary',
};

export type GoldUi = Dict;
export function goldUi(locale: string): GoldUi {
  return locale === 'en' || locale === 'zh' ? EN : RU;
}

/** 2026-11-28 → 28.11.2026 */
export function dmy(iso: string): string {
  const [y, m, d] = (iso || '').split('-');
  return y && m && d ? `${d}.${m}.${y}` : iso;
}

/** $2 000 */
export function usd(n: number): string {
  return `$${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
}
