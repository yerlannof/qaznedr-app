# Руководство по развертыванию QAZNEDR.KZ

## 🚀 Быстрый старт

### 1. Настройка Supabase

1. Создайте новый проект на [supabase.com](https://supabase.com)
2. Скопируйте учетные данные из Settings > API:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

3. Примените миграции базы данных:
   ```sql
   -- Выполните файлы из папки /supabase/migrations/ в SQL Editor:
   -- 1. 001_initial_schema.sql
   -- 2. 002_row_level_security.sql
   -- 3. 003_messaging_system.sql
   ```

### 2. Настройка Vercel

1. Импортируйте проект из GitHub в Vercel
2. Добавьте переменные окружения в Settings > Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXTAUTH_SECRET=your-generated-secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

3. Передеплойте проект для применения переменных

### 3. Проверка работоспособности

После деплоя проверьте:
- ✅ Главная страница загружается
- ✅ Список объявлений отображается
- ✅ Фильтры работают
- ✅ Карта загружается
- ✅ Аукционы отображаются
- ✅ Компании видны

## 📊 Мониторинг

### Vercel Analytics
Автоматически включен для отслеживания производительности

### Web Vitals
Метрики производительности отправляются в `/api/analytics/web-vitals`

### Error Tracking
Ошибки логируются в `/api/analytics/errors`

## 🔧 Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для production
npm run build

# Запуск production сборки
npm run start
```

## 📝 Следующие шаги

1. **Добавить реальные данные**
   - Импортировать актуальные месторождения
   - Добавить действующие лицензии
   - Загрузить компании-операторы

2. **Настроить аутентификацию**
   - Включить email/password в Supabase Auth
   - Настроить OAuth провайдеров (Google, GitHub)

3. **Оптимизировать производительность**
   - Настроить CDN для изображений
   - Включить кеширование API
   - Оптимизировать размеры бандлов

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте логи в Vercel Dashboard
2. Убедитесь, что все переменные окружения установлены
3. Проверьте статус Supabase в dashboard
4. Обратитесь к документации в `/docs`

## 📊 Текущий статус

- ✅ **Production Build**: Успешно
- ✅ **TypeScript**: Без ошибок
- ✅ **База данных**: Migrated to Supabase
- ✅ **Deployment**: Настроен для Vercel
- 🔄 **Данные**: Требуется загрузка реальных данных
- 🔄 **Auth**: Требуется настройка провайдеров