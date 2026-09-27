# Повторная проверка поиска — 27.09.2026, около 13:15 (Алматы)

## Состояние релиза

- На старте: `HEAD` = `origin/master` = Production `bd35a65`; deployment `6685671263` — `success`.
- Сайт, дизайн и БД в этой проверке не менялись.

## Google Search Console

- Sitemap: «Успешно», 200 URL; обработка датирована 27.09. Обзор ещё показывает «данные обрабатываются».
- `/en` есть в индексе. Последний обход: 27.09, 04:22:36 (время в интерфейсе); smartphone; fetching и indexing разрешены. Пользовательский canonical `https://qaznedr.kz/en`, Google подтвердил тот же URL.
- `/zh` пока не в индексе: duplicate, Google-selected canonical отличается. Последний обход: 27.09, 04:20:28; успешный, fetching и indexing разрешены. Пользовательский canonical `https://qaznedr.kz/zh`, выбранный Google — `https://www.qaznedr.kz/zh`. Проверено: `www/zh` отвечает 308 на `non-www/zh`, затем 200.
- В Product report есть missing price для `/ru/leads/AU-279C3B` по обходу 19.09. Текущий URL отвечает 200 без редиректа; на странице есть только `Place` и `BreadcrumbList`, без `Product`/`Offer` (`lead-jsonld.ts`). Проверки исправления Product price, Merchant price и Merchant image (тот же URL и обход 19.09) приняты Google: «начато», дата начала 27.09. Это ещё не итог «успешно».

## Bing Webmaster Tools

- Sitemap: Success, 200 URLs, 0 errors, 0 warnings; ранее статус был Processing (176). Даты submit/crawl в UI — 26.09, без интерпретации часового пояса. Для home действует ожидание до 48 часов.
- AI Performance за 27.06–26.09: Total Citations 0, Avg Cited Pages 0; источник — только Microsoft Copilots and Partners.

## Непроверенное и следующие зависимости

- Замер DeepSeek не сделан: chat sign-in требует входа владельца.
- Аудит Sol не выявил новых автономных исправлений Telegram, WeChat или верификаций; 18/18 тестов в 3 suites прошли (`/tmp/qaznedr-7c-channels-tests.log`).
- Остающиеся внешние действия зависят от данных, аккаунтов или утверждения владельца: Cloudflare, почта, hoster/admin, Baidu/Sogou, Telegram, внешние публикации, DeepSeek, юридические и переводческие согласования, геобаза и сведения компании/команды. См. «Не хватает от владельца» в `docs/HOLDING_ROADMAP.md`.

Размещения, включение каналов, индексация всех 200 URL и AI-успех не подтверждены.

## Проверки документационного выпуска

- Правило экономного делегирования распространено с дизайна на весь проект: Luna / Terra / Sol, узкие задачи, личная проверка Astra и отдельное сильное ревью.
- Production build успешен; полный Jest — 1559 passed / 28 failed: только пять прежних legacy-наборов и известный CSRF timing. Логи `/tmp/qaznedr-7c-build.log`, `/tmp/qaznedr-7c-jest.log`.
- Изменений поведения и UI нет; новые поведенческие тесты и повторная матрица 375/1440 не требовались. Существующие тесты каналов пройдены, живые кабинеты и HTTP проверены.
- Повторные sitemap/IndexNow/EN/ZH submissions без изменений не выполнялись.
- Независимое Sol review: важных замечаний нет; уточнены различие sitemap/индексации, следующие проверки и границы делегирования.
