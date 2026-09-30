# Закрытая очередь удаления фотографий техники

Продолжение roadmap после d10a186. HEAD/origin/Production совпадают, deployment6747137495success.
Публичные экраны, тексты и дизайн не меняются. Production migrations/flags остаются выключены.

## Контракт

- Worker обслуживает только существующую очередь `equipment_image_deletions`; orphan uploads,
  сроки хранения остальных материалов, квоты и полный Storage lifecycle — отдельные этапы.
- Атомарный bounded claim через service-role-only RPC, `FOR UPDATE SKIP LOCKED`, lease,
  случайный claim token и attempts. Claim/ack/fail/expiry исключают одновременное владение
  задачей; устаревший token не может подтвердить или изменить новое владение.
- Task хранит только точный исходный UUID listing/image и путь `listing/image.webp`.
  Завершённая запись остаётся tombstone; повторная привязка её ID/path запрещена.
- SQL guards сериализуют attach и очередь на parent listing и общем image ID, включая прямые service-role
  INSERT/UPDATE; нельзя поставить в очередь привязанные байты или возродить queued path.
  Параметры lease/batch/retry ограничены, пути и identity очереди неизменяемы.
  Поддерживается READ COMMITTED; при другой изоляции guards отклоняют запись,
  чтобы старый snapshot не позволял одновременно привязать и поставить в очередь файл.
- Worker не берёт путь из HTTP/CLI-параметров. До Storage валидирует claim-проекцию,
  работает только с bucket `equipment-images` и ровно одним очередным exact path.
  Storage success (в том числе уже отсутствующий объект) → ack. При Storage error или
  неизвестном исходе/сбое ack запись не считается завершённой; повтор идемпотентен.
- Один проход CLI, явный opt-in, отдельные env для URL/service-role ключа целевой среды.
  Каждая задача получает свежий claim отдельно; медленная первая задача не расходует
  попытки остальных. CLI ограничивает каждый сетевой запрос 20 секундами при lease 120 секунд.
  Никаких новых HTTP routes/cron или автоматического запуска на deploy; секреты/пути/PII
  не печатаются. В этой сессии CLI на production не запускается.
- После bounded числа попыток — задача для ручного разбора, без бесконечной горячей петли.
  Не включать очистку рабочего bucket без отдельной проверки activation/lifecycle.

## Доказательства

TDD SQL: роли/RLS, claims, token fencing, expiry, completed tombstone, reattach guard,
rollback и malformed arguments. Реальные PostgreSQL concurrency cases: два claim,
queue/attach race. Jest: exact-path/bucket, bounded validation, remove/ack/retry failures,
crash after removal, no completion without success. Targeted/full Jest, ESLint/typecheck/build,
независимое сильное ревью всего session diff, prod success и default-off HTTP.

Новый публичный UI отсутствует, поэтому обычная визуальная матрица не доказывает
cleanup; существующие RU/KZ/EN/ZH страницы проверяются на сохранение доступности.
