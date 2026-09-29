// Synthetic card for tests only. Never put real showcase data in the repo:
// it is public, and git history would keep withdrawn cards forever.
import type { Showcase } from '@/lib/leads/showcase';

export const fakeShowcase: Showcase = {
  package: 'qaznedr-showcase-v1',
  card_id: 'QN-99',
  commodity: ['Au', 'Cu'],
  oblast: { ru: 'Карагандинская область', en: 'Karaganda Region' },
  zone: { center_lat: 48.5, center_lon: 70.0, radius_km: 50 },
  headline: {
    ru: 'Максимум в отдельной пробе: золото до 9,9 г/т',
    en: 'Maximum in a single sample: gold up to 9.9 g/t',
  },
  headline_type: 'spike',
  object_type: { ru: 'рудопроявление', en: 'ore occurrence' },
  facts: {
    ru: [
      'В остальных пробах — не более 1,0 г/т',
      'Автор отчёта оценил объект отрицательно — по кондициям и экономике своего времени',
    ],
    en: [
      'In the other samples — no more than 1.0 g/t',
      "The report's author assessed the object negatively — by the cut-off standards and economics of that time",
    ],
  },
  source: {
    ru: 'Источник: фондовый геологический отчёт (скан в нашем архиве)',
  },
  images: [
    {
      url: 'https://example.supabase.co/storage/v1/object/public/showcase/v1/img/QN-98_1.webp',
      caption: { ru: 'Фрагмент архивного отчёта, названия скрыты' },
      width: 1200,
      height: 300,
      v: 'aaaaaaaaaaaa',
    },
    {
      url: 'https://example.supabase.co/storage/v1/object/public/showcase/v1/img/QN-99_1.webp',
      caption: { ru: 'Фрагмент архивного отчёта, названия скрыты' },
      width: 1000,
      height: 250,
      v: 'bbbbbbbbbbbb',
    },
  ],
  rights: {
    status: {
      ru: 'Свободен от лицензий на разведку и добычу (наша проверка по карте)',
    },
    checked_at: '2026-09-28',
  },
  whatsapp_text: {
    ru: 'Здравствуйте! Интересует карточка QN-99 с сайта qaznedr.kz.',
  },
};

export const contacts = {
  whatsappNumber: '77001234567',
  wechatId: 'qaznedr',
  wechatQrSrc: null,
  email: null,
};
