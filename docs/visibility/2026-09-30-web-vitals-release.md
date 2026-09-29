# Корректность диагностики Web Vitals — 30.09.2026

Техническая правка по действующему поручению развивать сайт. Публичные тексты, дизайн, рекламные настройки и данные участков не менялись.

## Изменения

- Callback web-vitals v5 INP больше не выдаётся за FID. Пороги INP: good <=200 ms, needs improvement <=500 ms, poor >500 ms, согласно https://web.dev/articles/inp.
- Сервис сохраняет finite non-negative значения, включая ноль, и обрабатывает TTFB. Для всех метрик границы включительны; неверные значения отбрасываются.
- Обычные обновления библиотеки и новый metric id после bfcache принимаются, точные повторные значения подавляются. Повторной отправки всех метрик на beforeunload больше нет.
- После unmount подавляются поздние callbacks, отменяется resource timer, отключаются manual PerformanceObserver. Изменение props не регистрирует библиотеку повторно; callbacks используют последний committed context. CLS в breadcrumb не подписывается миллисекундами.

Это исправление внутренней диагностики Sentry. Существующий trackMetric создаёт breadcrumbs, а не самостоятельный агрегированный отчёт посетителей. Отдельные Vercel Speed Insights, GA4 и Метрика не перенастраивались. Ускорение сайта, рост трафика и поисковых позиций этим релизом не заявляются.

## Проверки

- TDD: исходные тесты падали на INP/FID, повторных callback, единицах CLS, cleanup, zero/TTFB и границах. Отдельный тест zero CLS manual fallback сначала падал на старом >0 gate.
- Целевые **17 тестов в двух наборах прошли**. Осмысленно проверены StrictMode, обновление props, fake timer до render с отсутствием resource read после unmount, отключение трёх manual observers и подавление позднего callback.
- Полный Jest: **2212 pass / 28 известных failures**, 97 pass / 6 failed suites. Пять legacy suites совпадают с baseline; шестой — известный timing flake CSRF constant-time comparison. Новых failures нет.
- ESLint четырёх изменённых TS/TSX-файлов, Prettier, git diff --check и production build прошли.
- Локальный production server3107: четыре языка ×375/1440×две темы, **16 сочетаний**. Правильный lang и H1, ноль broken images, нет horizontal overflow. Локальные RU/ZH страницы последнего гайда также просмотрены; console errors отсутствуют. Тестовая вкладка закрыта, viewport сброшен.
- Независимое сильное ревью после исправления zero fallback — **Ready**.

## Границы

Ручной fallback CLS/LCP остаётся приблизительным старым алгоритмом; его точность не заявляется. Настоящий повторный mount компонента может создавать новые lifetime-подписки web-vitals (библиотека не предоставляет unsubscribe). Текущий singleton locale layout и этот релиз проверены; при дальнейшем переносе tracker это необходимо учитывать.

Полный обход production128URL и сохранившийся редакционный пробел — `docs/visibility/2026-09-30-public-seo-check.md`. Журналы почты/outreach остаются локальными и не включаются в технический коммит.

## Деплой

Код опубликован: `c83657e5f4f61aa0c513475444f624667c9b36fa`. CI `36623023614` (lint/type-check/test/build) и Production `6744232474` — success, exact SHA совпадает с HEAD/origin на момент проверки.

Восемь живых URL (главная и последний гайд на четырёх языках) вернули HTTP200 с одним H1 и собственным canonical. В опубликованном layout chunk `layout-662eb40f33eba0b0.js` найдены INP good200/poor500 и onINP; старого Complete Web Vitals report generated нет. Проверен фактически отдаваемый клиентский код, а не только локальная сборка. Сервер3107 остановлен.

После технического выпуска дополнительно прочитан GSC: данные25–27.09, 13кликов/61показ в web-search и8показов AI (в том числе два гайда). Подробности и ограничения — `docs/visibility/2026-09-30-google-search-check.md`; эффект этой правки измерениями не приписывается.
