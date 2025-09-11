🎯 СТАРТОВЫЙ ПРОМПТ ДЛЯ CLAUDE CODE

Скопируй и вставь эту команду в Claude Code:

===== КОМАНДА 1: ИЗУЧЕНИЕ ПРОЕКТА =====

Read and analyze these files to understand the QAZNEDR.KZ project structure and requirements:

- CLAUDE_DIRECTOR_README.md
- CLAUDE_TECHNICAL_GUIDE.md
- CLAUDE_PROMPTS.md

After reading, confirm your understanding of:

1. Project goal: Kazakhstan mining platform for buying/selling mineral deposits
2. Current status: Clean architecture but generic content needs Kazakhstan-specific conversion
3. Design system: Only gray + blue colors, no gradients, minimal animations
4. Your role: Specialized developer following incremental changes, not rewriting

Respond with: "✅ Ready to work on QAZNEDR.KZ platform. Understood design rules and Kazakhstan mining focus."

===== КОМАНДА 2: ПЕРВАЯ ЗАДАЧА =====

После подтверждения понимания, выполни первую задачу:

TASK 1: Update main page (src/app/page.tsx) for Kazakhstan mining platform.

Requirements:

1. Replace "Welcome to the Future" with "Цифровая платформа недропользования Казахстана"
2. Change subtitle to "Покупайте и продавайте месторождения полезных ископаемых онлайн"
3. Add statistics section after hero with: 156 активных объявлений, 89 проверенных объектов, 17 регионов охвата, 45+ успешных сделок
4. Update CTA buttons to "Найти месторождение" and "Разместить объявление"
5. Keep the clean gray+blue design, no gradients

Follow the exact code examples in CLAUDE_TECHNICAL_GUIDE.md section "ЗАДАЧА 1".

After completion, test with `npm run dev` and confirm the page loads without errors.

===== СЛЕДУЮЩИЕ КОМАНДЫ =====

После выполнения первой задачи, Claude Code получит следующие команды поэтапно:

✅ Задача 1: Обновить главную страницу (30 мин)
🔄 Задача 2: Создать данные казахстанских месторождений (45 мин)  
⏳ Задача 3: Обновить TypeScript типы (15 мин)
⏳ Задача 4: Обновить страницу листингов (30 мин)
⏳ Задача 5: Создать фильтры и поиск (60 мин)

===== КОНТРОЛЬ КАЧЕСТВА =====

После каждой задачи Claude Code должен:

1. Запустить `npm run dev` для проверки
2. Проверить отсутствие ошибок в консоли
3. Убедиться что дизайн соответствует требованиям (серый + синий)
4. Сообщить о завершении задачи

===== ВАЖНЫЕ ПРАВИЛА =====

❌ НЕ ДЕЛАТЬ:

- Переписывать всю архитектуру
- Использовать яркие цвета (emerald, purple, orange)
- Добавлять градиенты
- Удалять рабочую функциональность

✅ ДЕЛАТЬ:

- Инкрементальные изменения файл за файлом
- Следовать дизайн-системе (серый + синий)
- Проверять результат после каждого изменения
- Использовать типизацию TypeScript

НАЧНИ С КОМАНДЫ 1! 🚀
