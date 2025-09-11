# 🚀 Деплой на Vercel

## GitHub MCP токен НЕ нужен!

Vercel работает напрямую с GitHub через собственную интеграцию.

## Шаги для деплоя:

### 1. Подготовка кода
```bash
# Закоммитить все изменения
git add .
git commit -m "Prepare for Vercel deployment"
git push origin master
```

### 2. Деплой на Vercel

1. **Зайдите на [vercel.com](https://vercel.com)**

2. **Нажмите "Import Project"**

3. **Выберите ваш GitHub репозиторий:**
   - `yerlannof/qaznedr-app`

4. **Настройте Environment Variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://uajyafmysdebrrfwwvpc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXTAUTH_URL = https://your-app.vercel.app
   NEXTAUTH_SECRET = [сгенерировать случайную строку]
   ```

5. **Нажмите "Deploy"**

## ✅ Что происходит автоматически:

- Vercel подключается к вашему GitHub
- При каждом push в master - автоматический деплой
- Preview деплои для pull requests
- Откат к предыдущим версиям

## 🔐 Безопасность на Vercel

### Environment Variables в Vercel Dashboard:
- Production - для основного домена
- Preview - для preview деплоев  
- Development - для локальной разработки

### Домены:
- `your-app.vercel.app` - автоматический
- `qaznedr.kz` - можно подключить custom домен

## 📝 vercel.json уже настроен:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["fra1"],  // Европа, ближе к Казахстану
  "functions": {
    "app/api/*": {
      "maxDuration": 10
    }
  }
}
```

## 🔄 Автоматические деплои:

После настройки каждый `git push` автоматически деплоится:

```bash
# На любом компьютере
git add .
git commit -m "Update feature"
git push origin master
# ✅ Vercel автоматически задеплоит изменения
```

## 🎯 Итог:

**GitHub MCP токен НЕ нужен для Vercel!**

Нужны только:
- ✅ GitHub репозиторий (есть)
- ✅ Supabase ключи (есть)
- ✅ Vercel аккаунт (бесплатный)

---

**Важно**: MCP серверы (Claude Code) - это для локальной разработки. На Vercel они не нужны, там работает только ваше Next.js приложение с Supabase!