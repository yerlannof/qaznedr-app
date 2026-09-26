# Session 2 — Safe Copy, Channels and Indexing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old "marketplace / data package" copy with holding copy, harden the Phase 1 leftovers, deploy, and submit the site to Google, Yandex and Bing.

**Architecture:** Copy lives in `src/lib/i18n/translations.ts` (4 locales) for the home page and the lead teaser; FAQ, terms and About are ru-only page files. A new `DealSteps` component is shared by home and About. A pure `primaryContactCta()` in `src/lib/config/contacts.ts` picks the hero's main button. A single guard test blocks forbidden phrases from coming back.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind v3, Jest + Testing Library, zod, bcryptjs, NextAuth v4, Supabase.

**Spec:** `docs/superpowers/specs/2026-09-26-session2-channels-copy-design.md` (read §4 for the approved copy).

## Global Constraints

- Red lines: never imply the holding owns an area; never say we sell archive reports or data; "free" = "per our check on <date>"; reserves always with standard (ГКЗ СССР A/B/C1/C2 or historical estimate), P1–P3 = forecast; no "guaranteed returns"; no OCR/AI/models.
- Design system: gold-on-ink, `font-serif font-light tracking-tight` headings, bordered cards `border rounded-xl`, primary buttons black/gold as existing, no emoji, Lucide icons only, no new gradients.
- One `h1` per page, then h2 → h3.
- `LEADS_BULK_CHECK = '2026-05'` is the fallback check date while `leads.last_verified` is empty.
- Registry figure: 7 152 ore objects.
- Do not touch `docs/design/` (Codex's uncommitted work).
- Deploy = `git push origin master` after `npm run build` and `npm test` (no `vercel --prod`).
- Pre-existing failing legacy test suites (5–6) are not fixed; no new failures allowed.

## Review Focus

1. A Chinese visitor on `/zh` presses the main hero button → lands on the WeChat QR (`/zh/contact`), never on a WhatsApp link — pinned in Task 3 (`primaryContactCta` tests).
2. A lead whose `last_verified` is an ISO timestamp or garbage → teaser and meta description still show a readable date (the value's month or the May 2026 fallback), never "Invalid Date" — pinned in Task 2.
3. An old bookmark `/ru/support` or `/en/services/investors/x` → 308 to `/{l}/contact`, and neither appears in `sitemap.xml` — pinned in Task 1.
4. Someone hammers the admin login with the owner's email from one IP → the owner can still log in from another IP — pinned in Task 8.
5. `ContactChannels` with no channels configured → the teaser shows "Оставить заявку", not "Или оставьте заявку" under an empty block — pinned in Task 6.

---

### Task 1: Hide `/support` and `/services/investors`; clean `/services`

**Files:**
- Modify: `src/lib/seo/pages.ts`
- Modify: `src/app/[locale]/services/page.tsx`
- Test: `src/__tests__/lib/seo/pages.test.ts`

**Interfaces:**
- Produces: `hiddenRouteRedirect('/ru/support') === '/ru/contact'`, `hiddenRouteRedirect('/en/services/investors/x') === '/en/contact'`; `PUBLIC_PAGES` no longer contains `/support` or `/services/investors`.

- [ ] **Step 1: Write the failing test** — append to `src/__tests__/lib/seo/pages.test.ts`:

```ts
describe('session 2 hidden routes', () => {
  it('redirects support and the investors directory to contact', () => {
    expect(hiddenRouteRedirect('/ru/support')).toBe('/ru/contact');
    expect(hiddenRouteRedirect('/en/services/investors')).toBe('/en/contact');
    expect(hiddenRouteRedirect('/en/services/investors/x')).toBe('/en/contact');
    expect(hiddenRouteRedirect('/ru/services')).toBeNull();
    expect(hiddenRouteRedirect('/ru/services/legal')).toBeNull();
  });

  it('keeps them out of the sitemap', () => {
    expect(PUBLIC_PAGES).not.toContain('/support');
    expect(PUBLIC_PAGES).not.toContain('/services/investors');
  });
});
```

(Import `PUBLIC_PAGES, hiddenRouteRedirect` from `@/lib/seo/pages` if not already imported.)

- [ ] **Step 2: Run to verify it fails** — `npx jest src/__tests__/lib/seo/pages.test.ts` → FAIL (`null` instead of `/ru/contact`).

- [ ] **Step 3: Implement** — in `src/lib/seo/pages.ts`:
  - remove `'/services/investors'` and `'/support'` from `PUBLIC_PAGES`;
  - add two entries to `HIDDEN_ROUTE_REDIRECTS`:

```ts
    ['/support', '/contact'],
    ['/services/investors', '/contact'],
```

In `src/app/[locale]/services/page.tsx`:
- delete the `investors` object from `serviceCategories`;
- drop `Users` from the lucide import;
- delete the `faqJsonLd` constant and its `<script type="application/ld+json">` element. Its questions were not visible on the page and invited visitors to register and post listings.

- [ ] **Step 4: Run** — `npx jest src/__tests__/lib/seo src/__tests__/app` → PASS (no-hidden-links must stay green too).

- [ ] **Step 5: Commit** — `git add src/lib/seo/pages.ts "src/app/[locale]/services/page.tsx" src/__tests__/lib/seo/pages.test.ts && git commit -m "feat(nav): hide support and investors directory, drop fake services FAQ schema"`

---

### Task 2: Page titles and the check date

**Files:**
- Modify: `src/lib/seo/metadata.ts`
- Create: `src/lib/leads/check-date.ts`
- Modify: `src/lib/seo/lead-metadata.ts`
- Test: `src/__tests__/lib/seo/metadata.test.ts`, `src/__tests__/lib/seo/lead-metadata.test.ts`, `src/__tests__/lib/leads/check-date.test.ts`

**Interfaces:**
- Produces:
  - `formatCheckDate(value: string | null | undefined, locale: Locale): string`;
  - `LEADS_BULK_CHECK = '2026-05'`;
  - `LeadSeoInput` gains `last_verified?: string | null`;
  - `buildPageMetadata` now always returns `title: { absolute: string }`.

- [ ] **Step 1: Write failing tests.**

`src/__tests__/lib/leads/check-date.test.ts`:

```ts
import { formatCheckDate, LEADS_BULK_CHECK } from '@/lib/leads/check-date';

describe('formatCheckDate', () => {
  it('falls back to the bulk check month', () => {
    expect(LEADS_BULK_CHECK).toBe('2026-05');
    expect(formatCheckDate(null, 'ru')).toBe('05.2026');
    expect(formatCheckDate(undefined, 'kz')).toBe('05.2026');
    expect(formatCheckDate('', 'en')).toBe('May 2026');
    expect(formatCheckDate(null, 'zh')).toBe('2026年5月');
  });

  it('formats a real date and an ISO timestamp', () => {
    expect(formatCheckDate('2026-07-15', 'ru')).toBe('15.07.2026');
    expect(formatCheckDate('2026-07-15T10:00:00Z', 'en')).toBe('15 July 2026');
    expect(formatCheckDate('2026-07-15', 'zh')).toBe('2026年7月15日');
  });

  it('ignores garbage', () => {
    expect(formatCheckDate('май 2026', 'ru')).toBe('05.2026');
    expect(formatCheckDate('2026-13-40', 'ru')).toBe('05.2026');
  });
});
```

Append to `src/__tests__/lib/seo/lead-metadata.test.ts`:

```ts
describe('lead description check date', () => {
  it('states the check date for a free lead', () => {
    const { description } = leadSeoText(
      { code: 'AU-4', mineral: 'Au', region: 'Жамбылская', license_status: 'FREE_CONFIRMED', last_verified: null },
      'ru'
    );
    expect(description).toContain('по нашей проверке на 05.2026');
    expect(description).not.toMatch(/портфел/i);
  });

  it('never claims ownership for a non-free lead', () => {
    const { description } = leadSeoText(
      { code: 'AU-9', mineral: 'Au', region: null, license_status: 'PENDING' },
      'en'
    );
    expect(description).not.toMatch(/portfolio/i);
  });
});
```

In `src/__tests__/lib/seo/metadata.test.ts`, change the expectations of the branded-title test to:

```ts
    expect(m.title).toEqual({ absolute: 'About | QAZNEDR HOLDING' });
```

and add:

```ts
  it('does not repeat the brand', () => {
    const m = buildPageMetadata({ locale: 'ru', path: '/about', title: 'О компании QAZNEDR HOLDING', description: 'd' });
    expect(m.title).toEqual({ absolute: 'О компании QAZNEDR HOLDING' });
  });
```

- [ ] **Step 2: Run** — `npx jest src/__tests__/lib/seo src/__tests__/lib/leads` → FAIL (module missing, title is a plain string).

- [ ] **Step 3: Implement.**

`src/lib/leads/check-date.ts`:

```ts
import type { Locale } from '@/lib/seo/site';

/** Month of the last bulk licence-status check of the published leads. */
export const LEADS_BULK_CHECK = '2026-05';

const DATE = /^(\d{4})-(\d{2})(?:-(\d{2}))?/;

function parts(value: string | null | undefined) {
  const m = DATE.exec(value ?? '');
  const month = m ? Number(m[2]) : 0;
  const day = m?.[3] ? Number(m[3]) : 0;
  if (m && month >= 1 && month <= 12 && day <= 31) {
    return { y: m[1], m: m[2], d: m[3] };
  }
  const [y, mo] = LEADS_BULK_CHECK.split('-');
  return { y, m: mo, d: undefined as string | undefined };
}

/** "Free per our check on <date>" — the lead's own date or the bulk check month. */
export function formatCheckDate(value: string | null | undefined, locale: Locale): string {
  const { y, m, d } = parts(value);
  if (locale === 'zh') return d ? `${y}年${Number(m)}月${Number(d)}日` : `${y}年${Number(m)}月`;
  if (locale === 'en') {
    const month = new Date(Date.UTC(Number(y), Number(m) - 1, 1)).toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
    return d ? `${Number(d)} ${month} ${y}` : `${month} ${y}`;
  }
  return d ? `${d}.${m}.${y}` : `${m}.${y}`;
}
```

`src/lib/seo/lead-metadata.ts`:
- add `last_verified?: string | null;` to `LeadSeoInput`;
- import `formatCheckDate`;
- set `const params = { mineral, where, code: lead.code, checked: formatCheckDate(lead.last_verified, locale) };`.

`src/lib/seo/metadata.ts`, in `buildPageMetadata`:

```ts
  const fullTitle =
    input.absoluteTitle || input.title.includes(SITE_NAME)
      ? input.title
      : `${input.title} | ${SITE_NAME}`;
  return {
    // Absolute on purpose: nested layouts that set their own title drop the
    // root "%s | QAZNEDR HOLDING" template, so the suffix is added here.
    title: { absolute: fullTitle },
```

Keep the rest of the function unchanged.

Update `seo.lead.descriptionFree` / `descriptionOther` / `seo.leads.description` in `translations.ts` (4 locales):

| key | ru | kz | en | zh |
| --- | --- | --- | --- | --- |
| seo.lead.descriptionFree | Участок: {mineral}, {where}. Свободен от лицензий по нашей проверке на {checked}; геология изучена по архивным отчётам, лицензию оформим под сделку. Код {code}. | Учаске: {mineral}, {where}. Біздің тексеруімізше ({checked}) лицензиядан бос; геологиясы архивтік есептер бойынша зерттелген, лицензияны мәміле үшін рәсімдейміз. Код {code}. | Area: {mineral}, {where}. Free of licences per our check as of {checked}; geology studied from archival reports, the licence can be arranged for the deal. Code {code}. | 哈萨克斯坦{where}{mineral}矿区，经我方核查（{checked}）目前无矿权（空白区），已基于地质档案完成研究，可为交易协助办理探矿权。项目编号 {code}。 |
| seo.lead.descriptionOther | {mineral}, {where}. Геология изучена нашими геологами по архивным отчётам. Код {code}. | {mineral}, {where}. Геологиясын геологтарымыз архивтік есептер бойынша зерттеді. Код {code}. | {mineral}, {where}. Geology studied by our geologists from archival reports. Code {code}. | 哈萨克斯坦{where}{mineral}矿项目，地质情况由我方地质师依据档案报告研究。项目编号 {code}。 |
| seo.leads.description | Подготовленные свободные рудные участки Казахстана. В тизере: металл, регион, тип месторождения, содержание. Детали — после встречи и NDA. | Қазақстанның дайындалған бос кен учаскелері. Тизерде: металл, өңір, кен орнының түрі, құрамы. Толық деректер кездесу мен NDA-дан кейін. | Prepared free ore areas in Kazakhstan. The teaser shows metal, region, deposit type and grade; full details after a meeting and an NDA. | (unchanged) |

- [ ] **Step 4: Run** — `npx jest src/__tests__/lib/seo src/__tests__/lib/leads src/__tests__/lib/i18n` → PASS.

- [ ] **Step 5: Commit** — `git commit -am "feat(seo): brand suffix on every page, dated 'free per our check' in lead descriptions"` (plus `git add` for the new files).

---

### Task 3: Home page — hero, stats, `DealSteps`, showcase copy

**Files:**
- Modify: `src/lib/config/contacts.ts`
- Create: `src/components/features/DealSteps.tsx`
- Modify: `src/components/features/PortalWelcomeHero.tsx`
- Modify: `src/components/features/HomePageContent.tsx`
- Modify: `src/lib/i18n/translations.ts` (namespaces `portal`, `dealSteps` (new), `leadsHero`, `leadsCatalog`, `navigation.leads`, `footerNav`, `footer.company`, `leadDetail.breadcrumbLeads`)
- Test: `src/__tests__/lib/config/contacts.test.ts`, `src/__tests__/lib/i18n/holding-keys.test.ts`

**Interfaces:**
- Produces:
  - `hasAnyChannel(config: ContactConfig): boolean`;
  - `primaryContactCta(locale: string, config: ContactConfig): { kind: 'whatsapp' | 'wechat' | 'contact'; href: string }`. `href` for whatsapp is a `wa.me` URL built with `whatsappLink(number, translate(locale, 'contact.whatsappTextGeneral'))`; otherwise `/${locale}/contact`;
  - `<DealSteps locale={string} />`.

- [ ] **Step 1: Failing tests** — append to `src/__tests__/lib/config/contacts.test.ts`:

```ts
import { hasAnyChannel, normalizeContactConfig, primaryContactCta } from '@/lib/config/contacts';

const full = normalizeContactConfig({ whatsapp: '+7 747 554 0189', wechatQr: '/contacts/wechat-qr.png' });
const none = normalizeContactConfig({});
const waOnly = normalizeContactConfig({ whatsapp: '77475540189' });

describe('primaryContactCta', () => {
  it('sends Chinese visitors to the WeChat QR', () => {
    expect(primaryContactCta('zh', full)).toEqual({ kind: 'wechat', href: '/zh/contact' });
  });
  it('opens WhatsApp for other locales', () => {
    const cta = primaryContactCta('ru', full);
    expect(cta.kind).toBe('whatsapp');
    expect(cta.href).toMatch(/^https:\/\/wa\.me\/77475540189\?text=/);
  });
  it('falls back to WhatsApp for zh without WeChat, then to the contact page', () => {
    expect(primaryContactCta('zh', waOnly).kind).toBe('whatsapp');
    expect(primaryContactCta('en', none)).toEqual({ kind: 'contact', href: '/en/contact' });
  });
});

describe('hasAnyChannel', () => {
  it('is false only when nothing is configured', () => {
    expect(hasAnyChannel(none)).toBe(false);
    expect(hasAnyChannel(waOnly)).toBe(true);
  });
});
```

In `holding-keys.test.ts` add, and include in `KEYS`:

```ts
const HOME_KEYS = [
  'portal.eyebrow', 'portal.headlineLine1', 'portal.headlineEmphasis', 'portal.headlineLine2',
  'portal.subtitle', 'portal.ctaWhatsapp', 'portal.ctaWechat', 'portal.ctaContact', 'portal.ctaLeads',
  'portal.statsLive', 'portal.statsLeadsLabel', 'portal.statsRegistryLabel', 'portal.statsRegionsLabel',
  'portal.statsCaption',
  ...['verified', 'archive', 'gates', 'discipline'].flatMap((k) => [`portal.trust.${k}Title`, `portal.trust.${k}Desc`]),
  'dealSteps.title',
  ...[1, 2, 3, 4].flatMap((n) => [`dealSteps.step${n}Title`, `dealSteps.step${n}Desc`]),
  'leadsHero.eyebrow', 'leadsHero.title', 'leadsHero.subtitle',
  'navigation.leads',
];
```

- [ ] **Step 2: Run** — `npx jest src/__tests__/lib/config src/__tests__/lib/i18n` → FAIL.

- [ ] **Step 3: Implement `contacts.ts` additions:**

```ts
import { translate } from '@/lib/i18n/translations';

export function hasAnyChannel(c: ContactConfig): boolean {
  return Boolean(c.whatsappNumber || c.wechatId || c.wechatQrSrc || c.email);
}

/** The hero's main button: WeChat QR for zh, WhatsApp elsewhere, else the contact page. */
export function primaryContactCta(
  locale: string,
  c: ContactConfig
): { kind: 'whatsapp' | 'wechat' | 'contact'; href: string } {
  const contact = `/${locale}/contact`;
  if (locale === 'zh' && (c.wechatQrSrc || c.wechatId)) return { kind: 'wechat', href: contact };
  if (c.whatsappNumber) {
    return {
      kind: 'whatsapp',
      href: whatsappLink(c.whatsappNumber, translate(locale, 'contact.whatsappTextGeneral')),
    };
  }
  return { kind: 'contact', href: contact };
}
```

- [ ] **Step 4: Translations** — replace or add these values. Keep the other keys of each namespace (e.g. `portal.ctaListings`, `statsListingsLabel`), since they are unused but harmless.

**portal**

| key | ru | kz | en | zh |
| --- | --- | --- | --- | --- |
| eyebrow | QAZNEDR HOLDING · геология и недропользование Казахстана | QAZNEDR HOLDING · Қазақстан геологиясы және жер қойнауын пайдалану | QAZNEDR HOLDING · Kazakhstan geology and subsoil use | QAZNEDR HOLDING · 哈萨克斯坦地质与矿业权 |
| headlineLine1 | Подготовленные рудные участки | Қазақстандағы | Prepared ore areas | 哈萨克斯坦 |
| headlineEmphasis | в Казахстане | дайындалған кен учаскелері | in Kazakhstan | 矿权投资 |
| headlineLine2 | — для инвесторов | — инвесторларға | — for investors | — 已完成前期地质研究的金属矿地块 |
| subtitle | Наши геологи изучают советские геологоразведочные отчёты и находят участки без действующей лицензии — по нашей проверке, дата указана в карточке. Лицензию оформляем под сделку. | Геологтарымыз кеңестік геологиялық барлау есептерін зерттеп, қолданыстағы лицензиясы жоқ учаскелерді табады — біздің тексеруіміз бойынша, күні карточкада көрсетілген. Лицензияны мәмілеге қарай рәсімдейміз. | Our geologists study Soviet-era exploration reports and find areas with no active licence — per our check, dated on each card. We obtain the licence for the deal. | 我方地质师依据前苏联地质勘查报告筛选地块，经我方核查未设矿业权（核查日期见地块卡片）。许可证按交易需要办理。 |
| ctaWhatsapp | Написать в WhatsApp | WhatsApp-қа жазу | Message us on WhatsApp | 通过 WhatsApp 咨询 |
| ctaWechat | Написать в WeChat | WeChat-қа жазу | Message us on WeChat | 添加微信咨询 |
| ctaContact | Связаться | Байланысу | Contact us | 联系我们 |
| ctaLeads | Смотреть участки | Учаскелерді көру | View areas | 查看地块 |
| statsLive | В цифрах | Сандармен | In numbers | 数据一览 |
| statsLeadsLabel | Участков на витрине | Витринадағы учаскелер | Areas on display | 在展地块 |
| statsRegistryLabel | Рудных объектов в нашем реестре | Біздің тізілімдегі кен объектілері | Ore objects in our registry | 我方数据库中的矿点 |
| statsRegionsLabel | Областей Казахстана | Қазақстан облыстары | Regions of Kazakhstan | 覆盖州数 |
| statsCaption | Участки на витрине — отобранная часть реестра. Реестр ведут наши геологи по фондовым геологическим отчётам. | Витринадағы учаскелер — тізілімнің іріктелген бөлігі. Тізілімді геологтарымыз қордағы геологиялық есептер бойынша жүргізеді. | Areas on display are a selected part of the registry. Our geologists maintain the registry from archival geological reports. | 在展地块是数据库中的精选部分。数据库由我方地质师依据档案地质报告建立。 |
| trust.verifiedTitle | Статус с датой | Мәртебе күнімен | Status with a date | 状态注明日期 |
| trust.verifiedDesc | Свободность проверяем по публичной карте недропользования, дата проверки — в карточке участка. | Бос екенін жер қойнауын пайдаланудың ашық картасы бойынша тексереміз, тексеру күні учаске карточкасында. | We check availability against the public subsoil-use map; the check date is on each area card. | 我方依据公开的矿业权分布图核查地块是否空白，核查日期见地块卡片。 |
| trust.archiveTitle | Работа наших геологов | Геологтарымыздың жұмысы | Our geologists' work | 我方地质师的研究 |
| trust.archiveDesc | Геологию каждого участка изучают наши геологи по фондовым отчётам. | Әр учаскенің геологиясын геологтарымыз қордағы есептер бойынша зерттейді. | Our geologists study each area using archival geological reports. | 每个地块的地质情况均由我方地质师依据档案报告研究。 |
| trust.gatesTitle | Детали под NDA | Толығы NDA-дан кейін | Details under NDA | 详情签署保密协议后提供 |
| trust.gatesDesc | Название, координаты и материалы показываем на встрече после подписания NDA. | Атауын, координаттарын және материалдарын NDA-ға қол қойылғаннан кейін кездесуде көрсетеміз. | Name, coordinates and materials are shared at a meeting after an NDA is signed. | 地块名称、坐标及资料在签署保密协议后的会面中提供。 |
| trust.disciplineTitle | Стандарт указан всегда | Стандарт әрқашан көрсетіледі | Standard always stated | 始终注明标准 |
| trust.disciplineDesc | Запасы — по категориям ГКЗ СССР (A, B, C1, C2) или как историческая оценка. P1–P3 — прогноз, а не запасы. | Қорлар КСРО МҚК санаттары (A, B, C1, C2) бойынша немесе тарихи бағалау ретінде көрсетіледі. P1–P3 — болжам, қор емес. | Reserves follow Soviet GKZ categories (A, B, C1, C2) or are marked as a historical estimate. P1–P3 are forecasts, not reserves. | 储量按前苏联国家储量委员会（ГКЗ）A、B、C1、C2 级别或历史估算标注。P1–P3 为预测资源量，并非储量。 |

**dealSteps (new namespace, add after `portal`)**

| key | ru | kz | en | zh |
| --- | --- | --- | --- | --- |
| title | Как проходит сделка | Мәміле қалай өтеді | How the deal works | 合作流程 |
| step1Title | Выберите участок | Учаскені таңдаңыз | Choose an area | 选择地块 |
| step1Desc | В карточке — металл, регион, геология и статус на дату проверки. Пришлите код участка в WeChat или WhatsApp. | Карточкада — металл, өңір, геология және тексеру күніндегі мәртебе. Учаске кодын WeChat немесе WhatsApp арқылы жіберіңіз. | Each card shows the metal, region, geology and status as of the check date. Send us the area code on WeChat or WhatsApp. | 卡片列明矿种、地区、地质情况及核查日期的状态。请通过微信或 WhatsApp 发送地块编号。 |
| step2Title | Встреча и NDA | Кездесу және NDA | Meet and sign an NDA | 会面并签署保密协议 |
| step2Desc | После подписания соглашения о конфиденциальности показываем название, координаты и оценку наших геологов. | Құпиялылық келісіміне қол қойылған соң атауын, координаттарын және геологтарымыздың бағасын көрсетеміз. | Once the confidentiality agreement is signed, we share the name, coordinates and our geologists' assessment. | 签署保密协议后，我们提供地块名称、坐标及我方地质师的评估。 |
| step3Title | Выберите формат | Форматты таңдаңыз | Choose the format | 选择合作方式 |
| step3Desc | Лицензия на вас с нашим сопровождением; лицензия на холдинг с последующей передачей; СП или earn-in; только аналитика. | Сіздің атыңызға лицензия, біздің сүйемелдеуімізбен; холдингке лицензия, кейін беру; БК немесе earn-in; тек талдау. | A licence in your name with our support; a licence obtained by the holding and then transferred; a JV or earn-in; or analytics only. | 以贵方名义办理许可证并由我方协助；先办在控股公司名下再转让；合资或 earn-in；或仅提供分析服务。 |
| step4Title | Оформляем лицензию | Лицензияны рәсімдейміз | We obtain the licence | 办理许可证 |
| step4Desc | Перепроверяем статус, подаём заявку и сопровождаем до выдачи. Решение принимает уполномоченный орган. | Мәртебені қайта тексеріп, өтінім береміз және берілгенге дейін сүйемелдейміз. Шешімді уәкілетті орган қабылдайды. | We re-check the status, file the application and support you until the licence is issued. The decision rests with the competent authority. | 我们复核状态、提交申请并协助至许可证颁发。最终由主管机关决定。 |

**leadsHero / leadsCatalog / nav / footer**

| key | ru | kz | en | zh |
| --- | --- | --- | --- | --- |
| leadsHero.eyebrow, leadsCatalog.eyebrow | Витрина участков · статус по нашей проверке | Учаскелер витринасы · мәртебе біздің тексеруімізбен | Areas on display · status per our check | 在展地块 · 状态以我方核查为准 |
| leadsHero.title | Свободные участки с изученной геологией | Геологиясы зерттелген бос учаскелер | Free areas with studied geology | 地质已研究的空白地块 |
| leadsHero.subtitle | В карточке — металл, регион, геология и статус на дату проверки. Название, координаты и материалы — после NDA. | Карточкада — металл, өңір, геология және тексеру күніндегі мәртебе. Атауы, координаттары және материалдары — NDA-дан кейін. | Each card shows the metal, region, geology and status as of the check date. Name, coordinates and materials — after an NDA. | 卡片列明矿种、地区、地质情况及核查日期的状态。名称、坐标及资料在签署保密协议后提供。 |
| leadsHero.ctaBrowse, leadsHero.freshAll | Все участки | Барлық учаскелер | All areas | 全部地块 |
| leadsHero.ctaFree | Только свободные | Тек бостары | Free only | 仅看空白地块 |
| leadsHero.freshHeading | Новые участки | Жаңа учаскелер | New areas | 最新地块 |
| leadsCatalog.title | Свободные рудные участки | Бос кен учаскелері | Free ore areas | 空白金属矿地块 |
| leadsCatalog.valueProp1 | Свободны по нашей проверке по карте недропользования; дата проверки — в карточке. | Жер қойнауын пайдалану картасы бойынша біздің тексеруімізше бос; тексеру күні карточкада. | Free per our check against the subsoil-use map; the check date is on each card. | 经我方依据矿业权分布图核查为空白地块，核查日期见卡片。 |
| leadsCatalog.valueProp2 | Геологию изучили наши геологи по фондовым отчётам. Название, координаты и материалы — после NDA. | Геологиясын геологтарымыз қордағы есептер бойынша зерттеді. Атауы, координаттары және материалдары — NDA-дан кейін. | Our geologists studied the geology from archival reports. Name, coordinates and materials — after an NDA. | 地质情况由我方地质师依据档案报告研究。名称、坐标及资料在签署保密协议后提供。 |
| leadsCatalog.typePlacer | Россыпь | Шашыранды | Placer | 砂矿 |
| leadsCatalog.emptyDesc | Оставьте запрос — сообщим, когда появятся новые участки по вашему региону или металлу. | Сұраныс қалдырыңыз — өңіріңіз немесе металыңыз бойынша жаңа учаскелер пайда болғанда хабарлаймыз. | Leave a request — we will let you know when new areas appear for your region or metal. | 留下需求 — 当您关注的地区或矿种出现新地块时，我们会通知您。 |
| navigation.leads, footerNav.platform.leads, leadDetail.breadcrumbLeads | Участки | Учаскелер | Areas | 地块 |
| footerNav.platform.title | Компания | Компания | Company | 公司 |
| footerNav.info.about | О компании | Компания туралы | About | 关于我们 |
| footer.company.name | QAZNEDR HOLDING | QAZNEDR HOLDING | QAZNEDR HOLDING | QAZNEDR HOLDING |
| footer.company.description | Геологоразведочный холдинг из Казахстана: подготовленные рудные участки и сопровождение сделок для инвесторов. | Қазақстандық геологиялық барлау холдингі: инвесторларға дайындалған кен учаскелері және мәмілені сүйемелдеу. | Kazakhstan exploration holding: prepared ore areas and deal support for investors. | 哈萨克斯坦地质勘查控股公司：为投资者提供已完成前期研究的金属矿地块及交易支持。 |

- [ ] **Step 5: `DealSteps` component** — `src/components/features/DealSteps.tsx`:

```tsx
import { translate } from '@/lib/i18n/translations';

const STEPS = [1, 2, 3, 4] as const;

// "How the deal works" — shared by the home page and About. No hooks, so it
// renders in both server pages and the client home tree.
export default function DealSteps({ locale }: { locale: string }) {
  const t = (key: string) => translate(locale, key);
  return (
    <section className="bg-white dark:bg-[#0A0A0A] border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <h2 className="font-serif font-light text-3xl lg:text-4xl tracking-tight text-gray-900 dark:text-gray-50">
          {t('dealSteps.title')}
        </h2>
        <ol className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((n) => (
            <li
              key={n}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] p-6"
            >
              <div className="font-serif text-3xl text-gold-dark dark:text-gold-light tabular-nums">
                {`0${n}`}
              </div>
              <div className="h-px w-12 bg-gold/40 my-4" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                {t(`dealSteps.step${n}Title`)}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {t(`dealSteps.step${n}Desc`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

`HomePageContent.tsx`: import `DealSteps` and render `<DealSteps locale={locale} />` between `<PortalWelcomeHero …/>` and `<LeadsHomeHero …/>`.

- [ ] **Step 6: Hero changes** — `PortalWelcomeHero.tsx`:
  - Imports: add `MessageCircle` to the lucide import, `track` from `@vercel/analytics`, `getContactConfig, primaryContactCta` from `@/lib/config/contacts`, `leadRegionName` from `@/lib/seo/lead-metadata`.
  - Constants above the component:

```ts
const REGISTRY_OBJECTS = 7152;
const NUMBER_LOCALE: Record<string, string> = { ru: 'ru-RU', kz: 'ru-RU', en: 'en-US', zh: 'zh-CN' };
```

  - State and fetch (fixes the old `pagination.total` bug: the API returns `data.total`):

```ts
  const [leadsCount, setLeadsCount] = useState(31);
  const [regionsCount, setRegionsCount] = useState(9);

  useEffect(() => {
    fetch('/api/leads?limit=100')
      .then((r) => r.json())
      .then((j) => {
        const total = Number(j?.data?.total ?? 0);
        const leads: { region?: string | null }[] = j?.data?.leads ?? [];
        const regions = new Set(
          leads.map((l) => leadRegionName(l.region, 'ru') || (l.region ?? '').trim()).filter(Boolean)
        );
        if (total > 0) setLeadsCount(total);
        if (regions.size > 0) setRegionsCount(regions.size);
      })
      .catch(() => {});
  }, []);

  const cta = primaryContactCta(locale, getContactConfig());
  const ctaLabel = t(
    cta.kind === 'whatsapp' ? 'portal.ctaWhatsapp' : cta.kind === 'wechat' ? 'portal.ctaWechat' : 'portal.ctaContact'
  );
  const registry = new Intl.NumberFormat(NUMBER_LOCALE[locale] ?? 'ru-RU').format(REGISTRY_OBJECTS);
```

  - Replace the single CTA `<Link>` block with:

```tsx
              {cta.kind === 'whatsapp' ? (
                <a
                  href={cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('click_whatsapp', { lead: '', place: 'hero' })}
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gold text-[#0A0A0A] text-sm font-semibold hover:bg-gold-light transition-colors"
                >
                  <MessageCircle aria-hidden className="w-4 h-4" />
                  {ctaLabel}
                </a>
              ) : (
                <Link
                  href={cta.href}
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gold text-[#0A0A0A] text-sm font-semibold hover:bg-gold-light transition-colors"
                >
                  <MessageCircle aria-hidden className="w-4 h-4" />
                  {ctaLabel}
                </Link>
              )}
              <Link
                href={`/${locale}/leads`}
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-gold/40 text-gold-light text-sm font-semibold hover:bg-[rgba(200,162,75,0.08)] transition-colors"
              >
                {t('portal.ctaLeads')}
                <ArrowRight aria-hidden className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
```

  - Drop `Gem` from the imports if it becomes unused.
  - Stats card: three `StatRow`s — leads, registry and regions — with the existing divider between each:

```tsx
                  <StatRow label={t('portal.statsLeadsLabel')} value={leadsCount} />
                  <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <StatRow label={t('portal.statsRegistryLabel')} value={registry} />
                  <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <StatRow label={t('portal.statsRegionsLabel')} value={regionsCount} />
```

  - Change `StatRow`'s prop type to `value: number | string`.

- [ ] **Step 7: Run** — `npx jest src/__tests__/lib src/__tests__/app` → PASS; `npx tsc --noEmit -p .` limited check via `npm run build` later.

- [ ] **Step 8: Commit** — `git add -A src/lib/config/contacts.ts src/components/features/DealSteps.tsx src/components/features/PortalWelcomeHero.tsx src/components/features/HomePageContent.tsx src/lib/i18n/translations.ts src/__tests__ && git commit -m "feat(home): holding hero with messenger CTA, registry stats and deal steps"`

---

### Task 4: Lead teaser copy and the NDA block

**Files:**
- Modify: `src/lib/i18n/translations.ts` (`leadDetail`, new `leadLocked`)
- Modify: `src/components/features/LeadLockedSection.tsx`
- Modify: `src/app/[locale]/leads/[code]/page.tsx`
- Test: `src/__tests__/lib/i18n/holding-keys.test.ts`

**Interfaces:**
- Consumes:
  - `formatCheckDate` (Task 2);
  - `hasAnyChannel` (Task 3);
  - `toLocale` from `@/lib/seo/site`.
- Produces: `<LeadLockedSection locale={string} />`.

- [ ] **Step 1: Failing test** — add to `holding-keys.test.ts` and `KEYS`:

```ts
const TEASER_KEYS = [
  'leadDetail.valueNote', 'leadDetail.freeVerified', 'leadDetail.freeRegistry', 'leadDetail.verifyDate',
  'leadDetail.howItWorksHeading',
  ...[1, 2, 3, 4].map((n) => `leadDetail.howItWorksPoint${n}`),
  'leadDetail.priceCardLabel', 'leadDetail.priceFallback', 'leadDetail.includedHeading',
  'leadDetail.includedCoords', 'leadDetail.includedAssay', 'leadDetail.includedLegal', 'leadDetail.includedContacts',
  'leadDetail.locationHidden',
  'leadLocked.heading', 'leadLocked.itemName', 'leadLocked.itemArea', 'leadLocked.itemCoords',
  'leadLocked.itemAssessment', 'leadLocked.badge', 'leadLocked.note',
];
```

Run `npx jest src/__tests__/lib/i18n` → FAIL (`includedHeading`, `leadLocked.*` missing).

- [ ] **Step 2: Translations.**

**leadDetail**

| key | ru | kz | en | zh |
| --- | --- | --- | --- | --- |
| valueNote | Цифры — из фондовых геологических отчётов, у каждой указан тип: среднее, максимальная проба или прогноз. | Сандар қордағы геологиялық есептерден алынған, әрқайсысының түрі көрсетілген: орташа, ең жоғары сынама немесе болжам. | Figures come from archival geological reports; each shows its type: average, maximum sample or forecast. | 数据来自档案地质报告，均注明类型：平均值、最高样品值或预测值。 |
| freeVerified | Свободен по нашей проверке — по координатам на карте недропользования | Біздің тексеруімізше бос — жер қойнауын пайдалану картасындағы координаттар бойынша | Free per our check — by coordinates against the subsoil-use map | 经我方核查为空白地块 — 依据坐标比对矿业权分布图 |
| freeRegistry | Свободен по нашей проверке — по реестру недропользования; перед сделкой перепроверим по координатам | Біздің тексеруімізше бос — жер қойнауын пайдалану тізілімі бойынша; мәміле алдында координаттармен қайта тексереміз | Free per our check — against the subsoil-use registry; we re-check by coordinates before a deal | 经我方核查为空白地块 — 依据矿业权登记册；交易前将按坐标复核 |
| verifyDate | Дата проверки: | Тексеру күні: | Check date: | 核查日期： |
| howItWorksHeading | Как проходит сделка | Мәміле қалай өтеді | How the deal works | 合作流程 |
| howItWorksPoint1 | Наши геологи изучили участок по фондовым отчётам. | Геологтарымыз учаскені қордағы есептер бойынша зерттеді. | Our geologists studied the area from archival reports. | 我方地质师已依据档案报告研究该地块。 |
| howItWorksPoint2 | Статус проверен по карте недропользования на дату в карточке. | Мәртебесі карточкадағы күнге жер қойнауын пайдалану картасы бойынша тексерілді. | Status checked against the subsoil-use map as of the date shown. | 状态已依据矿业权分布图核查，日期见上文。 |
| howItWorksPoint3 | На встрече после NDA показываем материалы и выбираем формат сделки. | NDA-дан кейінгі кездесуде материалдарды көрсетіп, мәміле форматын таңдаймыз. | At a meeting after an NDA we share the materials and choose the deal format. | 签署保密协议后会面，提供资料并确定合作方式。 |
| howItWorksPoint4 | Лицензию оформляем под сделку и сопровождаем до выдачи. | Лицензияны мәмілеге қарай рәсімдеп, берілгенге дейін сүйемелдейміз. | We obtain the licence for the deal and support you until it is issued. | 按交易办理许可证，并协助至颁发。 |
| priceCardLabel | Условия | Шарттар | Terms | 条件 |
| priceFallback | По договорённости | Келісім бойынша | By agreement | 价格面议 |
| includedHeading (new) | На встрече после NDA обсуждаем: | NDA-дан кейінгі кездесуде талқылаймыз: | At a meeting after an NDA we discuss: | 签署保密协议后会面洽谈： |
| includedCoords | Название и точные координаты | Атауы және нақты координаттары | Name and exact coordinates | 名称及精确坐标 |
| includedAssay | Оценку наших геологов | Геологтарымыздың бағасы | Our geologists' assessment | 我方地质师的评估 |
| includedLegal | Правовой статус и путь к лицензии | Құқықтық мәртебесі және лицензияға жол | Legal status and the path to a licence | 法律状态及取得许可证的路径 |
| includedContacts | Формат и график сделки | Мәміле форматы мен кестесі | Deal format and timeline | 合作方式与时间安排 |
| locationHidden | Точные координаты — после NDA | Нақты координаттар — NDA-дан кейін | Exact coordinates — after an NDA | 精确坐标在签署保密协议后提供 |
| getFullPackage | Материалы участка | Учаске материалдары | Area materials | 地块资料 |
| ctaNote | Материалы — после подписания NDA | Материалдар — NDA-ға қол қойылғаннан кейін | Materials — after an NDA is signed | 资料在签署保密协议后提供 |

**leadLocked (new namespace, after `leadDetail`)**

| key | ru | kz | en | zh |
| --- | --- | --- | --- | --- |
| heading | Что покажем после NDA | NDA-дан кейін не көрсетеміз | What we share after an NDA | 签署保密协议后提供的资料 |
| itemName | Точное название участка | Учаскенің нақты атауы | Exact area name | 地块确切名称 |
| itemArea | Район и ближайший населённый пункт | Аудан және ең жақын елді мекен | District and nearest settlement | 所在区及最近居民点 |
| itemCoords | Точные координаты | Нақты координаттар | Exact coordinates | 精确坐标 |
| itemAssessment | Оценка наших геологов | Геологтарымыздың бағасы | Our geologists' assessment | 我方地质师的评估 |
| badge | Откроем после NDA | NDA-дан кейін ашамыз | Shared after an NDA | 签署保密协议后提供 |
| note | Это рабочие данные сделки, поэтому они закрыты до подписания соглашения о конфиденциальности. | Бұл мәміленің жұмыс деректері, сондықтан құпиялылық келісіміне қол қойылғанға дейін жабық. | These are working deal data, so they stay closed until a confidentiality agreement is signed. | 这些是交易工作资料，签署保密协议前不予公开。 |

- [ ] **Step 3: `LeadLockedSection.tsx`** — rewrite the data part and texts, keep the markup and classes:

```tsx
import { Lock } from 'lucide-react';
import { translate } from '@/lib/i18n/translations';

// Visual placeholders for what stays closed until an NDA. Renders NO real
// lead data: the blurred fragments are language-neutral decoys.
const LOCKED_ITEMS: { key: string; redacted: string }[] = [
  { key: 'leadLocked.itemName', redacted: 'Kar•••••, 4' },
  { key: 'leadLocked.itemArea', redacted: '••• 18 km NE' },
  { key: 'leadLocked.itemCoords', redacted: '48.6…° N, 67.2…° E' },
  { key: 'leadLocked.itemAssessment', redacted: 'Au … g/t · … m' },
];

export default function LeadLockedSection({ locale }: { locale: string }) {
  const t = (key: string) => translate(locale, key);
```

Then in the JSX:
- `Что откроется после доступа` → `{t('leadLocked.heading')}`;
- `item.label` → `t(item.key)`, and use `key={item.key}`;
- `Доступно после открытия` → `{t('leadLocked.badge')}`;
- the final paragraph → `{t('leadLocked.note')}`.

- [ ] **Step 4: Teaser page** — `src/app/[locale]/leads/[code]/page.tsx`:
  - Imports: `formatCheckDate` from `@/lib/leads/check-date`; `toLocale` from `@/lib/seo/site`; `hasAnyChannel` next to `getContactConfig`; remove `EXCLUSIVITY_LABELS` from the `@/lib/leads/types` import.
  - After `const free = …` add `const checkedOn = formatCheckDate(lead.last_verified, toLocale(locale));` and `const contacts = getContactConfig();`.
  - Replace the `{lead.last_verified && (…)}` block with the same markup guarded by `{free && (…)}`, printing `{t('leadDetail.verifyDate')} {checkedOn}`.
  - `<LeadLockedSection />` → `<LeadLockedSection locale={locale} />`.
  - `config={getContactConfig()}` → `config={contacts}`.
  - The `<h3>` above `InquiryForm` prints `{hasAnyChannel(contacts) ? t('contact.orForm') : t('contact.formTitle')}`.
  - Price card: delete the `<div className="text-xs text-gray-500 mt-1">{EXCLUSIVITY_LABELS[lead.exclusivity]}</div>` line ("Массовый доступ" is old-model wording). Insert `<p className="mt-4 text-xs text-gray-500">{t('leadDetail.includedHeading')}</p>` before the `<ul>` and change the `<ul>`'s `mt-4` to `mt-2`.

- [ ] **Step 5: Run** — `npx jest src/__tests__/lib src/__tests__/app` → PASS.

- [ ] **Step 6: Commit** — `git commit -am "feat(teaser): dated status, deal steps, NDA block in 4 languages"`

---

### Task 5: Russian pages — FAQ, terms, About

**Files:**
- Modify: `src/app/[locale]/faq/page.tsx`
- Modify: `src/app/[locale]/legal/terms/page.tsx`
- Modify: `src/app/[locale]/about/page.tsx`

**Interfaces:**
- Consumes: `DealSteps` (Task 3).

- [ ] **Step 1: FAQ** — replace the `FAQ` array with the 8 entries of spec §4.7, copied verbatim (question = bold heading text, answer = the sentence(s) after it). Change:
  - the hero paragraph to `Как устроена сделка, откуда данные и что мы гарантируем — коротко и без общих фраз.`;
  - the CTA section heading to `Готовы обсудить участок?`;
  - its paragraph to `Посмотрите витрину или напишите нам — ответим в течение рабочего дня.`

Replace the single button with two buttons in a `flex flex-wrap gap-3 mt-8` wrapper:

```tsx
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/leads`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-50 text-gray-900 text-sm font-semibold shadow-subtle hover:shadow-medium hover:-translate-y-0.5 transition-all"
              >
                Смотреть участки
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                Связаться
              </Link>
            </div>
```

- [ ] **Step 2: Terms** — make the page take params:
  - Signature: `export default async function TermsPage({ params }: { params: Promise<{ locale: string }> })`, then `const { locale } = await params;`. Import `Link` from `next/link`.
  - Replace `sections` with the five sections 1–5 of spec §4.8, headings in italics there becoming `h`, sentences becoming `body` items.
  - Date line: `Последнее обновление: сентябрь 2026`.
  - After the `sections.map(...)` block, still inside the `space-y-12` div, add:

```tsx
            <section>
              <h2 className="font-serif text-2xl lg:text-3xl text-gray-900 dark:text-gray-50 tracking-tight mb-4">
                Контакты
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Вопросы по этим условиям задавайте через{' '}
                <Link href={`/${locale}/contact`} className="text-gray-900 dark:text-gray-50 underline underline-offset-4 hover:text-gold-dark">
                  страницу контактов
                </Link>
                .
              </p>
            </section>
```

- [ ] **Step 3: About** — per spec §4.8:
  - eyebrow `О компании`;
  - H1 `QAZNEDR HOLDING — геология и недропользование Казахстана`;
  - hero paragraph = the spec paragraph;
  - `points` = the 3 cards (titles/descs verbatim), icons `MapPin`, `FileText`, `ShieldCheck` kept in that order;
  - delete the `steps` array and the whole «Как это работает» section; in its place render `<DealSteps locale={locale} />`;
  - «С чего начать» cards: titles `Участки` / `Контакты` / `Вопросы и ответы`, descriptions `Свободные участки с изученной геологией.` / `WeChat, WhatsApp или заявка на сайте.` / `Форматы сделки, данные и гарантии.`

- [ ] **Step 4: Run** — `npx jest src/__tests__/app` → PASS; `npx eslint "src/app/[locale]/faq/page.tsx" "src/app/[locale]/legal/terms/page.tsx" "src/app/[locale]/about/page.tsx"` → no errors.

- [ ] **Step 5: Commit** — `git commit -am "feat(copy): FAQ, terms and About describe the holding, not a data marketplace"`

---

### Task 6: Contacts — empty channels, heading levels, WeChat hint

**Files:**
- Modify: `src/app/[locale]/contact/page.tsx`
- Modify: `src/lib/i18n/translations.ts` (`contact.channelsHeading` new, `contact.wechatHint`, `seo.contact.title`)
- Test: `src/__tests__/lib/i18n/holding-keys.test.ts` (add `'contact.channelsHeading'` to `CONTACT_KEYS`)

- [ ] **Step 1: Failing test** — add `'contact.channelsHeading'` to `CONTACT_KEYS`; run `npx jest src/__tests__/lib/i18n` → FAIL.

- [ ] **Step 2: Translations**

| key | ru | kz | en | zh |
| --- | --- | --- | --- | --- |
| contact.channelsHeading | Написать нам | Бізге жазыңыз | Message us | 联系方式 |
| contact.wechatHint | Отсканируйте QR-код в WeChat и укажите код участка. | WeChat-та QR-кодты сканерлеп, учаске кодын көрсетіңіз. | Scan the QR code in WeChat and mention the area code. | 请用微信扫描二维码添加，并注明地块编号。 |
| seo.contact.title | Контакты: WeChat и WhatsApp | Байланыс: WeChat және WhatsApp | Contact: WeChat and WhatsApp | 联系我们：微信和 WhatsApp |

- [ ] **Step 3: Contact page** — import `hasAnyChannel`; replace the grid with:

```tsx
          {hasAnyChannel(config) ? (
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section aria-labelledby="channels-heading">
                <h2 id="channels-heading" className="font-serif text-xl text-gray-900 dark:text-gray-100 mb-4">
                  {t('contact.channelsHeading')}
                </h2>
                <ContactChannels config={config} locale={locale} />
              </section>
              <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="font-serif text-xl text-gray-900 dark:text-gray-100 mb-4">
                  {t('contact.formTitle')}
                </h2>
                <InquiryForm locale={locale} />
              </section>
            </div>
          ) : (
            <section className="mt-10 max-w-2xl rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="font-serif text-xl text-gray-900 dark:text-gray-100 mb-4">
                {t('contact.formTitle')}
              </h2>
              <InquiryForm locale={locale} />
            </section>
          )}
```

- [ ] **Step 4: Run** — `npx jest src/__tests__/lib src/__tests__/app` → PASS.

- [ ] **Step 5: Commit** — `git commit -am "fix(contact): h2 for channels, form-only layout without channels, QR-only WeChat hint"`

---

### Task 7: Inquiry anti-bot and admin input validation

**Files:**
- Modify: `src/lib/inquiries/schema.ts`
- Modify: `src/app/api/admin/inquiries/route.ts`
- Test: `src/__tests__/lib/inquiries/schema.test.ts`, `src/__tests__/api/admin-inquiries.route.test.ts`

**Interfaces:**
- Produces:
  - `parseStatusUpdate(body: unknown): { id: string; status: InquiryStatus } | null`;
  - `parseStatusFilter(param: string | null): InquiryStatus | 'ALL' | null` (`null` = invalid; missing → `'NEW'`).

- [ ] **Step 1: Failing tests** — in `schema.test.ts`:
  - make the shared `valid` fixture include `elapsedMs: 8000`;
  - add:

```ts
import { parseStatusFilter, parseStatusUpdate } from '@/lib/inquiries/schema';

it('requires elapsedMs', () => {
  const { elapsedMs, ...noTimer } = valid;
  expect(elapsedMs).toBe(8000);
  expect(inquirySchema.safeParse(noTimer).success).toBe(false);
});

describe('admin status input', () => {
  const id = '3f2b8c1e-9a4d-4e2b-8f1a-2c3d4e5f6a7b';
  it('accepts a uuid and a known status', () => {
    expect(parseStatusUpdate({ id, status: 'REJECTED' })).toEqual({ id, status: 'REJECTED' });
  });
  it('rejects a non-uuid id or an unknown status', () => {
    expect(parseStatusUpdate({ id: '42', status: 'REJECTED' })).toBeNull();
    expect(parseStatusUpdate({ id, status: 'LOST' })).toBeNull();
    expect(parseStatusUpdate(null)).toBeNull();
  });
  it('parses the list filter', () => {
    expect(parseStatusFilter(null)).toBe('NEW');
    expect(parseStatusFilter('ALL')).toBe('ALL');
    expect(parseStatusFilter('DEAL')).toBe('DEAL');
    expect(parseStatusFilter('drop table')).toBeNull();
  });
});
```

In `admin-inquiries.route.test.ts`, add a case following the file's existing admin-mock pattern: PATCH with `{ id: 'not-a-uuid', status: 'REJECTED' }` → 400, and the service client's `update` is never called.

Run `npx jest src/__tests__/lib/inquiries src/__tests__/api` → FAIL.

- [ ] **Step 2: Implement** — in `schema.ts`:
  - `elapsedMs: z.number().int().nonnegative(),` (drop `.optional()`);
  - `isLikelySpam` body: `return input.website.trim() !== '' || input.elapsedMs < MIN_FILL_MS;`;
  - append:

```ts
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseStatusUpdate(body: unknown): { id: string; status: InquiryStatus } | null {
  if (!body || typeof body !== 'object') return null;
  const { id, status } = body as { id?: unknown; status?: unknown };
  if (typeof id !== 'string' || !UUID.test(id)) return null;
  if (!(INQUIRY_STATUSES as readonly unknown[]).includes(status)) return null;
  return { id, status: status as InquiryStatus };
}

export function parseStatusFilter(param: string | null): InquiryStatus | 'ALL' | null {
  const value = param || 'NEW';
  if (value === 'ALL') return 'ALL';
  return (INQUIRY_STATUSES as readonly string[]).includes(value) ? (value as InquiryStatus) : null;
}
```

In `route.ts`:
- GET: `const status = parseStatusFilter(new URL(request.url).searchParams.get('status'));`, and if it is `null`, return a 400 `{ success: false, error: 'Invalid status' }`;
- PATCH: replace the manual `valid` check with `const input = parseStatusUpdate(body); if (!input) return 400 …`, then update with `input.status` / `input.id`;
- import both helpers and drop the now-unused `INQUIRY_STATUSES` import.

- [ ] **Step 3: Run** — `npx jest src/__tests__/lib/inquiries src/__tests__/api` → PASS (`inquiries.route.test.ts` already sends `elapsedMs: 9000`).

- [ ] **Step 4: Commit** — `git commit -am "fix(inquiries): require the fill timer, validate admin ids and status filters"`

---

### Task 8: Owner login — per-IP lockout and constant-time miss

**Files:**
- Modify: `src/lib/auth/env-admin.ts`
- Modify: `src/lib/services/auth.config.ts:40-64`
- Test: `src/__tests__/lib/auth/env-admin.test.ts`

**Interfaces:**
- Produces: `verifyEnvAdmin(email, password, env?, clientIp = 'unknown')`. The fourth parameter is new; existing calls stay valid.

- [ ] **Step 1: Failing tests** — append:

```ts
  it('does not let one IP lock the owner out of another', async () => {
    for (let i = 0; i < 10; i++)
      await verifyEnvAdmin('owner@qaznedr.kz', 'bad', env, '10.0.0.1');
    await expect(
      verifyEnvAdmin('owner@qaznedr.kz', 'correct horse', env, '10.0.0.2')
    ).resolves.not.toBeNull();
  });

  it('spends a bcrypt compare on unknown emails too', async () => {
    const spy = jest.spyOn(bcrypt, 'compare');
    await verifyEnvAdmin('stranger@x.kz', 'whatever', env, '10.0.0.3');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
```

The existing «locks an email out after 10 attempts» test keeps working, since calls without an IP share the key `unknown|email`.

Run `npx jest src/__tests__/lib/auth` → FAIL.

- [ ] **Step 2: Implement** — generate a dummy hash once:

```bash
node -e "console.log(require('bcryptjs').hashSync(require('crypto').randomBytes(16).toString('hex'), 12))"
```

and paste the output as the constant below. In `env-admin.ts`:

```ts
// Compared against when the email is not an admin, so a miss costs the same
// time as a wrong password and does not reveal which emails are admins.
const DUMMY_HASH = '<paste the generated $2a$12$... hash>';

export async function verifyEnvAdmin(
  email: string,
  password: string,
  env: { emails?: string; hash?: string } = {
    emails: process.env.ADMIN_EMAILS,
    hash: process.env.ADMIN_PASSWORD_HASH,
  },
  clientIp = 'unknown'
): Promise<{ id: string; email: string; name: string; image: null } | null> {
  const normalized = email.trim().toLowerCase();
  // Keyed by IP + email: knowing the owner's email is not enough to lock them out.
  if (!attempts(`${clientIp}|${normalized}`)) return null;
  const isAdmin = Boolean(env.hash) && isEnvAdminEmail(normalized, env.emails);
  const ok = await bcrypt.compare(password, isAdmin ? (env.hash as string) : DUMMY_HASH);
  return isAdmin && ok
    ? { id: `env-admin:${normalized}`, email: normalized, name: 'Admin', image: null }
    : null;
}
```

In `auth.config.ts`:
- `async authorize(credentials, req) {`;
- before the `verifyEnvAdmin` call:

```ts
        const forwarded = req?.headers?.['x-forwarded-for'];
        const clientIp =
          (typeof forwarded === 'string' ? forwarded.split(',')[0] : '').trim() || 'unknown';
```

- pass `undefined, clientIp` as the 3rd/4th arguments.

- [ ] **Step 3: Run** — `npx jest src/__tests__/lib/auth` → PASS.

- [ ] **Step 4: Commit** — `git commit -am "fix(admin): lockout per IP and email, constant-time miss for unknown emails"`

---

### Task 9: Copy guard, dead config, AI discovery file

**Files:**
- Modify: `src/__tests__/app/no-hidden-links.test.ts`
- Delete: `next.config.ts`
- Modify: `public/.well-known/ai-plugin.json`

- [ ] **Step 1: Guard test** — in `no-hidden-links.test.ts`:
  - add `path.join(SRC, 'app/[locale]/leads/[code]/page.tsx')` to the initial `queue`, so the teaser and `LeadLockedSection` are scanned;
  - append:

```ts
import { translations } from '@/lib/i18n/translations';

// Old "data marketplace" wording breaks the copy red lines (spec §3, session 2 §4.9).
const FORBIDDEN_SOURCE = [
  /1 000 000/, /маркетплейс/i, /marketplace/i, /公开市场/, /point-in-polygon/i,
  /госархив/i, /государственн\w* архив/i, /полн\w* пакет/i, /full package/i,
  /после оплаты/i, /after payment/i, /инв\. №/, /портфел/i, /info@qaznedr\.kz/,
];
const FORBIDDEN_COPY = [...FORBIDDEN_SOURCE, /portfolio/i, /JORC/, /state archive/i, /国家档案/, /付款后/, /Ашық алаң/, /толық пакет/i];
const COPY_NAMESPACES = ['portal', 'dealSteps', 'leadsHero', 'leadsCatalog', 'leadDetail', 'leadLocked', 'seo', 'navigation', 'footerNav', 'footer', 'contact'];

function strings(node: unknown, at: string): [string, string][] {
  if (typeof node === 'string') return [[at, node]];
  if (!node || typeof node !== 'object') return [];
  return Object.entries(node).flatMap(([k, v]) => strings(v, `${at}.${k}`));
}

describe('public copy', () => {
  it('source files carry no forbidden wording', () => {
    const offenders = publicSourceFiles().flatMap((f) => {
      const src = readFileSync(f, 'utf8');
      return FORBIDDEN_SOURCE.filter((re) => re.test(src)).map((re) => `${path.relative(SRC, f)} ~ ${re}`);
    });
    expect(offenders).toEqual([]);
  });

  it('translations carry no forbidden wording', () => {
    const offenders = Object.entries(translations).flatMap(([locale, dict]) =>
      COPY_NAMESPACES.flatMap((ns) =>
        strings((dict as Record<string, unknown>)[ns], `${locale}.${ns}`)
      ).flatMap(([key, value]) =>
        FORBIDDEN_COPY.filter((re) => re.test(value)).map((re) => `${key} ~ ${re}`)
      )
    );
    expect(offenders).toEqual([]);
  });
});
```

(`publicSourceFiles` is the existing function in this file. Move the `translations` import to the top with the others.)

- [ ] **Step 2: Run** — `npx jest src/__tests__/app/no-hidden-links.test.ts` → PASS if Tasks 1–6 are done; any offender printed is a missed string. Fix it in its source, not in the pattern list, unless it is legitimate educational content outside the copy namespaces.

- [ ] **Step 3: Dead config** — `git rm next.config.ts`. In the commit body, list the settings that existed only there (`poweredByHeader`, `compress`, Sentry `withSentryConfig`, `images.remotePatterns`, `typescript`/`eslint` build flags, `modularizeImports`, experimental `optimizeCss`/`webpackBuildWorker`) so porting them can be a separate decision. The file was never loaded (`next.config.mjs` wins), so runtime behaviour does not change.

- [ ] **Step 4: `public/.well-known/ai-plugin.json`** — set these values; keep the other keys:
  - `"name_for_human": "QAZNEDR HOLDING — ore areas in Kazakhstan"`;
  - `"description_for_human": "Kazakhstan exploration holding: prepared free ore areas and licensing and deal support for investors."`;
  - `"description_for_model": "QAZNEDR HOLDING is a Kazakhstan exploration holding. Its geologists study Soviet-era archival exploration reports (registry of 7,152 ore objects) and find areas with no active subsoil licence per the company's own check on a stated date. The site shows teasers of these areas (metal, region, geology, check date); names, coordinates and materials are shared after an NDA. The company does not own these areas and does not sell archival reports; it prepares deals: licence in the investor's name, licence via the holding then transfer, JV or earn-in, or analytics. Reserves are stated with their standard (Soviet GKZ categories or historical estimate). Contact via WeChat or WhatsApp at https://qaznedr.kz/en/contact. Languages: Russian, Kazakh, English, Chinese."`;
  - `"legal_info_url": "https://qaznedr.kz/ru/legal/terms"`.

- [ ] **Step 5: Commit** — `git add -A src/__tests__/app/no-hidden-links.test.ts public/.well-known/ai-plugin.json && git commit -m "test(copy): guard against marketplace wording; drop dead next.config.ts; holding AI plugin manifest"`

---

### Task 10: Verify, deploy, check production

- [ ] **Step 1:** `npm test 2>&1 | tail -40`. Compare failing suites with the pre-existing legacy list (record it before Task 1 with `npm test 2>&1 | grep FAIL > /tmp/...`). There must be no new failures.
- [ ] **Step 2:** `npm run lint` → no errors in touched files; `npm run build` → exit 0.
- [ ] **Step 3:** `git push origin master`; wait for the Vercel production deployment of the pushed SHA to be READY (Vercel API `meta.githubCommitSha`).
- [ ] **Step 4: Production checks** (curl + Chrome):
  - `/ru`, `/zh`, `/en`, `/kz`: new H1; the zh main button → `/zh/contact`; the ru one → `wa.me/77475540189`; stats show 31 / 7 152 / regions;
  - screenshots at 375 and 1440 px for ru and zh;
  - `/ru/leads/AU-4`: «Дата проверки: 05.2026», «Условия · По договорённости», NDA block in the page language; `<title>` ends with «| QAZNEDR HOLDING»;
  - `curl -sI /ru/support` → 308 to `/ru/contact`; `curl -sI /ru/services/investors` → 308;
  - `sitemap.xml` has no `/support`;
  - `curl -s /ru/faq | grep -c "1 000 000"` → 0.
- [ ] **Step 5: Test inquiry** — POST `/api/inquiries` with a clearly marked test payload (`name: "TEST session2"`, `elapsedMs: 9000`) → 201. Verify the row via Supabase and set it to `REJECTED`. Ask the owner to log in to `/admin` and confirm they see it.

### Task 11: Indexing

- [ ] **Step 1: Google Search Console** (Chrome): Sitemaps → `sitemap.xml` → Submit; status «Успешно».
- [ ] **Step 2: Yandex Вебмастер:**
  - check the move request `www → qaznedr.kz`;
  - in the `https://www.qaznedr.kz` property (or the apex once the move completes): Индексирование → Файлы Sitemap → `https://qaznedr.kz/sitemap.xml`.
- [ ] **Step 3: Bing:**
  - add `https://qaznedr.kz/` manually;
  - choose meta-tag verification and put the `msvalidate.01` content into Vercel env `BING_SITE_VERIFICATION` (production). Because a redeploy is needed for env, prefer the XML-file option if offered: save `public/BingSiteAuth.xml` with the exact content shown, commit, push;
  - verify, then submit the sitemap.
- [ ] **Step 4: IndexNow** — check `vercel env ls production | grep INDEXNOW_TRIGGER_SECRET`:
  - if it is set, POST `/api/indexnow` with the secret → 200;
  - if not, check the key file (`/qaznedr2026indexnow.txt` → 200) and note in the roadmap that the trigger secret is missing.

### Task 12: Close the session

- [ ] **Step 1:** Update `docs/HOLDING_ROADMAP.md`:
  - «Текущий статус»: what shipped, verification state per engine, the Cloudflare-account question, email later;
  - tick the provided items in «Не хватает от владельца»; add «свой 微信号 у Мухтара», «аккаунт Baidu», «чей Cloudflare-аккаунт у qaznedr.kz»;
  - mark session 2 done; carry over what is left (Baidu, Sogou, Telegram bot, email, porting settings from the deleted `next.config.ts`).
- [ ] **Step 2:** Update memory: a `reference` note on webmaster accounts and DNS facts, and the `project` roadmap note.
- [ ] **Step 3:** Commit and `git push origin master`; confirm the prod SHA matches; hand the owner the next-session prompt.
