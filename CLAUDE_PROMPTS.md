# 🤖 ПРОМПТЫ ДЛЯ CLAUDE CODE

## 📖 СТАРТОВЫЕ КОМАНДЫ

### 1. Команда для изучения проекта:

```
Read and analyze these files to understand the project structure and requirements:
- CLAUDE_DIRECTOR_README.md
- CLAUDE_TECHNICAL_GUIDE.md

After reading, confirm your understanding of:
1. Project goal (Kazakhstan mining platform)
2. Current architecture status
3. Design system rules (gray + blue only, no gradients)
4. Your role as specialized developer

Respond with: "✅ Ready to work on QAZNEDR.KZ platform following the technical guide"
```

### 2. Команда для первой задачи:

```
TASK 1: Update the main page (src/app/page.tsx) for Kazakhstan mining platform.

Requirements:
1. Replace "Welcome to the Future" with "Цифровая платформа недропользования Казахстана"
2. Change subtitle to "Покупайте и продавайте месторождения полезных ископаемых онлайн"
3. Add statistics section with: 156 listings, 89 verified objects, 17 regions, 45+ deals
4. Update navigation text from generic to mining-specific
5. Keep the clean gray+blue design system

Follow the exact examples in CLAUDE_TECHNICAL_GUIDE.md section "ЗАДАЧА 1"
```

---

## 📋 ПОШАГОВЫЕ КОМАНДЫ

### ФАЗА 1: ОСНОВНОЙ КОНТЕНТ

#### Шаг 1.1: Главная страница

```
Update src/app/page.tsx following CLAUDE_TECHNICAL_GUIDE.md ЗАДАЧА 1. Replace generic content with Kazakhstan mining platform content. Keep existing clean design but change all text to Russian mining terminology.
```

#### Шаг 1.2: Создание данных

```
Create src/lib/data/kazakhstan-deposits.ts following CLAUDE_TECHNICAL_GUIDE.md ЗАДАЧА 2. Include real Kazakhstan deposits: Kashagan, Tengiz, Karachaganak oil fields, Zhezkazgan copper mine, Ekibastuz coal. Use the exact KazakhstanDeposit interface structure provided.
```

#### Шаг 1.3: Типы данных

```
Create src/lib/types/listing.ts following CLAUDE_TECHNICAL_GUIDE.md ЗАДАЧА 3. Define all TypeScript interfaces for Kazakhstan mining listings with proper mineral types and regions in Russian.
```

#### Шаг 1.4: Страница листингов

```
Update src/app/listings/page.tsx following CLAUDE_TECHNICAL_GUIDE.md ЗАДАЧА 4. Replace generic mineral listings with Kazakhstan deposits. Add region and mineral filters using the new types.
```

### ФАЗА 2: КОМПОНЕНТЫ

#### Шаг 2.1: Карточка листинга

```
Update src/components/features/unified-listing-card.tsx to display Kazakhstan deposits properly. Show: mineral type, region, area in км², price in tenge, verification status. Use icons: 🛢️ for oil, ⛽ for gas, 🥇 for gold, 🟫 for copper.
```

#### Шаг 2.2: Фильтры

```
Create src/components/features/listings/listing-filters.tsx with filters for: Kazakhstan regions dropdown, mineral types checkboxes, price range slider (in tenge), area range, verified only toggle. Use clean gray+blue design.
```

#### Шаг 2.3: Поиск

```
Create src/components/features/search/mining-search.tsx with search input for deposits, auto-complete for regions and minerals, recent searches. Integrate with Kazakhstan data.
```

### ФАЗА 3: СТРАНИЦЫ

#### Шаг 3.1: Детальная страница

```
Create src/app/listings/[id]/page.tsx for individual deposit details. Show: full description, location on map, geological data, documents, seller contact, similar deposits. Use 2-column layout.
```

#### Шаг 3.2: Страница региона

```
Create src/app/regions/[region]/page.tsx showing all deposits in specific Kazakhstan region. Include region statistics, top deposits, price trends, geological overview.
```

---

## 🎯 ПРОМПТЫ ПРОВЕРКИ КАЧЕСТВА

### Проверка дизайна:

```
Search the entire codebase for any usage of these FORBIDDEN elements:
- gradient classes (from-, to-, bg-gradient-)
- bright colors (emerald, purple, orange, pink, red except error states)
- complex animations (animate-bounce, animate-pulse, keyframes)

Report any violations and fix them using only gray and blue colors.
```

### Проверка локализации:

```
Search all .tsx files for English text that should be in Russian. Focus on:
- Button labels
- Form placeholders
- Section headings
- Navigation items
- Error messages

Replace with appropriate Russian mining terminology.
```

### Проверка типов:

```
Run TypeScript check and fix all type errors:
npm run type-check

Ensure all Kazakhstan deposit data matches the defined interfaces and all components use proper typing.
```

---

## 🛠️ ПРОМПТЫ ОТЛАДКИ

### При ошибках сборки:

```
Fix build errors step by step:
1. Run `npm run build`
2. Identify the specific error
3. Fix import paths and type mismatches
4. Ensure all required props are provided
5. Re-run build to confirm fix
```

### При ошибках стилей:

```
Check and fix styling issues:
1. Verify all Tailwind classes are valid
2. Ensure no custom CSS conflicts with design system
3. Check responsive breakpoints work correctly
4. Test hover states and transitions
```

### При ошибках данных:

```
Validate Kazakhstan deposits data:
1. Check all deposit objects match KazakhstanDeposit interface
2. Ensure coordinates are valid [lat, lng] format
3. Verify all required fields are present
4. Test data renders correctly in components
```

---

## 🎨 ПРОМПТЫ ДЛЯ УЛУЧШЕНИЙ

### Добавление карты:

```
Create interactive Kazakhstan map component:
1. Use a simple SVG or canvas-based approach
2. Show deposit locations as markers
3. Color-code by mineral type
4. Add click handlers for deposit details
5. Keep design minimal and fast-loading
```

### Добавление графиков:

```
Add simple charts for mining statistics:
1. Use minimal chart library or SVG
2. Show deposits by region (bar chart)
3. Show minerals distribution (pie chart)
4. Use only gray and blue colors
5. Make responsive and accessible
```

### Оптимизация производительности:

```
Optimize the app for better performance:
1. Add proper image optimization
2. Implement pagination for listings
3. Add loading skeletons
4. Lazy load non-critical components
5. Minimize bundle size
```

---

## 🚨 ЭКСТРЕННЫЕ КОМАНДЫ

### Если что-то сломалось:

```
Emergency reset to working state:
1. Check git status and identify changed files
2. Revert problematic changes: git checkout -- [filename]
3. Restart dev server: npm run dev
4. Test basic functionality
5. Report what was broken and how you fixed it
```

### Если дизайн испорчен:

```
Fix design system violations:
1. Reset all colors to approved palette (gray + blue only)
2. Remove any gradients or bright colors
3. Simplify animations to basic hover effects
4. Ensure consistent spacing and typography
5. Test on mobile and desktop
```

---

## 📊 ПРОМПТЫ ОТЧЕТНОСТИ

### Ежедневный отчет:

```
Provide daily progress report:
1. List completed tasks
2. Show before/after screenshots if UI changed
3. Report any challenges encountered
4. Estimate remaining work on current phase
5. Suggest next priority tasks
```

### Финальная проверка:

```
Perform comprehensive project review:
1. Test all major user flows
2. Verify mobile responsiveness
3. Check all links and navigation work
4. Confirm data displays correctly
5. Validate design consistency throughout
6. Report any remaining issues or improvements needed
```

---

## 💡 СОВЕТЫ ПО РАБОТЕ С CLAUDE CODE

### ✅ Эффективные промпты:

- Конкретные задачи с точными файлами
- Примеры кода в промпте
- Четкие критерии успеха
- Проверочные команды

### ❌ Неэффективные промпты:

- "Улучши проект" (слишком общее)
- "Сделай красиво" (субъективно)
- "Исправь все ошибки" (слишком широко)
- "Добавь функциональность" (неконкретно)

### 🎯 Структура идеального промпта:

```
[ЗАДАЧА]: Конкретное действие
[ФАЙЛ]: Точный путь к файлу
[ТРЕБОВАНИЯ]: Список конкретных изменений
[ПРОВЕРКА]: Как убедиться что задача выполнена
[ОГРАНИЧЕНИЯ]: Что нельзя делать
```

---

_Последнее обновление: 01.07.2025_
