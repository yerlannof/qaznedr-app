# Реестр активов текущего показа

2026-09-26. Десять ImageGen-листов страниц и три самостоятельные фирменные иллюстрации. Это отобранные версии для обсуждения; ранние файлы не являются альтернативными мастер-активами.

| Файл                                                                                       | Фактический размер | Вес      |
| ------------------------------------------------------------------------------------------ | ------------------ | -------- |
| [mockups/03/desktop/light-v2.png](mockups/03/desktop/light-v2.png)                         | 870 × 1808         | 1907 KiB |
| [mockups/03/desktop/dark-v2.png](mockups/03/desktop/dark-v2.png)                           | 870 × 1808         | 1959 KiB |
| [mockups/03/mobile/light-v2.png](mockups/03/mobile/light-v2.png)                           | 1536 × 1024        | 1928 KiB |
| [mockups/03/mobile/dark-v2.png](mockups/03/mobile/dark-v2.png)                             | 1536 × 1024        | 2003 KiB |
| [mockups/04/imagegen/portfolio-v2.png](mockups/04/imagegen/portfolio-v2.png)               | 1536 × 1024        | 1837 KiB |
| [mockups/04/imagegen/teaser.png](mockups/04/imagegen/teaser.png)                           | 1536 × 1024        | 1743 KiB |
| [mockups/05/imagegen/services-about.png](mockups/05/imagegen/services-about.png)           | 1227 × 1282        | 1785 KiB |
| [mockups/05/imagegen/contact-v2.png](mockups/05/imagegen/contact-v2.png)                   | 1536 × 1024        | 1773 KiB |
| [mockups/06/imagegen/insights.png](mockups/06/imagegen/insights.png)                       | 1536 × 1024        | 1817 KiB |
| [mockups/06/imagegen/metal.png](mockups/06/imagegen/metal.png)                             | 1536 × 1024        | 2086 KiB |
| [mockups/01/elements/portfolio-specimens.png](mockups/01/elements/portfolio-specimens.png) | 1536 × 1024        | 2639 KiB |
| [mockups/01/elements/archive-to-field.png](mockups/01/elements/archive-to-field.png)       | 1536 × 1024        | 2359 KiB |
| [mockups/01/elements/geology-cutaway.png](mockups/01/elements/geology-cutaway.png)         | 1774 × 887         | 2544 KiB |

Размеры ImageGen-листов не равны ширине будущего экрана. Проверенные представления 375 / 768 / 1440 px отдельно находятся в [браузерном наборе](mockups/site-preview/README.md).

Тексты и состояния переносить из [спецификаций](DELIVERY.md), изображённые надписи не использовать как окончательный перевод. У финального логотипа должен быть единый согласованный мастер; изображение знака внутри каждого листа не считается отдельной версией логотипа.

## Дополнение автономной сессии

- [Тизер инвестору EN/中文](mockups/07/collateral/investor-teaser-board.png) и [визитки / WeChat v2](mockups/07/collateral/stationery-wechat-board-v2.png) — ещё два выбранных ImageGen-листа. Старый stationery-wechat-board.png заменён версией v2 и в итоговый показ не входит.
- [Векторный кандидат A3](brand/candidate-v1/README.md) — техническое продолжение выбранного направления, не новая концепция.
- [WebP-производные](brand/web-assets/manifest.json) — девять вариантов трёх исходных иллюстраций с размерами, байтами и SHA-256.
- [Шрифты](brand/fonts/sources.json) — источники и контрольные суммы локальных файлов; лицензии рядом.
- [Брендбук](brand/book/brand-book.html) — 12 страниц, доступен PDF.
- [Motion storyboard](mockups/07/motion/storyboard.png) — три состояния демонстрации на одном схематическом рисунке.

Все новые материалы предложены к рассмотрению. Они не расширяют список утверждений в APPROVED.md автоматически.

## Продолжение 08: раздельные части геосцены

- [ImageGen-исходник](mockups/08/layers/sprite-v1.png): 1254 × 1254 RGBA, 2,360,026 байт; один прозрачный атлас с тремя частями. [Промпт, границы обрезки и ограничения](mockups/08/layers/README.md).
- [Интерактивный показ](review/08-geology-layers.html): три отдельно обрезанные плоскости, RU/EN/中文, две темы, mobile/reduced-motion/no-JS.
- [Раскадровка](mockups/08/prototype/storyboard-desktop.png) и [браузерные проверки](mockups/08/prototype/qa.json).
- [Независимая проверка alpha](mockups/08/qa/asset-qa.json): фон действительно прозрачный; слабые пиксели в промежутках требуют точной обрезки. Отклонённая непрозрачная генерация не включена.

Предложение 08 не заменяет ранее согласованное направление и не является утверждённым production-активом.
