# Закрытый собственный профиль

Продолжение поручения «давай дальше» после единой идентичности b3f6bfd. UI и публичные тексты не меняются.

- Существующие GET/PUT `/api/profile` и POST `/api/profile/setup` используют один NextAuth и новый server-only repository. Все три закрыты404 до MARKETPLACE_IDENTITY_ENABLED=true, до любых auth/DB вызовов.
- Источник владельца — только UUID session.user.id, никогда query/body/email. Нет создания/апсерта: профиль создаёт только атомарный identity RPC. Env-admin не выдаётся за UUID аккаунта.
- GET возвращает собственные id/имя/email/тип/контакт/описание/место/сайт/виды услуг; role, trust, verification documents и служебные поля не выдаются. Ответы private/no-store/noindex, ошибки общие.
- PUT принимает непустой строгий allowlist безопасных полей. Имя непустое, строки ограничены; телефон E.164, сайт HTTPS без credentials; необязательные пустые строки обнуляются. Нельзя менять ID/email/роль/аватар/проверку личности. POST setup меняет только известный profile_type. Прежние JSON-конверты сохранены.
- Мутации требуют настроенный exact Origin, не cross-site, application/json; потоковый предел16KiB и строгий UTF-8/JSON. Нет чтения бесконечного request.json. Ошибки400/401/403/404/413/415/503.
- Legacy anon helpers и listing API не переводятся на service_role оптом. Аудит оставшихся consumers фиксируется; запрещённые прямые обращения не открываются этим выпуском. Migration profiles/accounts пока не применяется на проде.
- Приёмка: default-off; чужой ID/role injection; сессия без ID; GET privacy; missing vs DB failure; malformed/oversize/chunked bodies; origin/content-type; разрешённый update + повторный GET; setup только тип. Реальный OAuth/БД/публичный UI не заявляются проверенными через мок-тесты.
