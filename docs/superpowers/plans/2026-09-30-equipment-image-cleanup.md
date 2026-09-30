# План: закрытая очистка фотографий

1. Red SQL tests/fixture and Jest worker tests; сохранить исходное падение.
2. Новая миграция `supabase/migrations/20260930_equipment_image_cleanup.sql`:
   claim/ack/fail lease/token и tombstone, exact-path и SQL race guards, права.
3. Worker `src/lib/equipment-listings/image-cleanup.ts`, тест
   `src/__tests__/lib/equipment-listings/image-cleanup.test.ts`, CLI
   `scripts/process-equipment-image-deletions.ts` без подключения к приложению/cron.
4. SQL `scripts/test-equipment-image-cleanup.sql` и реальные гонки
   `scripts/test-equipment-image-cleanup-races.py` на отдельной удаляемой fixture.
5. Ведущий проверяет весь diff; независимый сильный агент review; исправить находки.
6. Targeted/full Jest с текущей baseline, lint/format/typecheck/build; production
   migrations/флаги не применять. Публичные формы/дизайн не менять.
7. Отчёт/roadmap, явные git paths, pushmaster, CI/Production success, HTTP
   публичных языков и закрытых endpoints, final sync. Почтовые черновики отдельно.

Параллельная работа ведущего: свежие агрегированные analytics/GSC, отправка разрешённых
уточнений Douyin/Deep Reach, фиксация подтверждённых отправок и метрик.
