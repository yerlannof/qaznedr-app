# План IndexNow

1. Sol: тесты `src/__tests__/api/indexnow.route.test.ts`, red на исходном обработчике. Логи в `/tmp/qaznedr-indexnow-red.log`.
2. Sol: минимальное изменение `src/app/api/indexnow/route.ts`; green, точечный ESLint. Не менять другие пути, не отправлять реальные пинги, не коммитить.
3. Astra: личное ревью кода/доказательств; полный Jest/build, проверка GET/403 в локальной сборке.
4. Независимый сильный агент: весь diff против спецификации и account-operations; исправить замечания.
5. Astra: обновить roadmap и факты входа Bilibili/роли администратора. Форматирование, явные пути commit, push master; дождаться Production success и проверить GET/403 и публичные ZH страницы.

CI format baseline (34 файла исторических HTML/CJS и verification-файлы) записан отдельно; эти файлы не переписывать ради данной правки. Поведенческие legacy-тесты не чинить.
