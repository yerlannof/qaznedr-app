# Закрытая единая идентичность — 29.09.2026

## Изменение

Один NextAuth config теперь используется и текущими, и legacy server imports. Credentials авторизует только существующего env-admin; удалён неработающий fallback к паролям legacy users через anon-клиент. Административный shortcut проверяет одновременно нормализованный email и точный `env-admin:` ID.

Подготовленный Google вход появляется лишь при `MARKETPLACE_IDENTITY_ENABLED=true` и обеих Google credentials. Callback требует настоящий boolean verified email, совпадение subject/providerAccountId и email/user. Зарезервированный email администратора отклоняется. Привязки только по email нет.

Service-only RPC атомарно создаёт marketplace_accounts + profiles с одним UUID и ролью user. Повтор возвращает прежний ID, сохраняет роль и изменения профиля. Конфликты/смена email требуют отдельного процесса. Пароли, OAuth токены и документы не сохраняются. Функция возвращает клиенту общую ошибку без деталей БД.

## Проверка

- TDD: до изменения 4 падения единой конфигурации/callback/credentials и 2 падения admin identity; после — 19 focused pass в трёх наборах.
- Полный Jest: 1825 pass, 28 прежних failures, 6 прежних наборов (пять legacy + flaky CSRF), новых нет. Лог `/tmp/qaznedr-identity-full-jest.log`.
- ESLint, TypeScript и production build успешны. Логи `/tmp/qaznedr-identity-{build,tsc}.log`.
- Отдельный сильный reviewer проверил SQL-права, атомарность, отсутствие email-linking, env-admin и фактический NextAuth signIn→JWT flow: Ready.
- Изолированная локальная PostgreSQL: anon/authenticated не читают profiles/accounts и не вызывают RPC; повтор сохраняет роль/имя; конфликты не оставляют account; ошибка insert профиля откатывает account. Дополнительно пять конкурентных первых входов одного subject/email вернули один ID и создали одну запись. Тестовая БД удалена. Production SQL не запускался.
- Локальный production сервер: `/api/auth/providers`200 и только credentials; POST register404; GET equipment/admin equipment404; RU главная и статья о старательстве200. UI не менялся, визуальная матрица повторно не прогонялась.

## Граница выпуска и продолжение

Это подготовка надёжной идентичности, не запуск регистрации. Миграция не применена в production; флаги закрыты. Живой Google OAuth и конечный пользовательский сценарий ещё не проверены. Отдельные callback/JWT и SQL тесты не выдаются за end-to-end OAuth.

Перед применением миграции обязательно перевести нужные legacy обращения к profiles на серверный API с NextAuth session, собственным ID, ограниченными полями и проверкой origin. Нельзя просто заменить anon на service_role во всех legacy helpers: это может расширить доступ. Далее — безопасная загрузка фото, квоты и утверждённая простая форма. Публичный запуск требует выбранного процесса входа/восстановления, условий площадки и полной проверки registration→login→draft→moderation.

Стартовая база4cede1c. Параллельный выпуск пустой витрины6615d30 учтён; перед коммитом HEAD/origin/master/Production совпали. Heartbeat mail-review сохранён отдельно, в коммит идентичности не включается. CI и exact-SHA production проверяются после push; результат сообщается владельцу отдельно.
