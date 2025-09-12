# 🔐 Получение Supabase Access Token

## ✅ Уже настроено:

- **Project URL**: `https://uajyafmysdebrrfwwvpc.supabase.co`
- **Project Ref**: `uajyafmysdebrrfwwvpc`

## ⚠️ Нужен Access Token

### Как получить токен:

1. **Перейдите на страницу токенов:**
   https://app.supabase.com/account/tokens

2. **Создайте новый токен:**
   - Нажмите "Generate new token"
   - Название: `Claude MCP Token` (или любое)
   - Нажмите "Generate token"

3. **Скопируйте токен** (он показывается только один раз!)

4. **Добавьте токен в `.env.mcp`:**
   Замените `your_supabase_access_token_here` на ваш токен

5. **Обновите `.mcp.json`:**
   Замените `YOUR_SUPABASE_ACCESS_TOKEN` на ваш токен

## 📝 Пример токена:

```
sbp_0123456789abcdef0123456789abcdef01234567
```

## 🚀 После добавления токена:

1. Сохраните файлы
2. Перезапустите Claude Code:

   ```bash
   exit
   claude
   ```

3. Проверьте подключение:
   ```
   /mcp test supabase
   ```

## ✨ Что можно будет делать:

- Просматривать таблицы базы данных
- Выполнять SQL запросы (read-only)
- Управлять структурой БД
- Работать с данными через естественный язык

---

**Важно**: Храните токен в безопасности и не коммитьте в git!
