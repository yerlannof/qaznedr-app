from pathlib import Path
import re

ROOT=Path(__file__).resolve().parent
base=(ROOT/'00-design-review.html').read_text()
style=re.search(r'<style>(.*?)</style>',base,re.S).group(1)
style+='''@font-face{font-family:Source;src:url('../brand/fonts/SourceSerif4Display-Regular.ttf.woff2')}@font-face{font-family:Plex;src:url('../brand/fonts/IBMPlexSans-Regular.woff2')}body{font-family:Plex,system-ui,sans-serif}h1,h2,h3{font-family:Source,Georgia,serif}.hero-board{width:100%;display:block;height:auto}.stat{font:48px Source,serif;margin:0}.compact{max-width:860px}.asset-sample{width:100%;height:220px;object-fit:contain}.dark-panel{background:#253740;color:#E9ECE6;padding:28px}.dark-panel .button{color:#253740}.dark-panel p{color:#CAD2CA}'''

body='''<span class="eyebrow">Продолжение дизайн-пакета · на рассмотрении</span>
<h1>Тот же A3. Единая система применения.</h1>
<p class="lead">Утверждённые «Контур» и «Сланец / сера» сохранены. Здесь — точная векторная версия для сверки, брендбук, фирменные носители и демонстрация геологической сцены.</p>
<p class="note">Это доводка выбранного направления. Новые пропорции, наборные шрифты и носители представлены для твоего решения; разрешение работать самостоятельно не заменяет утверждение.</p>
<div class="links"><a class="button" href="../brand/book/qaznedr-brand-book-v1.pdf">Брендбук · PDF</a><a href="../brand/book/brand-book.html">Листать в браузере</a><a href="00-design-review.html">Вернуться к страницам сайта</a></div>

<section><h2>Носители в нашем бренде</h2>
<figure class="visual"><a href="../mockups/07/collateral/investor-teaser-board.png"><img class="hero-board" src="../mockups/07/collateral/investor-teaser-board.png" alt="Обложки и разворот инвестиционного тизера на английском и китайском"></a><figcaption>ImageGen · Тизер инвестору: EN, 中文 и разворот с открытыми параметрами. Демонстрационный проект, данные не выдуманы.</figcaption></figure>
<figure class="visual" style="margin-top:24px"><a href="../mockups/07/collateral/stationery-wechat-board-v2.png"><img class="hero-board" loading="lazy" src="../mockups/07/collateral/stationery-wechat-board-v2.png" alt="Визитки и фирменная обложка WeChat"></a><figcaption>ImageGen · Визитки и обложка для WeChat. Знак в генерации приблизительный; для выпуска используется единый вектор после утверждения.</figcaption></figure>
<div class="links"><a href="../mockups/07/collateral/prompts.md">Точные промпты</a><a href="../mockups/07/collateral/README.md">Статус и применение носителей</a></div></section>

<section><h2>Сверка точного логотипа с A3</h2><p class="compact">Вектор нужен, чтобы на сайте, в PDF и на аватаре использовался один знак. Сравнение ниже сохраняет выбранный рисунок сверху и показывает уточнённый кандидат снизу. Ранний бронзовый HOLDING в исходном рисунке заменён утверждённым D2.</p>
<figure class="visual"><img loading="lazy" src="../brand/candidate-v1/comparison-sheet.png" alt="Утверждённый A3 и единый векторный кандидат рядом"><figcaption>Сравнение формы, надписи и пропорций. Это кандидат точного исполнения, пока не утверждённый финальный мастер.</figcaption></figure>
<div class="links"><a class="button" href="01-master-candidate.html">Логотипы и малые размеры</a><a href="../brand/candidate-v1/README.md">Файлы и правила</a><a href="../brand/candidate-v1/logo-horizontal.svg">Горизонтальный SVG</a><a href="../brand/candidate-v1/logo-stacked.svg">Вертикальный SVG</a><a href="../brand/candidate-v1/mark.svg">Знак SVG</a></div></section>

<section><h2>Проверить геологическую сцену</h2><p class="compact">Поверхность → структура → интерпретация. На десктопе состояние меняется при прокрутке; на телефоне — короткая последовательность с кнопками. Системная настройка уменьшенного движения сохраняет весь смысл статично.</p>
<figure class="visual"><img loading="lazy" src="../mockups/07/motion/storyboard.png" alt="Три состояния геологической сцены"><figcaption>Один гравюрный разрез с выделением зон. Это проверка подачи, а не готовая 3D-модель или данные настоящего участка.</figcaption></figure>
<p class="compact">Новое продолжение 08: три отдельно отрисованные части раскрываются независимо. Сравни с цельным разрезом 07; выбор движения ещё открыт.</p><div class="links"><a class="button" href="08-geology-layers.html">Новая сцена · раздельные части</a><a href="07-geology-motion.html">Цельная сцена 07</a><a href="../mockups/07/motion/README.md">Сценарий и ограничения</a></div></section>

<section><h2>Техническая подготовка дизайна</h2><div class="grid">
<article class="card"><p class="stat">12</p><h3>Страниц брендбука</h3><p>Знак, палитра, наборные шрифты, сетка, графика, движение и международная подача. Версия для утверждения.</p><a href="../brand/book/qaznedr-brand-book-v1.pdf">Открыть PDF</a></article>
<article class="card"><p class="stat">9</p><h3>Лёгких изображений</h3><p>Три иллюстрации в ширинах 640 / 960 / 1440, WebP. Композиция сохранена, каждый файл меньше 350 KiB.</p><a href="../brand/web-assets/README.md">Размеры и правила загрузки</a></article>
<article class="card"><h3>Наборная типографика</h3><p>Предложение Source Serif 4 + IBM Plex Sans. Локальные файлы и лицензии; китайский — системный CJK. Логотип имеет собственные векторные буквы.</p><a href="../brand/fonts/README.md">Шрифты и источники</a></article>
<article class="card"><h3>Передача разработчику</h3><p>Карта страниц и компонентов, недостающий реальный контент, словарь RU / EN / 中文 и состояния интерфейса.</p><div class="links"><a href="../handoff/IMPLEMENTATION-MAP.md">Карта</a><a href="../handoff/CONTENT-REGISTER.md">Контент</a><a href="../handoff/LOCALIZATION.md">Языки</a></div></article>
</div></section>

<section><h2>Что остаётся выбрать</h2><ol><li>Соответствует ли точный вектор характеру выбранного A3; нужны ли правки пропорций и букв.</li><li>Принимаем ли наборную пару, носители и спокойный сценарий движения.</li><li>Светлая или тёмная тема сайта по умолчанию — предыдущий вопрос остаётся открытым.</li></ol><p class="small">Китайское юридическое имя выбирается отдельно с переводчиком. До этого бренд остаётся латиницей. Реальные контакты, фото и данные проектов запрашиваются по реестру контента.</p></section>'''

html=f'<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QAZNEDR · Бренд и передача</title><style>{style}</style></head><body><header><b><a href="00-design-review.html">QAZNEDR HOLDING</a></b><nav><a href="01-master-candidate.html">Логотип</a><a href="../brand/book/brand-book.html">Брендбук</a><a href="07-geology-motion.html">Движение</a></nav></header><main>{body}</main><footer>Дизайн-предложение · 26 сентября 2026 · Работа выполнена внутри docs/design/. Новые материалы не внедрены в сайт.</footer></body></html>'
(ROOT/'07-brand-system.html').write_text(html)
print('Built brand-system review.')
