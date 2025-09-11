# 🛠️ ТЕХНИЧЕСКИЕ ИНСТРУКЦИИ ДЛЯ CLAUDE CODE

## 🎯 НЕМЕДЛЕННЫЕ ЗАДАЧИ (ПЕРВЫЕ 2 ЧАСА)

### ЗАДАЧА 1: Обновить главную страницу (30 минут)

```bash
# Файл: src/app/page.tsx
# Заменить весь контент на казахстанскую тематику
```

#### Заменить заголовок:

```typescript
// БЫЛО:
<h1>Welcome to the Future</h1>

// ДОЛЖНО БЫТЬ:
<h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
  Цифровая платформа
  <br />
  <span className="text-blue-600">недропользования</span>
  <br />
  Казахстана
</h1>
```

#### Заменить описание:

```typescript
// БЫЛО:
<p>Experience innovation through simplicity...</p>

// ДОЛЖНО БЫТЬ:
<p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
  Покупайте и продавайте месторождения полезных ископаемых онлайн.
  Прозрачно, безопасно, эффективно.
</p>
```

#### Добавить секцию статистики:

```typescript
// Добавить после hero секции:
<section className="py-20 bg-gray-50">
  <div className="max-w-6xl mx-auto px-4">
    <div className="grid md:grid-cols-4 gap-8 text-center">
      <div>
        <div className="text-4xl font-bold text-blue-600 mb-2">156</div>
        <div className="text-gray-600">Активных объявлений</div>
      </div>
      <div>
        <div className="text-4xl font-bold text-blue-600 mb-2">89</div>
        <div className="text-gray-600">Проверенных объектов</div>
      </div>
      <div>
        <div className="text-4xl font-bold text-blue-600 mb-2">17</div>
        <div className="text-gray-600">Регионов охвата</div>
      </div>
      <div>
        <div className="text-4xl font-bold text-blue-600 mb-2">45+</div>
        <div className="text-gray-600">Успешных сделок</div>
      </div>
    </div>
  </div>
</section>
```

### ЗАДАЧА 2: Создать казахстанские данные (45 минут)

```bash
# Создать файл: src/lib/data/kazakhstan-deposits.ts
```

#### Структура данных:

```typescript
export interface KazakhstanDeposit {
  id: string;
  title: string;
  description: string;
  type: 'DEPOSIT' | 'LICENSE' | 'CONTRACT';
  mineral: 'Нефть' | 'Газ' | 'Золото' | 'Медь' | 'Уголь' | 'Уран' | 'Железо';
  region:
    | 'Мангистауская'
    | 'Атырауская'
    | 'Карагандинская'
    | 'Восточно-Казахстанская'
    | 'Западно-Казахстанская'
    | 'Павлодарская'
    | 'Костанайская'
    | 'Акмолинская';
  city: string;
  area: number; // км²
  price: number | null; // в тенге
  coordinates: [number, number]; // [lat, lng]
  verified: boolean;
  featured: boolean;
  views: number;
  status: 'ACTIVE' | 'SOLD' | 'PENDING';
  images: string[];
  documents: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const kazakhstanDeposits: KazakhstanDeposit[] = [
  {
    id: '1',
    title: 'Нефтяное месторождение "Кашаган"',
    description:
      'Крупнейшее нефтяное месторождение в Каспийском море. Запасы: 6.4 млрд баррелей нефти. Развитая инфраструктура добычи и транспортировки.',
    type: 'DEPOSIT',
    mineral: 'Нефть',
    region: 'Мангистауская',
    city: 'Атырау',
    area: 2500,
    price: 1500000000000, // 1.5 трлн тенге
    coordinates: [46.2644, 51.9606],
    verified: true,
    featured: true,
    views: 1247,
    status: 'ACTIVE',
    images: ['/images/deposits/kashagan.jpg'],
    documents: ['license.pdf', 'geological-survey.pdf'],
    userId: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: 'Газовое месторождение "Карачаганак"',
    description:
      'Одно из крупнейших газоконденсатных месторождений мира. Запасы газа: 1.35 трлн м³. Действующая добыча с развитой переработкой.',
    type: 'LICENSE',
    mineral: 'Газ',
    region: 'Западно-Казахстанская',
    city: 'Аксай',
    area: 1800,
    price: 2200000000000, // 2.2 трлн тенге
    coordinates: [51.1655, 53.3006],
    verified: true,
    featured: false,
    views: 892,
    status: 'ACTIVE',
    images: ['/images/deposits/karachaganak.jpg'],
    documents: ['license.pdf', 'environmental-assessment.pdf'],
    userId: '2',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  // ... добавить еще 15-20 месторождений
];
```

### ЗАДАЧА 3: Обновить типы (15 минут)

```bash
# Создать файл: src/lib/types/listing.ts
```

#### Основные типы:

```typescript
export type MineralType =
  | 'Нефть'
  | 'Газ'
  | 'Золото'
  | 'Медь'
  | 'Уголь'
  | 'Уран'
  | 'Железо';

export type RegionType =
  | 'Мангистауская'
  | 'Атырауская'
  | 'Карагандинская'
  | 'Восточно-Казахстанская'
  | 'Западно-Казахстанская'
  | 'Павлодарская'
  | 'Костанайская'
  | 'Акмолинская'
  | 'Жамбылская'
  | 'Кызылординская'
  | 'Актюбинская'
  | 'Алматинская'
  | 'Туркестанская'
  | 'Улытауская';

export type ListingType = 'DEPOSIT' | 'LICENSE' | 'CONTRACT';
export type ListingStatus = 'ACTIVE' | 'SOLD' | 'PENDING' | 'DRAFT';

export interface ListingFilters {
  region?: RegionType[];
  mineral?: MineralType[];
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  verified?: boolean;
  featured?: boolean;
}

export interface SearchParams {
  query?: string;
  filters?: ListingFilters;
  sortBy?: 'price' | 'area' | 'createdAt' | 'views';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

### ЗАДАЧА 4: Обновить страницу листингов (30 минут)

```bash
# Файл: src/app/listings/page.tsx
# Заменить generic mineral listings на kazakhstan deposits
```

#### Обновить импорты:

```typescript
import { kazakhstanDeposits } from '@/lib/data/kazakhstan-deposits';
import { KazakhstanDeposit } from '@/lib/types/listing';
```

#### Обновить заголовок:

```typescript
<h1 className="text-3xl font-bold mb-8">
  Месторождения полезных ископаемых
</h1>
```

#### Добавить фильтры:

```typescript
<div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
  <select className="border rounded-lg px-3 py-2">
    <option value="">Все регионы</option>
    <option value="Мангистауская">Мангистауская</option>
    <option value="Атырауская">Атырауская</option>
    <option value="Карагандинская">Карагандинская</option>
  </select>

  <select className="border rounded-lg px-3 py-2">
    <option value="">Все минералы</option>
    <option value="Нефть">Нефть</option>
    <option value="Газ">Газ</option>
    <option value="Золото">Золото</option>
  </select>

  <input
    type="number"
    placeholder="Мин. цена (тенге)"
    className="border rounded-lg px-3 py-2"
  />

  <input
    type="number"
    placeholder="Макс. цена (тенге)"
    className="border rounded-lg px-3 py-2"
  />
</div>
```

---

## 🎨 ДИЗАЙН ТРЕБОВАНИЯ

### Цветовая схема (СТРОГО):

```css
/* Основные цвета */
--background:
  oklch(1 0 0) /* Белый */ --foreground: oklch(0.145 0 0)
    /* Темно-серый текст */ --primary: oklch(0.568 0.191 231.25)
    /* Синий #0A84FF */ --muted: oklch(0.97 0 0) /* Светло-серый фон */
    --border: oklch(0.922 0 0) /* Серые границы */ /* ЗАПРЕЩЕННЫЕ цвета */ ❌
    Никаких градиентов ❌ Никаких emerald,
  purple, orange, red (кроме ошибок) ❌ Никаких ярких цветов;
```

### Анимации (МИНИМАЛЬНО):

```css
/* Разрешенные анимации */
✅ hover:shadow-md
✅ transition-all duration-300
✅ hover:-translate-y-0.5

/* ЗАПРЕЩЕННЫЕ анимации */
❌ animate-bounce
❌ animate-pulse
❌ Сложные keyframes
❌ Любые "эффектные" анимации
```

### Компоненты:

```typescript
// Кнопки - только так:
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:shadow-md transition-all">
  Действие
</button>

// Карточки - только так:
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
  Контент
</div>
```

---

## 🚨 КРИТИЧЕСКИЕ ПРАВИЛА

### ❌ НИКОГДА НЕ ДЕЛАТЬ:

1. **Переписывать всю архитектуру** - только инкрементальные изменения
2. **Удалять рабочую функциональность** - только дополнять и улучшать
3. **Использовать яркие цвета** - только серый + синий акцент
4. **Добавлять сложные анимации** - максимум hover эффекты
5. **Менять структуру файлов** без согласования

### ✅ ВСЕГДА ДЕЛАТЬ:

1. **Проверять изменения** после каждого файла
2. **Следовать дизайн-системе**
3. **Использовать TypeScript типы**
4. **Форматировать код** перед коммитом
5. **Тестировать на dev сервере**

---

## 📋 ЧЕК-ЛИСТ ПОСЛЕ КАЖДОЙ ЗАДАЧИ

```bash
# 1. Проверить запуск
npm run dev

# 2. Открыть в браузере
# http://localhost:3000

# 3. Проверить консоль на ошибки
# F12 → Console

# 4. Проверить типы
npm run type-check

# 5. Форматировать код
npm run format
```

---

## 🎯 СЛЕДУЮЩИЕ КОМАНДЫ ДЛЯ CLAUDE CODE

После изучения этого файла выполни:

```bash
# Команда 1: Обновить главную страницу
"Update src/app/page.tsx: Replace 'Welcome to the Future' with Kazakhstan mining platform content. Change title to 'Цифровая платформа недропользования Казахстана', add statistics section with 156 listings, 89 verified objects, 17 regions, 45+ deals"

# Команда 2: Создать данные месторождений
"Create src/lib/data/kazakhstan-deposits.ts with Kazakhstan oil, gas and mineral deposits. Include Kashagan oil field, Karachaganak gas field, Zhezkazgan copper mine with realistic data in Kazakh regions"

# Команда 3: Обновить типы
"Create src/lib/types/listing.ts with KazakhstanDeposit interface including mineral types (Нефть, Газ, Золото, Медь), Kazakhstan regions, coordinates, verified status"

# Команда 4: Обновить листинги
"Update src/app/listings/page.tsx to use kazakhstan-deposits data instead of generic minerals. Change title to 'Месторождения полезных ископаемых', add region and mineral filters"
```

**ВАЖНО**: Выполняй команды по одной, проверяй результат каждой!

---

_Последнее обновление: 01.07.2025_
