# Локализация FAQ и условий использования — 28.09.2026

## Объём

Добавить казахские переводы четырёх уже утверждённых гайдов (`foreign-investor-subsoil-rights-kazakhstan`, `reserve-classification-gkz-kazrc-jorc-gbt17766`, `solid-minerals-exploration-licence-kazakhstan`, `subsoil-rights-transfer-permission-kazakhstan`) из `content/insights/*/kz.md`, а также казахский перевод существующих восьми вопросов и ответов FAQ. Перенести нынешний русский текст условий использования в общий локализованный источник и подготовить точные версии пяти существующих разделов и блока контактов на казахском, английском и китайском. Сохранить русскую версию как источник смысла.

## Ограничения

- Переводить только уже существующие факты и обязательства. Не добавлять условия, обещания, права или новые коммерческие формулировки.
- Не менять порядок, число разделов, FAQ-вопросов, структуру страниц, дизайн или стили.
- На странице выставлять `lang` из `HREFLANG` для фактического языка содержимого.
- Не менять русские, английские и китайские тексты гайдов; не менять дизайн. Для четырёх завершённых казахских гайдов включить `kz` в реестр, hreflang/canonical и sitemap и убрать fallback/redirect только там, где опубликован перевод. Остальные гайды/страницы не расширять.

## Реализация и критерии

- Каждый из четырёх казахских гайдов проходит те же проверки целостности и ссылок, что RU/EN/ZH; KZ карточки/страницы используют свой текст; canonical и hreflang отражают наличие перевода, sitemap включает KZ URL, маршрут не перенаправляет на RU.
- `faqFor('kz')` возвращает восемь казахских Q&A; ru/en/zh сохраняются.
- `termsFor(locale)` возвращает локализованные названия/тексты пяти разделов, дату обновления и контактную строку на ru/kk/en/zh; каждый язык имеет одинаковую структуру.
- Тесты подтверждают отсутствие русского fallback у казахского FAQ и полноту структуры/переводов terms на всех четырёх языках.
- Рендер страниц использует общий источник terms и `<section lang={HREFLANG[locale]}>`.

## Файлы

`content/insights/{foreign-investor-subsoil-rights-kazakhstan,reserve-classification-gkz-kazrc-jorc-gbt17766,solid-minerals-exploration-licence-kazakhstan,subsoil-rights-transfer-permission-kazakhstan}/kz.md`, `src/lib/insights/registry.ts`, `src/__tests__/lib/insights/`, `src/__tests__/middleware.test.ts`, `src/__tests__/lib/seo/article-seo.test.ts`, `src/__tests__/app/robots-sitemap.test.ts`, `src/lib/content/faq.ts`, `src/lib/content/terms.ts`, `src/app/[locale]/faq/page.tsx`, `src/app/[locale]/legal/terms/page.tsx`, `src/__tests__/lib/content/faq.test.ts`, `src/__tests__/lib/content/terms.test.ts`.
