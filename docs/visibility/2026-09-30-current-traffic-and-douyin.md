# Текущие посещения и Douyin — 30.09.2026

Проверка авторизованных кабинетов 15:00–15:15 Алматы. Настройки/права/кампании не менялись.
HEAD/origin/Production=d10a186, deployment6747137495success. RU/ZH HTTP200;
закрытый equipment endpoint404/private-no-store/noindex/nosniff, как предусмотрено.
Дополнительная проверка: четыре главные RU/KZ/EN/ZH, RU/ZH insights,
sitemap/robots/llms — HTTP200. POST /api/auth/register с пустым JSON —404,
private-no-store/noindex; GET этого POST-only адреса даёт обычный405 и не является
проверкой флага регистрации. Клиентский аккаунт/заявка при проверке не создавались.

## Vercel Production

Last7Days, интерфейс: **23Sep15:00–30Sep15:59**, последний день неполный.

| Показатель                              | Значение |
| --------------------------------------- | -------: |
| Visitors                                |      211 |
| Page Views                              |     1007 |
| Bounce Rate                             |      41% |
| click_whatsapp: visitors / events       |   8 / 10 |
| contact_context_copy: visitors / events |    1 / 2 |
| Google.com referrer visitors            |      102 |
| Yandex.kz / Yandex.ru referrer visitors |   34 / 7 |
| Bing.com referrer visitors              |        7 |
| Chatgpt.com referrer visitors           |        2 |

Популярные страницы: /ru/leads110, /ru104, /ru/map32, /ru/listings21,
/ru/minerals/gold21, /ru/services21, /ru/contact11. Строки страниц/источников не
нужно складывать как уникальных людей. Старые map/listings — исторические пути,
сейчас скрыты/перенаправляются; неделя смешивает версии сайта и наши проверки.
Казахстан85%, desktop48%/mobile48%/tablet3% (округление). UI +22% visitors/+25%
page views — сравнение Vercel с предыдущим периодом, не доказательство эффекта SEO.
10 кликов WhatsApp не равны10 отправленным сообщениям/лидам. Два referrer из ChatGPT
не доказывают независимую рекомендацию модели.

Источник: https://vercel.com/yerlans-projects-7b5aa914/qaznedr/analytics .
Чтение DOM и визуальная сверка; данные не подменяются прошлым снимком197/928.

## Google Search Console

Актуально прочитанный ресурс https://qaznedr.kz/, update7hAgo. Всё ещё фактические
**25–27Sep**:13кликов/61показ, CTR21.3%, средняяпозиция4.9. Та же малая выборка,
не обновлённый результат релизов29–30Sep. Видимые фразы: qaznedr ai3/3, казнедра3/3,
qaznedr1/2, недра кз0/9, карта золота вко0/2, jorc classification0/1,
field exploration services0/1. Большая часть видимых кликов брендовая.
Видимый chart прямо задаёт25Sep–27Sep. AI-отчёт в этой проверке не перечитывался;
предыдущие8показов документированы отдельно, не выдавать за новый замер.

Источник: https://search.google.com/search-console/performance/search-analytics?resource_id=https%3A%2F%2Fqaznedr.kz%2F .

## GA4 и Метрика

GA4 property556189696, выбранные2–29Sep (28дней), ресурс фактически создан28Sep.
Обзор трафика показывает5activeusers(KZ), page_view8, session_start7, first_visit5,
user_engagement2, contact_context_copy1. Эти агрегаты подтверждают наличие данных;
QA28Sep уже подтверждал одно contact_context_copy, поэтому нельзя считать весь
этот маленький объём клиентским. https://analytics.google.com/analytics/web/#/p556189696/reports/reportinghub .

Метрика113126250,24–30Sep:4посетителя,8визитов,9просмотров;2поисковых визита,
6внутренних переходов. https://metrika.yandex.ru/dashboard?id=113126250 .
Оба инструмента включаются только после существующего согласия. Автопоказ согласия
по просьбе владельца убран; поэтому эти цифры не полный трафик и не должны сходиться
с Vercel. Реклама/Вебвизор не включены, рекламные аудитории не объявляются готовыми.

## Формы

Read-only Supabase count exact/head: за23Sep10:00UTC–30Sep10:12UTC **2записи**
в inquiries; со26Sep тоже2. Телефоны/email не выбирались, данные не менялись.
Обе записи от26Sep имеют явные QA/test-маркеры в имени; у второй также в сообщении.
Проверены только редактированные boolean-флаги, имена/тексты не сохранены.
Клиентскими лидами эти2записи не считаются. WhatsApp/WeChat-разговоры этим подсчётом
не покрываются. Новых фиктивных заявок ради замера не создавали.

## Douyin

По новому разрешению владельца отправлены два информационных follow-up без документов,
полных телефонов или оплаты. Deep Reach:1a0f1c1fc209770f (15:00Алматы), Douyin support:
1a0f1c86deb792d2 (15:07Алматы). SENT/address/thread проверены повторным чтением Gmail.
Подробности и текст — docs/outreach/2026-09-28-china-accounts-handoff.md и dated TXT.
Готового аккаунта, цены/срока регистрации или окончательного допуска пока нет.

## Что делать дальше

Основной текущий замер общего потока — Vercel; GSC ждать новые полные даты и измерять
небрендовые запросы/страницы/языки. Для клиентов подтверждать сам разговор, не клик.
Продолжать согласованный закрытый каталог: safe image queue cleanup, затем отдельные
retention/quotas/lifecycle и простой утверждённый UI. Новый текст выбирать по спросу
и утверждать готовый вариант; sitemap/schema не обещают рекомендации всех LLM.
