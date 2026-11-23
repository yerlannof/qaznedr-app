import type { Locale } from '@/lib/seo/site';
import type { PrivacyContent } from './privacy';

// Pilot edition for the browser extension "Qaznedr — block geology" (T-0220, 23.11.2026).
// Kept out of search; the lawyer reviews it before the public store listing.
const RU: PrivacyContent = {
  lang: 'ru',
  eyebrow: 'Расширение для браузера',
  heading: 'Qaznedr — геология блока: конфиденциальность',
  updated: 'Редакция пилота от 23 ноября 2026 года',
  sections: [
    {
      heading: 'Что делает расширение',
      body: [
        'Рядом с публичной картой недропользования показывает сводку по блоку из обработанных нами советских геологических отчётов: сколько объектов в блоке и в 5 км вокруг (вилкой), какие полезные ископаемые, высшую стадию изученности и число отчётов фонда по листу. Названий, координат и содержаний в сводке нет.',
        'Расширение выпускает ТОО «QAZNEDR HOLDING». Оно не связано с порталом e-qazyna, его оператором и Министерством. Сведения о правах на недра оно не показывает: права смотрите на самой карте.',
      ],
    },
    {
      heading: 'Что расширение читает на странице',
      body: [
        'Только на страницах публичной карты (адреса вида …/contracts-map) и только в момент вашего клика по карте: текст плашки с координатой курсора, которую показывает сама карта. Номер блока считается в вашем браузере.',
        'Кабинет недропользователя, страницы входа, ЭЦП, заявок и любые другие сайты расширение не открывает и не читает. Запросов к серверам e-qazyna расширение не делает, сетевые запросы страницы не перехватывает, cookies не читает.',
      ],
    },
    {
      heading: 'Что уходит на наш сервер',
      body: [
        'Номер блока. Координата клика, адрес страницы, ваше имя, ЭЦП, БИН и любые данные кабинета не передаются.',
        'Ключ доступа. В закрытом пилоте мы выдаём ключ каждому участнику лично, поэтому видим, какие блоки смотрели по его ключу. Эти сведения остаются внутри QAZNEDR. Удалите расширение — ключ на устройстве удалится.',
        'Отпечаток браузера: хеш от версии браузера, языка, часового пояса и числа ядер процессора. Он не узнаёт человека, а нужен, чтобы лимит не сбрасывался переустановкой.',
        'Сеть, из которой пришёл запрос. Мы храним не адрес, а хеш сети (/24) с солью, которая меняется каждые сутки. Через двое суток и этот хеш стирается.',
      ],
    },
    {
      heading: 'Зачем',
      body: [
        'В пилоте расширение показывает 5 новых блоков в сутки. Ключ, отпечаток и хеш сети нужны, чтобы этот лимит нельзя было обойти многими установками и чтобы базу нельзя было выкачать.',
        'Сводка спроса: какие блоки и районы смотрят. Наружу, в том числе государственным органам и партнёрам, мы даём только сводку по блокам, которые смотрели не меньше трёх разных установок. Интерес конкретного человека к блоку мы считаем его коммерческой тайной, не раскрываем и не продаём.',
      ],
    },
    {
      heading: 'Сроки и хранение',
      body: [
        'Просмотры (номер блока, время, хеш ключа и отпечатка) хранятся 12 месяцев, хеш сети — двое суток. Данные хранятся у наших подрядчиков хостинга (Vercel, Supabase), доступ только у QAZNEDR.',
        'Удалить свои просмотры можно по запросу через страницу контактов.',
      ],
    },
  ],
};

const EN: PrivacyContent = {
  lang: 'en',
  eyebrow: 'Browser extension',
  heading: 'Qaznedr — block geology: privacy',
  updated: 'Pilot edition, 23 November 2026',
  sections: [
    {
      heading: 'What the extension does',
      body: [
        'Next to the public subsoil-use map it shows a summary for a block taken from Soviet geological reports we have processed: how many objects lie in the block and within 5 km (as a range), which commodities, the highest stage of study and how many archive reports cover the sheet. No names, coordinates or grades.',
        'The extension is published by QAZNEDR HOLDING LLP. It is not affiliated with the e-qazyna portal, its operator or the Ministry. It does not show subsoil rights; see the map itself for those.',
      ],
    },
    {
      heading: 'What it reads on the page',
      body: [
        'Only on the public map pages (…/contracts-map) and only when you click the map: the cursor-coordinate label the map itself shows. The block number is computed in your browser.',
        'It does not open or read the subsoil user cabinet, sign-in, digital signature or application pages, or any other site. It sends no requests to e-qazyna servers, does not intercept the page’s network traffic and does not read cookies.',
      ],
    },
    {
      heading: 'What reaches our server',
      body: [
        'The block number. The click coordinate, page address, your name, digital signature, company ID and any cabinet data are not sent.',
        'An access key. In the closed pilot we issue a key to each participant personally, so we can see which blocks were viewed with that key. This stays inside QAZNEDR. Removing the extension removes the key from the device.',
        'A browser fingerprint: a hash of browser version, language, time zone and CPU core count. It does not identify a person; it stops the daily limit from resetting on reinstall.',
        'The network the request came from, stored only as a hash of the /24 network with a salt that changes every day; the hash itself is erased after two days.',
      ],
    },
    {
      heading: 'Why',
      body: [
        'During the pilot the extension shows 5 new blocks a day. The key, fingerprint and network hash keep that limit from being bypassed with many installs and keep the database from being scraped.',
        'Demand statistics: which blocks and districts people look at. Outside QAZNEDR, including to government bodies and partners, we share only blocks viewed by at least three different installs. A person’s interest in a block is treated as their trade secret; we do not disclose or sell it.',
      ],
    },
    {
      heading: 'Retention and storage',
      body: [
        'Views (block number, time, hashes of key and fingerprint) are kept for 12 months; the network hash for two days. Data are stored with our hosting providers (Vercel, Supabase); only QAZNEDR has access.',
        'To delete your views, write to us via the contact page.',
      ],
    },
  ],
};

export function extensionPrivacyFor(locale: Locale): PrivacyContent {
  return locale === 'en' || locale === 'zh' ? EN : RU;
}
