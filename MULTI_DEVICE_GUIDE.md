# 🔄 Работа с проектом на разных компьютерах

## Основной принцип: Git синхронизация

### На компьютере где работали:
```bash
# Сохранить все изменения
git add .
git commit -m "Описание изменений"
git push origin master
```

### На новом компьютере:
```bash
# Первый раз - клонировать проект
git clone https://github.com/yerlannof/qaznedr-app.git
cd qaznedr-app

# Установить зависимости
npm install

# Настроить окружение
cp .env.example .env.local
# Добавить ваши ключи в .env.local
```

### При переключении между компьютерами:
```bash
# Перед началом работы - получить последние изменения
git pull origin master

# После работы - отправить изменения
git add .
git commit -m "Изменения"
git push origin master
```

## ⚠️ Важные файлы для синхронизации

### Коммитятся в Git (синхронизируются):
- ✅ Весь код в `src/`
- ✅ Конфигурации (package.json, tsconfig.json и т.д.)
- ✅ `.mcp.json` (конфигурация MCP серверов)

### НЕ коммитятся (настраивать на каждом компе):
- ❌ `.env.local` (ключи Supabase для приложения)
- ❌ `.env.mcp` (ключи для MCP серверов)
- ❌ `node_modules/` (устанавливаются через npm install)
- ❌ `.next/` (билд файлы)

## 📝 Чек-лист для нового компьютера

1. **Клонировать репозиторий:**
   ```bash
   git clone https://github.com/yerlannof/qaznedr-app.git
   cd qaznedr-app
   ```

2. **Установить зависимости:**
   ```bash
   npm install
   ```

3. **Создать файлы окружения:**
   ```bash
   # Для приложения
   cat > .env.local << EOF
   NEXT_PUBLIC_SUPABASE_URL=https://uajyafmysdebrrfwwvpc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   EOF

   # Для MCP серверов (если используете Claude Code)
   cat > .env.mcp << EOF
   SUPABASE_ACCESS_TOKEN=sbp_e53a0f33e8dc5e98ba5f159556e57709295a5eb4
   BRAVE_API_KEY=BSAUf8o2e8pkNQ-5EJLh5K-ZbCt_KgX
   EOF
   ```

4. **Запустить проект:**
   ```bash
   npm run dev
   ```

## 🔑 Безопасное хранение ключей

### Вариант 1: Личный документ
Создайте приватный документ (Google Docs, Notion, и т.д.) с вашими ключами:
```
SUPABASE_URL=https://uajyafmysdebrrfwwvpc.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
BRAVE_API_KEY=BSAUf8o2e8pkNQ-5EJLh5K-ZbCt_KgX
```

### Вариант 2: Менеджер паролей
Сохраните ключи в 1Password, Bitwarden, или другом менеджере паролей.

### Вариант 3: Зашифрованный файл
Создайте зашифрованный архив с ключами и храните в облаке.

## 🚀 Автоматизация с git hooks

Добавьте в `.git/hooks/pre-push`:
```bash
#!/bin/bash
# Напоминание перед push
echo "✅ Проверьте:"
echo "- Все ли изменения закоммичены?"
echo "- Не коммитите .env файлы!"
echo "- Тесты прошли?"
```

## 📱 Мобильная разработка

Если нужно быстро что-то поправить с телефона:
1. Используйте GitHub веб-редактор (github.dev)
2. Или GitHub мобильное приложение для простых правок

---

**Главное правило**: Всегда делайте `git pull` перед началом работы и `git push` после!