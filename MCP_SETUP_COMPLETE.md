# ✅ MCP Серверы настроены!

## Установленные MCP серверы

Я установил и настроил следующие MCP серверы для вашего проекта:

### 1. **filesystem** - Доступ к файловой системе
- **Команда**: `npx @modelcontextprotocol/server-filesystem`
- **Путь**: `/Users/yerlankulumgariyev/Documents/qaznedr-app`
- **Статус**: ✅ Настроен

### 2. **postgres** - PostgreSQL для Supabase
- **Команда**: `npx enhanced-postgres-mcp-server`
- **Статус**: ⚠️ Требует настройки credentials
- **Необходимо**: Добавить данные Supabase в `.env.mcp`

### 3. **git** - Git операции
- **Команда**: `npx @cyanheads/git-mcp-server`
- **Статус**: ✅ Настроен

## Что нужно сделать вам

### 1. Настройте Supabase credentials

Создайте файл `.env.mcp` в корне проекта:

```bash
cp .env.mcp.example .env.mcp
```

Отредактируйте `.env.mcp` и добавьте ваши данные Supabase:

```env
POSTGRES_HOST=db.YOUR_PROJECT_ID.supabase.co
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_actual_password
```

Получить эти данные можно здесь:
https://app.supabase.com/project/_/settings/database

### 2. Обновите .mcp.json

Откройте `.mcp.json` и замените placeholder'ы на реальные значения:
- `YOUR_PROJECT_ID` → ваш ID проекта Supabase
- `YOUR_DATABASE_PASSWORD` → ваш пароль от БД

### 3. Перезапустите Claude Code

Закройте текущую сессию и запустите новую:

```bash
# Выйдите из текущей сессии
exit

# Запустите новую
claude
```

### 4. Проверьте MCP серверы

В новой сессии Claude выполните:

```
/mcp list
```

Вы должны увидеть:
- filesystem ✓
- postgres ✓
- git ✓

## Тестовые команды

После настройки попробуйте эти команды в Claude:

```
# Файловая система
Покажи файлы в директории src

# Git
Покажи последние коммиты

# Supabase (после настройки)
Покажи таблицы в базе данных Supabase
```

## Установленные npm пакеты

Глобально установлены:
- `@modelcontextprotocol/server-filesystem`
- `enhanced-postgres-mcp-server` 
- `@cyanheads/git-mcp-server`

## Файлы конфигурации

Созданы следующие файлы:
- `.mcp.json` - локальная конфигурация MCP для проекта
- `.env.mcp.example` - пример переменных окружения
- `MCP_SETUP_GUIDE.md` - полное руководство
- `CLAUDE_CODE_QUICK_START.md` - быстрый старт

## Важно!

⚠️ **Не коммитьте файлы с credentials:**
- `.env.mcp` (добавьте в .gitignore)
- `.mcp.json` с реальными паролями

## Проблемы?

Если MCP серверы не работают:

1. Убедитесь, что npm пакеты установлены:
```bash
npm list -g | grep modelcontextprotocol
npm list -g | grep postgres-mcp
npm list -g | grep git-mcp
```

2. Проверьте конфигурацию:
```bash
claude mcp list
```

3. Переустановите сервер:
```bash
claude mcp remove [имя]
claude mcp add [имя] "npx @package/name"
```

---

🎉 **Готово!** После добавления Supabase credentials и перезапуска Claude, все MCP серверы будут работать.