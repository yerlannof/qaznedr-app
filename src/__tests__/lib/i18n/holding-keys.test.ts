import { translate } from '@/lib/i18n/translations';

const SEO_PAGES = [
  'site',
  'home',
  'leads',
  'services',
  'servicesGeological',
  'servicesLegal',
  'servicesInvestors',
  'about',
  'contact',
  'faq',
  'support',
  'terms',
  'blog',
  'education',
  'knowledge',
  'news',
];

const SEO_KEYS = [
  ...SEO_PAGES.flatMap((p) => [`seo.${p}.title`, `seo.${p}.description`]),
  'seo.lead.title',
  'seo.lead.descriptionFree',
  'seo.lead.descriptionOther',
  'seo.lead.where',
  'seo.lead.notFound',
];

const NAV_KEYS = [
  'navigation.home',
  'navigation.about',
  'navigation.contact',
  'navigation.admin',
];

const CONTACT_KEYS = [
  'contact.title',
  'contact.subtitle',
  'contact.wechatHint',
  'contact.wechatQrAlt',
  'contact.copy',
  'contact.copied',
  'contact.whatsappCta',
  'contact.formTitle',
  'contact.whatsappTextLead',
  'contact.whatsappTextGeneral',
  'contact.discussHeading',
  'contact.discussNote',
  'contact.orForm',
];

const INQUIRY_KEYS = [
  'inquiry.nameLabel',
  'inquiry.companyLabel',
  'inquiry.countryLabel',
  'inquiry.channelLabel',
  'inquiry.contactLabel',
  'inquiry.messageLabel',
  'inquiry.messagePlaceholder',
  'inquiry.submit',
  'inquiry.sending',
  'inquiry.successTitle',
  'inquiry.successText',
  'inquiry.error',
  'inquiry.rateLimited',
  'inquiry.invalid',
  'inquiry.optional',
];

// Later tasks append their namespaces here.
const KEYS: string[] = [
  ...SEO_KEYS,
  ...NAV_KEYS,
  ...CONTACT_KEYS,
  ...INQUIRY_KEYS,
];

describe.each(['ru', 'kz', 'en', 'zh'])('%s holding translations', (locale) => {
  it.each(KEYS)('%s exists', (key) => {
    expect(translate(locale, key)).not.toBe(key);
  });

  if (locale !== 'ru') {
    it.each(KEYS)('%s is translated (differs from ru)', (key) => {
      expect(translate(locale, key)).not.toBe(translate('ru', key));
    });
  }
});
