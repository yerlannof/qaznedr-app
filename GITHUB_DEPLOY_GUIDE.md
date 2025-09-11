# 📚 Полный гайд по развертыванию проекта на GitHub и работе с двух компьютеров

## 🚀 Часть 1: Загрузка проекта на GitHub

### Шаг 1: Создайте GitHub аккаунт (если еще нет)
1. Зайдите на https://github.com
2. Нажмите "Sign up" и создайте аккаунт

### Шаг 2: Создайте новый репозиторий
1. Войдите в GitHub
2. Нажмите зеленую кнопку "New" или "+" в правом верхнем углу → "New repository"
3. Заполните:
   - Repository name: `qaznedr-app`
   - Description: `QAZNEDR.KZ - Kazakhstan mining platform`
   - Выберите "Public" (бесплатно)
   - НЕ ставьте галочки "Add README" и другие
4. Нажмите "Create repository"

### Шаг 3: Загрузите проект на GitHub
Скопируйте и выполните эти команды в терминале:

```bash
cd /home/yerla/qaznedr-app

# Если git еще не инициализирован:
git init
git add .
git commit -m "Initial commit"

# Подключите ваш репозиторий (замените YOUR_USERNAME на ваш GitHub username):
git remote add origin https://github.com/YOUR_USERNAME/qaznedr-app.git

# Загрузите код:
git branch -M main
git push -u origin main
```

Если попросит логин/пароль:
- Username: ваш GitHub username
- Password: НЕ пароль от аккаунта, а Personal Access Token (см. ниже)

### Шаг 4: Создание Personal Access Token (если нужно)
1. Зайдите в GitHub → Settings (кликните на аватарку справа вверху)
2. Прокрутите вниз → "Developer settings"
3. "Personal access tokens" → "Tokens (classic)" → "Generate new token"
4. Дайте имя токену (например, "qaznedr-deploy")
5. Выберите срок действия (рекомендую 90 days)
6. Поставьте галочки: `repo` (все подпункты)
7. Нажмите "Generate token"
8. СКОПИРУЙТЕ ТОКЕН СРАЗУ! (показывается только один раз)

## 💻 Часть 2: Настройка на другом компьютере

### Шаг 1: Установите необходимое ПО
```bash
# Установите Node.js (версия 18 или выше)
# Windows: скачайте с https://nodejs.org
# Mac: brew install node
# Linux: sudo apt install nodejs npm

# Установите Git
# Windows: https://git-scm.com/download/win
# Mac: brew install git
# Linux: sudo apt install git

# Установите Claude CLI
npm install -g @anthropic-ai/claude-cli
```

### Шаг 2: Клонируйте проект
```bash
# Создайте папку для проектов
mkdir ~/projects
cd ~/projects

# Клонируйте репозиторий (замените YOUR_USERNAME):
git clone https://github.com/YOUR_USERNAME/qaznedr-app.git
cd qaznedr-app

# Установите зависимости:
npm install

# Создайте базу данных:
npx prisma generate
npx prisma db push
```

### Шаг 3: Настройте переменные окружения
```bash
# Скопируйте пример:
cp .env.example .env.local

# Откройте .env.local и заполните:
# DATABASE_URL="file:./prisma/dev.db"
# NEXTAUTH_SECRET="сгенерируйте командой: openssl rand -base64 32"
# NEXTAUTH_URL="http://localhost:3000"
```

### Шаг 4: Запустите проект
```bash
npm run dev
# Откройте http://localhost:3000
```

## 🔧 Часть 3: Установка всех MCP серверов на новом компьютере

Создайте файл `install-mcp-servers.sh`:

```bash
#!/bin/bash

echo "🚀 Устанавливаем все MCP серверы..."

# Базовые MCP серверы
claude mcp add brave-search "npx @modelcontextprotocol/server-brave-search"
claude mcp add memory-keeper "npx @modelcontextprotocol/server-memory"
claude mcp add puppeteer "npx @modelcontextprotocol/server-puppeteer"
claude mcp add desktop-commander "npx @modelcontextprotocol/server-filesystem"
claude mcp add docker "npx docker-mcp"
claude mcp add task-manager "npx @modelcontextprotocol/server-everything"
claude mcp add firecrawl "npx firecrawl-mcp"
claude mcp add thread-continuity "npx @modelcontextprotocol/server-sequential-thinking"
claude mcp add git "npx mcp-git"
claude mcp add context7 "npx @modelcontextprotocol/server-github"

# Серверы с дублированными командами (переименованы)
claude mcp add fetch "npx @modelcontextprotocol/server-memory"
claude mcp add sqlite "npx @modelcontextprotocol/server-puppeteer"
claude mcp add supabase "npx @modelcontextprotocol/server-filesystem"
claude mcp add time "npx docker-mcp"

# Shopify серверы (требуют токены)
echo "⚠️  Shopify серверы требуют токены. Установите вручную:"
echo "claude mcp add shopify-api \"npx shopify-mcp --accessToken YOUR_TOKEN --domain YOUR_DOMAIN.myshopify.com\""
echo "claude mcp add shopify-dev \"npx -y @shopify/dev-mcp@latest\""

echo "✅ Установка завершена!"
```

Сделайте файл исполняемым и запустите:
```bash
chmod +x install-mcp-servers.sh
./install-mcp-servers.sh
```

## 🔄 Часть 4: Синхронизация изменений между компьютерами

### На компьютере где вы работали:
```bash
# Сохраните изменения:
git add .
git commit -m "Описание изменений"
git push
```

### На другом компьютере:
```bash
# Получите изменения:
git pull

# Если изменились зависимости:
npm install

# Если изменилась схема БД:
npx prisma generate
npx prisma db push
```

## 📝 Часть 5: Работа с Claude на новом компьютере

1. **Откройте проект в Claude:**
   ```bash
   cd ~/projects/qaznedr-app
   claude
   ```

2. **Claude автоматически прочитает:**
   - `/home/yerla/qaznedr-app/CLAUDE.md` - инструкции проекта
   - `/home/yerla/CLAUDE.md` - ваши общие настройки (скопируйте этот файл тоже!)

3. **Для переноса общих настроек:**
   ```bash
   # На старом компьютере:
   cp /home/yerla/CLAUDE.md ~/qaznedr-app/CLAUDE_GLOBAL.md
   git add CLAUDE_GLOBAL.md
   git commit -m "Add global Claude settings"
   git push

   # На новом компьютере:
   git pull
   cp ~/projects/qaznedr-app/CLAUDE_GLOBAL.md ~/CLAUDE.md
   ```

## 🎯 Быстрый чек-лист для нового компьютера:

- [ ] Установлен Node.js 18+
- [ ] Установлен Git
- [ ] Установлен Claude CLI
- [ ] Клонирован репозиторий
- [ ] Выполнен `npm install`
- [ ] Настроен `.env.local`
- [ ] Выполнен `npx prisma generate && npx prisma db push`
- [ ] Установлены MCP серверы (скриптом выше)
- [ ] Скопирован глобальный CLAUDE.md

## 💡 Полезные команды:

```bash
# Проверить статус:
git status

# Посмотреть историю:
git log --oneline

# Отменить локальные изменения:
git checkout -- .

# Создать новую ветку:
git checkout -b feature/new-feature

# Переключиться на main:
git checkout main
```

---

**Готово!** Теперь вы можете работать с проектом с любого компьютера! 🎉