# Внедрение16 A — 30.09.2026

Утверждение: «давай дальше делай» после рекомендации конкретного A; APPROVED.md. B не выбран. Spec/plan: `docs/superpowers/specs/2026-09-30-brand-cohesion-design.md` и план рядом.

## Изменения

- Единый меловой hero в обеих темах, artwork без рамки; локальные цветовые/focus tokens. Тексты, CTA/handlers, статистика и сценa12 сохранены.
- Вместо повторного блокнота home-company/about: существующий декоративный cutaway960×480 с настоящим локализованным figcaption об условности. /services: native SVG-контур из показа, скрытый от assistive tech. /insights: типографские строки без повторения рисунка, все11статей/ссылки/категории/даты/время сохранены.
- Три ссылки KZ-главной теперь ведут на существующие казахские гайды. Registry/files проверены; новый контент не добавлялся.
- WebP1536×1024,151928байт; Next/Image outputs AVIF/WebP. Изображение непрозрачное, darken blend как в макете; это не данные участка. Подсказка sizes соответствует трём CSS диапазонам.

## Проверки

Кодовый агент Sol medium: новые проверки сначала красные, затем34/34зелёные. Ведущий проверил весь diff и расширил server home ожидание под исправленный KZ-язык: **7наборов/38тестов зелёные**. Initial full выявил старое ожидание KZ→RU; оно исправлено. Final full Jest: **2231pass/27известных failures**,101pass/5failed suites. Падают прежние MiningLicenseCard/CreateListingWizard/ListingsFilters/ThemeToggle/listings API; CSRF timing в итоговом прогоне зелёный. Новых регрессий нет. ESLint изменённых TS/TSX, tsc (агент), Prettier/diff-check и npm run build прошли.

Chrome: **64сочетания** — home/about/services/insights × RU/KZ/EN/ZH ×375/1440 ×light/dark; `browser-check.json`. Один H1, без горизонтального overflow или completed broken images, заголовки ниже fixed navigation, все11строк индекса, язык ссылок сохранён. Декоративный рисунок после CTA на mobile; chalk hero в обеих темах. Личная визуальная оценка desktopRU, mobileRU/ZH, darkZH about/services/insights и дополнительно900px. На первом проходе фиксированная высота обрезала блокнот; исправлено пропорциональным aspect-ratio, повторный просмотр подтвердил целый рисунок. Ошибок localhost в console не обнаружено; предупреждения расширения MetaMask не относятся к сайту.

Сильное независимое Astra high review: **Ready**, включая финальную поправку aspect-ratio. Скриншоты: `implementation-desktop-ru.jpg`, `implementation-mobile-zh.jpg`.

## Выпуск

Код опубликован: `1cb68b386add211adfe4273fa22b707cbd5fc61b`. GitHub CI36628418323: success (lint/type-check/test/build). Production6745105913: success, exact SHA совпал. Живые16HTML: HTTP200, один H1/canonical, новый hero/cutaway/contour/11строк индекса и KZ-ссылки подтверждены. WebP HTTP200/image-webp/151928байт. Chrome liveRU1440 и ZH375: рисунок загрузился, нет overflow; RU обсуждение ведёт в WhatsApp. Снимок `production-desktop-ru.jpg`. IndexNow HTTP200 принял16изменённых адресов; это подтверждение отправки, не индексации. Почтовые/outreach журналы в релиз не включаются. Новые описания страниц, реклама и китайские аккаунты не изменялись; это визуальный/языковой выпуск, не доказательство роста трафика.

## Продолжение

В следующей сессии читать HOLDING_ROADMAP/CLAUDE/APPROVED и сверить HEAD/origin/master/Production. Вариант16 A завершён; не предлагать его заново. Далее — развитие содержательных гайдов по измеряемым запросам и закрытой основы каталога13. Отдельный meta description «О компании» и согласие15 не утверждены. Доступ Douyin зависит от ответа/данных владельца, не блокирует сайт.
