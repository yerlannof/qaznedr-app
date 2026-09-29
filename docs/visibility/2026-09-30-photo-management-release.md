# Закрытое управление фотографиями техники — 30.09.2026

Начало: HEAD/origin/master/Production `bf1f896`, deployment6746167282success.
Техническое продолжение закрытого каталога; новый публичный интерфейс и тексты
не добавлены. Production-миграции не применялись, регистрация/Google/флаг каталога
не включались; legacy redirects и данные геобазы не менялись.

## Поведение

Владелец может удалить фото или передать полный уникальный порядок0–8фото через
закрытый API. Проверяются session-owner UUID, configured Origin, strict JSON,
реальный лимит4KiB/fatal UTF-8 и ожидаемая версия. В SQL listing FOR UPDATE
повторно проверяет owner/status/version; изменённый порядок и удаление обновляют
revision/event атомарно, ACTIVE возвращается на модерацию. DRAFT/REJECTED
сохраняют статус. Тождественный порядок не меняет revision/status/event.

Удаление снимает attachment и уплотняет позиции; его точный серверный путь
атомарно ставится в закрытую очередь `equipment_image_deletions`. HTTP не вызывает
Storage.remove даже при неизвестном результате RPC. Физические байты остаются
приватными до отдельного проверенного cleanup worker; это не мгновенное удаление
всех копий. Запрос, начатый после удаления, не найдёт attachment; уже начатый
download может завершиться. Снимок модерации фиксирует версию, последующее
одобрение использует revision CAS.

Модератор (включая действующего env-admin) получает только PENDING_MODERATION
и точную ревизию через FOR SHARE snapshot. В HTTP — safe metadata без owner,
контактов/storage paths; байты скачиваются только по проверенному пути снимка.
Любое старое одобрение после изменения отклоняется. Все API-ответы private,
no-store/noindex/nosniff, feature off404 раньше auth/Storage.

## Доказательства

- SQL TDD red: отсутствующий `remove_equipment_image` дал ожидаемое
  `assertion failed: delete RPC exists`. Green в отдельной локальной PostgreSQL
  со Storage fixture/FK: grants/RLS, swap/compaction/no-op, missing/duplicate/
  foreign/null/multidimensional IDs, stale/archive/owner, snapshot, события/очередь.
  Injected audit failure после queue/image writes откатывает все изменения.
  Старый `scripts/test-equipment-images.sql` также прошёл на новой миграции.
- Пять настоящих параллельных транзакций: delete/reorder против old approval,
  approval против old delete, FOR SHARE preview против delete, no-op против
  approval. Наблюдатель подтвердил реальный Lock wait второго соединения,
  ожидаемые40001/успех и итоговые image/order/event/queue. Физические objects
  не удалялись. `proofs/2026-09-30-photo-management/sql-races.json`.
- HTTP/API TDD: missing admin route red→green. Личное ревью выявило successful
  REJECTED RPC→503; regression red→green исправил этот случай. Malformed snapshot
  не скачивает bytes; malformed/unknown mutation не удаляет Storage.
- Focused Jest39pass. Full Jest2305pass/28failures:27 прежних из пяти legacy
  наборов + известный timing flakeCSRF на неизменном коде. Новых failures нет.
  ESLint/TypeScript/build успешны, diff whitespace clean.
- Независимое сильное ревью: Ready, P1/P2нет; reviewer лично повторил32теста и
  прочитал SQL/пять гонок/rollback test. Ограничение полного Storage/HTTP lifecycle
  остаётся до открытия каталога.
- Собранный локальный сервер:10 HTTP-проверок, GET/POST/read/DELETE/PUT и
  admin list/read/register404 с no-store/noindex/nosniff, RU/ZH200.
  `proofs/2026-09-30-photo-management/local-http.json`.

## Выпуск

Код `d763b8aa60e7f4fb200d36f63c121fa653c37ec3`: CI36640496110success,
Production6747060073success (29.09.2026 22:38 UTC). CI разрешает exit1
тестового шага для известной baseline; вывод о новых failures основан на
отдельном полном локальном сравнении, а не только зелёном CI. Живые10 HTTP checks
прошли: новые/старые фото-методы и регистрация404 с приватными заголовками,
RU/ZH200. `proofs/2026-09-30-photo-management/production-http.json`.

Публичные маршруты, metadata/sitemap/LLM-доступность не менялись, IndexNow для
закрытого API не нужен. Production-миграции/флаги не менялись. Локальные сервер3107
и отдельная fixture-БД остановлены/удалены. Следующий служебный checkpoint
фиксирует отчёт/roadmap; его exact CI/Production SHA проверяется отдельно.

## Продолжение

Cleanup worker/retention и квоты, полный auth/profile/Storage/HTTP lifecycle в
отдельном тестовом окружении. Далее утверждённая удобная форма и экран модератора.
Каталог ещё не открыт посетителям. Это не доказательство роста SEO/трафика.
Mail/outreach dirty journals исключить из этого выпуска.
