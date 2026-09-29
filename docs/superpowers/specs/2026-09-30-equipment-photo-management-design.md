# Управление закрытыми фотографиями техники

Старт HEAD/origin/Production `bf1f896`, deployment6746167282success.
Продолжение утверждённой закрытой основы; новый публичный UI/текст не добавляется.

## Контракт

- Флаг `EQUIPMENT_MARKETPLACE_ENABLED` по умолчанию off. Не применять миграции
  в production, не включать регистрацию/Google/флаг и не снимать legacy308.
- DELETE `/api/equipment-listings/[id]/images/[imageId]` принимает strict JSON
  `{expectedRevision}`. PUT `/api/equipment-listings/[id]/images` принимает
  `{expectedRevision,imageIds}` — полный уникальный список текущих фото (0–8).
  Owner UUID только из NextAuth, exact configured Origin, fatal UTF-8, до4KiB,
  JSON, no unknown fields. Чужое объявление404, stale/архив409, invalid400.
- RPC под блокировкой listing FOR UPDATE повторно сверяет owner/revision/state,
  проверяет точный полный набор ID. Изменение порядка или удаление повышают revision,
  ACTIVE→PENDING_MODERATION, event в одной транзакции. Тождественный порядок —
  без изменения revision/event/status. Удаление уплотняет позиции0..n-1.
- DELETE атомарно удаляет attachment и ставит его точный серверный storage path
  в закрытую очередь `equipment_image_deletions`. Storage.remove в HTTP/репозитории
  не вызывается: неизвестный исход RPC не позволяет безопасно удалять байты.
  Отложенная физическая очистка/retention требует отдельного проверенного worker
  и решения перед запуском. После удаления owner/admin proxy больше не отдаёт фото.
  Это логическое удаление доступа, не обещание мгновенного удаления всех байтов.
- Для перестановки уникальность listing/position становится DEFERRABLE;
  RPC откладывает только этот constraint и проверяет его до возврата.
- Admin GET `/api/admin/equipment-listings/[id]/images?expectedRevision=N` и
  `/images/[imageId]?expectedRevision=N`: requireAdmin, не UUID-only для
  действующего env-admin. Только PENDING_MODERATION и точная ревизия, snapshot
  RPC с FOR SHARE возвращает согласованный набор фото. Non-admin403,
  отсутствующая/неpending запись404, stale409. Без owner/contact/storage paths в HTTP.
- Приватные байты скачиваются только по подтверждённому snapshot/path; нет signed
  URL, public Storage URL или клиентских путей. Фото не кэшируются. Каждый ответ
  private/no-store/noindex/nosniff, feature off404 до auth/Storage.

## Проверка

Тесты сначала: роль/флаг/UUID/owner/origin/UTF-8/body/strict shape, stale/archive,
полный список/дубликат/чужое фото, no-op, safe projections, отсутствие inline remove,
ошибки/неизвестный RPC, moderator snapshot/version и server-only функции.
Изолированная PostgreSQL: grants/RLS, swap, compaction, no-op, rollback, очередь,
snapshot и реальные параллельные delete/reorder против старого approval.
Полный Jest baseline2292pass/27known failures (CSRF timing может колебаться),
ESLint/build, независимое сильное ревью и живые default-off HTTP после pushmaster.

Публичных экранов/стилей/языков этот выпуск не меняет. Визуальная матрица не
доказывает серверный lifecycle; проверяем HTTP и SQL, существующий сайт200.
