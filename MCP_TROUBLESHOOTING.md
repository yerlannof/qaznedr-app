# 🔧 MCP Troubleshooting Guide

_Последнее обновление: 16 января 2025_
_Статус: Документирует все известные проблемы и решения_

## 🚨 ГЛАВНАЯ ПРОБЛЕМА И РЕШЕНИЕ

### Проблема:

MCP серверы показывают статус "failed" в Claude CLI, хотя конфигурация кажется правильной.

### Причина:

Claude CLI читает конфигурацию MCP серверов ТОЛЬКО из глобального файла `~/.claude.json`, а НЕ из локального `claude.json` в проекте.

### Решение:

Настройте MCP серверы в глобальном файле `~/.claude.json` в секции вашего проекта.

## ❌ Что НЕ работает (проверено)

### 1. Локальный claude.json

**Проблема:** Файл `claude.json` в корне проекта игнорируется для MCP серверов

```json
// ЭТО НЕ РАБОТАЕТ
// /Users/yerlankulumgariyev/Documents/qaznedr-app/claude.json
{
  "mcpServers": {
    "sentry-official": { ... }
  }
}
```

**Почему:** Claude CLI ищет MCP конфигурацию только в глобальном файле

### 2. Wrapper Scripts

**Проблема:** Скрипты-обертки не работают правильно

```javascript
// ЭТО НЕ РАБОТАЕТ
// mcp-servers/sentry-wrapper.js
process.env.SENTRY_ACCESS_TOKEN = 'token';
require('@sentry/mcp-server');
```

**Почему:**

- Не обрабатывают JSON-RPC протокол правильно
- Не передают stdio между процессами
- Теряются environment переменные

### 3. Использование .env файлов

**Проблема:** Environment переменные из файлов не загружаются

```bash
# ЭТО НЕ РАБОТАЕТ
# .env.mcp
SENTRY_ACCESS_TOKEN=token
```

**Почему:** MCP серверы не загружают .env файлы автоматически

### 4. Команда claude mcp add

**Проблема:** Создает неправильную конфигурацию

```bash
# ЭТО СОЗДАЕТ ПРОБЛЕМЫ
claude mcp add sentry-official 'npx @sentry/mcp-server'
```

**Почему:**

- Не добавляет environment переменные
- Создает конфигурацию с неправильной структурой
- Может конфликтовать с существующими настройками

## ✅ Единственное рабочее решение

### Шаг 1: Откройте глобальный конфиг

```bash
nano ~/.claude.json
# или
code ~/.claude.json
```

### Шаг 2: Найдите секцию проекта

```json
{
  "projects": {
    "/Users/yerlankulumgariyev/Documents/qaznedr-app": {
      // Здесь должна быть конфигурация
    }
  }
}
```

### Шаг 3: Добавьте правильную конфигурацию

```json
"mcpServers": {
  "sentry-official": {
    "command": "npx",
    "args": [
      "-y",
      "@sentry/mcp-server",
      "--organization-slug=yerlans-company",
      "--project-slug=javascript-nextjs"
    ],
    "env": {
      "SENTRY_ACCESS_TOKEN": "your-token-here"
    }
  }
}
```

### Шаг 4: Перезапустите Claude

- Полностью закройте Claude CLI
- Откройте заново
- Проверьте: `/mcp`

## 🐛 Частые ошибки и решения

### Ошибка: "failed" статус в /mcp

**Симптомы:**

- Сервер показывает красный крестик
- Статус "failed" в списке

**Решения:**

1. Проверьте что конфигурация в глобальном файле
2. Проверьте правильность токенов
3. Проверьте синтаксис JSON
4. Полностью перезапустите Claude (не просто новую сессию)

### Ошибка: Сервер не появляется в списке

**Симптомы:**

- Сервер отсутствует в `/mcp`
- Нет даже "failed" статуса

**Решения:**

1. Убедитесь что вы в правильной папке проекта
2. Проверьте путь в глобальном конфиге точно совпадает
3. Проверьте нет ли синтаксических ошибок в JSON

### Ошибка: "Command not found"

**Симптомы:**

- Ошибка при попытке использовать инструменты MCP
- "command not found" в логах

**Решения:**

1. Используйте `npx -y` вместо прямого вызова
2. Убедитесь что пакет существует в npm
3. Проверьте правильность имени пакета

### Ошибка: Environment переменные не работают

**Симптомы:**

- Сервер запускается но не авторизован
- API вызовы возвращают 401/403

**Решения:**

1. Добавьте переменные в блок `"env"` в конфигурации
2. НЕ полагайтесь на системные переменные
3. НЕ используйте .env файлы

### Ошибка: Sentry требует OPENAI_API_KEY

**Симптомы:**

- "OPENAI_API_KEY environment variable is required for semantic search"
- "Configuration Error" при использовании Sentry инструментов

**Причина:**
Sentry MCP использует OpenAI для AI-powered поиска и семантического анализа ошибок.

**Решения:**

1. **Получите OpenAI API ключ:**
   - Зайдите на https://platform.openai.com/api-keys
   - Создайте новый API ключ
   - Добавьте в конфигурацию Sentry:

   ```json
   "env": {
     "SENTRY_ACCESS_TOKEN": "your-sentry-token",
     "OPENAI_API_KEY": "sk-your-openai-key-here"
   }
   ```

2. **Обходное решение (БЕЗ OpenAI ключа):**
   Создан специальный скрипт `scripts/sentry-api.js` который работает напрямую с Sentry API:

   ```bash
   # Все команды
   node scripts/sentry-api.js all

   # Только ошибки
   node scripts/sentry-api.js issues 10

   # Информация о проекте
   node scripts/sentry-api.js project
   ```

   **Преимущества:**
   - ✅ Не требует OpenAI API ключ
   - ✅ Полный доступ к Sentry API
   - ✅ Работает с Claude как есть

   **Почему так:**
   - Sentry MCP разработан для OpenAI/ChatGPT
   - Claude от Anthropic не совместим
   - Прямой API обходит эту проблему

## 📝 Checklist для диагностики

### Быстрая проверка:

- [ ] Конфигурация в `~/.claude.json`? (НЕ в локальном claude.json)
- [ ] В правильной секции проекта?
- [ ] Есть блок `"env"` с токенами?
- [ ] Используется `"command": "npx"` с `"args": ["-y", ...]`?
- [ ] Claude полностью перезапущен после изменений?

### Проверка конфигурации:

```bash
# Проверить что конфигурация на месте
cat ~/.claude.json | grep -A 30 "qaznedr-app"

# Проверить валидность JSON
cat ~/.claude.json | jq .

# Проверить список MCP в Claude
Откройте Claude и введите: /mcp
```

### Тест отдельного сервера:

```bash
# Sentry
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | \
SENTRY_ACCESS_TOKEN=your-token \
npx -y @sentry/mcp-server --organization-slug=yerlans-company --project-slug=javascript-nextjs

# GitLab
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | \
GITLAB_PERSONAL_ACCESS_TOKEN=your-token \
GITLAB_API_URL=https://gitlab.com/api/v4 \
npx -y @modelcontextprotocol/server-gitlab

# Cloudflare
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | \
CLOUDFLARE_API_TOKEN=your-token \
CLOUDFLARE_ACCOUNT_ID=your-account-id \
npx -y @cloudflare/mcp-server-cloudflare run
```

## 🎯 Итоговые правила

### ДЕЛАЙТЕ:

- ✅ Используйте глобальный `~/.claude.json`
- ✅ Добавляйте полную конфигурацию с env
- ✅ Используйте `npx -y` для автоустановки
- ✅ Перезапускайте Claude полностью

### НЕ ДЕЛАЙТЕ:

- ❌ Не используйте локальный claude.json
- ❌ Не создавайте wrapper скрипты
- ❌ Не полагайтесь на .env файлы
- ❌ Не используйте `claude mcp add`

## 📚 Дополнительные ресурсы

- [MCP_COMPLETE_GUIDE.md](./MCP_COMPLETE_GUIDE.md) - Полное руководство
- [MCP_SERVERS_SETUP.md](./MCP_SERVERS_SETUP.md) - Инструкции по настройке
- [CLAUDE.md](./CLAUDE.md) - Общая документация проекта

---

_Этот документ основан на реальном опыте отладки MCP серверов в проекте QAZNEDR.KZ_
