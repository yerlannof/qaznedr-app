# MCP Servers Setup Guide для QAZNEDR.KZ

_Последнее обновление: 16 января 2025_
_Статус: ✅ ПОЛНОСТЬЮ РАБОТАЕТ после исправления конфигурации_

## ⚠️ КРИТИЧЕСКИ ВАЖНО: Правильное место конфигурации

### ✅ ГДЕ РАБОТАЕТ:

- **Глобальный файл:** `~/.claude.json`
- **В секции проекта:** `"/Users/yerlankulumgariyev/Documents/qaznedr-app"`
- **С полными env переменными в конфигурации**

### ❌ ГДЕ НЕ РАБОТАЕТ:

- Локальный `claude.json` в проекте
- Wrapper скрипты в `mcp-servers/`
- `.env.mcp` файлы
- Конфигурации через `claude mcp add`

## ✅ Работающие MCP серверы (13 активных)

### Системные серверы (работают из коробки):

- ✅ **filesystem** - доступ к файловой системе проекта
- ✅ **git** - работа с Git репозиторием
- ✅ **sequential-thinking** - разбивка сложных задач
- ✅ **brave-search** - веб-поиск
- ✅ **puppeteer** - веб-автоматизация
- ✅ **context7** - документация библиотек
- ✅ **task-manager** - управление задачами
- ✅ **firecrawl** - веб-скрапинг

### Интеграционные серверы:

- ✅ **github** - интеграция с GitHub API
- ✅ **supabase** - база данных Supabase
- ✅ **sentry-official** - мониторинг ошибок
- ✅ **gitlab-api** - работа с GitLab
- ✅ **cloudflare** - инфраструктура и деплой

## 📝 Правильная конфигурация MCP серверов

### Пример рабочей конфигурации в `~/.claude.json`:

```json
{
  "projects": {
    "/Users/yerlankulumgariyev/Documents/qaznedr-app": {
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
            "SENTRY_ACCESS_TOKEN": "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",
            "OPENAI_API_KEY": "sk-your-openai-api-key-here"
          }
        },
        "gitlab-api": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-gitlab"],
          "env": {
            "GITLAB_PERSONAL_ACCESS_TOKEN": "glpat-Z3O9cXr20UcjQlntEoCl8286MQp1OmkweDFxCw.01.121q1q87e",
            "GITLAB_API_URL": "https://gitlab.com/api/v4"
          }
        },
        "cloudflare": {
          "command": "npx",
          "args": ["-y", "@cloudflare/mcp-server-cloudflare", "run"],
          "env": {
            "CLOUDFLARE_API_TOKEN": "xJJspNr5_n63RGgU_a66qQ3wGguMBv3XuGYmNW_n",
            "CLOUDFLARE_ACCOUNT_ID": "319cb3df654a6e12750ba400721ec7e4"
          }
        }
      }
    }
  }
}
```

## 🚀 Как добавить новый MCP сервер

### Шаг 1: Найдите правильный файл

```bash
# Откройте глобальную конфигурацию
nano ~/.claude.json
# или
code ~/.claude.json
```

### Шаг 2: Найдите секцию вашего проекта

Найдите строку с путем к вашему проекту:

```json
"/Users/yerlankulumgariyev/Documents/qaznedr-app": {
```

### Шаг 3: Добавьте конфигурацию в mcpServers

```json
"mcpServers": {
  "your-server-name": {
    "command": "npx",
    "args": ["-y", "@package/name", "--any-args"],
    "env": {
      "API_KEY": "your-api-key-here"
    }
  }
}
```

### Шаг 4: Сохраните и перезапустите Claude

- Сохраните файл
- Полностью закройте Claude CLI
- Откройте заново в папке проекта
- Проверьте командой `/mcp`

## 🔧 Детали настроенных серверов

### 1. Sentry MCP Server

- **Организация:** yerlans-company
- **Проект:** javascript-nextjs
- **ID проекта:** 4510024878784592
- **Токен:** Сохранен в глобальном конфиге
- **⚠️ ТРЕБУЕТСЯ:** OpenAI API ключ для AI-powered поиска

### 2. GitLab MCP Server

- **API URL:** https://gitlab.com/api/v4
- **Токен:** Сохранен в глобальном конфиге
- **Права:** Full API access

### 3. Cloudflare MCP Server

- **Account ID:** 319cb3df654a6e12750ba400721ec7e4
- **Токен:** Сохранен в глобальном конфиге
- **Права:** Workers, Pages, DNS

## ❌ Что НЕ нужно делать

### Не используйте эти подходы (они НЕ работают):

1. **НЕ создавайте wrapper скрипты** - они не обрабатывают JSON-RPC протокол
2. **НЕ используйте локальный claude.json** - Claude CLI его игнорирует
3. **НЕ полагайтесь на .env файлы** - они не загружаются автоматически
4. **НЕ используйте `claude mcp add`** - создает неправильную конфигурацию

## 🛡️ Безопасность

- **НИКОГДА** не коммитьте `~/.claude.json` в Git
- Регулярно обновляйте токены
- Используйте минимально необходимые права доступа
- Храните бэкапы конфигурации в безопасном месте

## 📊 Проверка статуса

### Команды для проверки:

```bash
# В Claude CLI
/mcp              # Показать список MCP серверов
/mcp info NAME    # Информация о конкретном сервере

# В терминале
cat ~/.claude.json | grep -A 20 qaznedr-app
```

### Признаки правильной работы:

- ✅ Сервер показывает "connected" в `/mcp`
- ✅ Инструменты сервера доступны в автодополнении
- ✅ Нет ошибок при запуске Claude

### Признаки проблем:

- ❌ Сервер показывает "failed"
- ❌ Сервер не появляется в списке
- ❌ Ошибки JSON-RPC в логах

---

_Этот документ содержит проверенную рабочую конфигурацию MCP серверов для проекта QAZNEDR.KZ_
