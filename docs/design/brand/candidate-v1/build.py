"""Build review-only A3/D2 vector candidate. No external font or artwork dependency in SVGs."""
from pathlib import Path
import base64
import html
import json

HERE = Path(__file__).resolve().parent
DESIGN = HERE.parents[1]
SLATE, CHALK, SULPHUR = '#253740', '#E9ECE6', '#DDE55E'

# One deliberately drawn master shape is shared by every format. The two pieces
# preserve the continuous diagonal fault seen in the selected A3 raster.
MARK = [
    'M36 6 Q40 2 46 2 H69 Q75 2 79 6 L96 23 Q100 27 100 33 V65 Q100 71 96 75 L84 87 L76 79 V43 Q76 40 73 37 L62 26 Q60 24 56 24 H31 L24 17 Z',
    'M15 19 L25 29 Q28 32 28 36 V60 Q28 63 31 66 L42 77 Q45 80 49 80 H69 Q73 80 76 83 L98 105 H83 L77 99 H47 Q41 99 37 95 L6 65 Q2 61 2 55 V36 Q2 30 6 26 Z',
]
MARK_SMALL = [
    MARK[0].replace('H31 L24 17 Z', 'H33 L27 14 Z'),
    MARK[1].replace('M15 19 L25 29', 'M12 21 L24 33'),
]

LETTERING = json.loads((HERE/'lettering-paths.json').read_text())
SERIF_PATH = f'<path d="{" ".join(LETTERING["word"]["paths"])}" fill-rule="evenodd"/>'
SERIF_W = LETTERING['word']['width']
SANS_PATH = f'<path d="{" ".join(LETTERING["holding"]["paths"])}" fill-rule="evenodd"/>'
SANS_W = LETTERING['holding']['width']

def svg(width,height,body,label,bg=None):
    rect=f'<path fill="{bg}" d="M0 0H{width}V{height}H0Z"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{html.escape(label)}">{rect}{body}</svg>'

def mark(x,y,size,color):
    return f'<g fill="{color}" transform="translate({x} {y}) scale({size/108:.6f})">'+''.join(f'<path d="{p}"/>' for p in MARK)+'</g>'

def mark_small(x,y,size,color):
    return f'<g fill="{color}" transform="translate({x} {y}) scale({size/108:.6f})">'+''.join(f'<path d="{p}"/>' for p in MARK_SMALL)+'</g>'

def word(x,y,width,color):
    return f'<g fill="{color}" transform="translate({x} {y}) scale({width/SERIF_W:.6f})">{SERIF_PATH}</g>'

def holding(x,y,width,color):
    return f'<g fill="{color}" transform="translate({x} {y}) scale({width/SANS_W:.6f})">{SANS_PATH}</g>'

def horizontal(color=SLATE, accent=SLATE):
    return svg(640,150,mark(8,22,108,color)+word(135,16,493,color)+holding(137,109,210,accent),'QAZNEDR HOLDING horizontal candidate')

def stacked(color=SLATE,accent=SLATE):
    return svg(540,330,mark(178,0,184,color)+word(70,210,400,color)+holding(170,286,200,accent),'QAZNEDR HOLDING stacked candidate')

def icon(color=SLATE):
    return svg(120,120,mark(6,6,108,color),'QAZNEDR Q mark candidate')

def write(name,content):
    (HERE/name).write_text(content,encoding='utf8')

write('logo-horizontal.svg',horizontal())
write('logo-stacked.svg',stacked())
write('mark.svg',icon())
write('logo-horizontal-mono.svg',horizontal('#000000','#000000'))
write('logo-stacked-mono.svg',stacked('#000000','#000000'))
write('mark-mono.svg',icon('#000000'))
write('logo-horizontal-inverse.svg',horizontal(CHALK,CHALK))
write('logo-stacked-inverse.svg',stacked(CHALK,CHALK))
write('mark-inverse.svg',icon(CHALK))

for n in (16,32):
    # Optical small variant opens the diagonal top cut for 16/32 px rasterization.
    write(f'favicon-{n}.svg',svg(n,n,mark_small(0,0,n,CHALK),f'QAZNEDR favicon {n}',SLATE))
write('favicon.svg',(HERE/'favicon-32.svg').read_text())
write('apple-touch-icon.svg',svg(180,180,mark(29,28,122,CHALK),'QAZNEDR app icon',SLATE))
write('wechat-avatar.svg',svg(640,640,mark(170,170,300,CHALK),'QAZNEDR WeChat avatar',SLATE))
write('og-default.svg',svg(1200,630,mark(82,213,196,CHALK)+word(327,211,790,CHALK)+holding(330,352,350,SULPHUR),'QAZNEDR HOLDING social preview',SLATE))

def data_png(name):
    p=DESIGN/'mockups/01'/name
    return 'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()

def inline(name): return (HERE/name).read_text()

review=f'''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QAZNEDR — A3 master candidate v1</title><style>
:root{{--slate:{SLATE};--chalk:{CHALK};--sulphur:{SULPHUR}}}*{{box-sizing:border-box}}body{{margin:0;background:#d8ddd9;color:var(--slate);font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}main{{max-width:1240px;margin:auto;padding:32px 20px 80px}}h1{{font-size:clamp(26px,4vw,46px);line-height:1.08;margin:0 0 12px}}h2{{font-size:21px;margin:0 0 20px}}h3{{font-size:15px;margin:0 0 10px}}p{{max-width:760px}}.eyebrow{{font-size:12px;letter-spacing:.13em;text-transform:uppercase;font-weight:700}}.intro{{padding:25px 0 30px}}.pill{{display:inline-block;background:var(--sulphur);padding:5px 10px;font-size:12px;font-weight:700}}.grid{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}}.card{{background:white;padding:22px;border:1px solid #bdc8c9}}.card.dark{{background:var(--slate);color:var(--chalk);border-color:var(--slate)}}.card.chalk{{background:var(--chalk)}}.sample{{min-height:230px;display:flex;align-items:center;justify-content:center;padding:22px}}.sample svg{{max-width:100%;height:auto}}.sample.horizontal svg{{width:100%}}.reference img{{display:block;width:100%;height:auto}}.size-grid{{display:flex;gap:30px;align-items:center;flex-wrap:wrap}}.size{{text-align:center;font-size:12px}}.size img{{display:block;margin:0 auto 8px}}.pixel img{{image-rendering:pixelated}}.circle{{width:168px;height:168px;border-radius:50%;overflow:hidden;margin:auto}}.circle svg{{width:168px;height:168px}}.full{{grid-column:1/-1}}.note{{font-size:13px;color:#53656b}}.dark .note{{color:#c4d2d3}}.swatches{{display:flex;gap:8px;flex-wrap:wrap}}.swatch{{padding:9px 12px;min-width:0;flex:1 1 130px;font-size:12px}}@media(max-width:740px){{.grid{{grid-template-columns:1fr}}.full{{grid-column:auto}}main{{padding:20px 12px 60px}}.card{{padding:16px}}.sample{{min-height:170px;padding:4px}}}}
</style><main><header class="intro"><div class="eyebrow">Identity 01 · review candidate</div><h1>A3 «Контур» — точный вектор, версия 1</h1><p>Продолжение уже выбранного направления A3 в палитре D2. Геометрия знака, очертания букв и пропорции этой версии ждут отдельного решения владельца. Растровый reference остаётся художественным ориентиром.</p><span class="pill">Кандидат для утверждения · не финальный мастер</span></header><section class="grid"><article class="card reference"><h2>Исходный A3</h2><img src="{data_png('imagegen-a3-contour.png')}" alt="Исходный растровый reference A3"></article><article class="card reference"><h2>Уточнённый reference</h2><img src="{data_png('imagegen-a3-refined-lockup.png')}" alt="Уточнённый растровый reference A3"></article><article class="card chalk"><h2>Новый мастер-кандидат · светлая тема</h2><div class="sample">{inline('logo-stacked.svg')}</div><div class="sample horizontal">{inline('logo-horizontal.svg')}</div></article><article class="card dark"><h2>Новый мастер-кандидат · тёмная тема</h2><div class="sample">{inline('logo-stacked-inverse.svg')}</div><div class="sample horizontal">{inline('logo-horizontal-inverse.svg')}</div></article><article class="card"><h2>Знак и малые размеры</h2><div class="size-grid"><div class="size"><img src="data:image/png;base64,{{PNG16}}" width="16" height="16" alt="16 px"><b>16 px</b></div><div class="size"><img src="data:image/png;base64,{{PNG32}}" width="32" height="32" alt="32 px"><b>32 px</b></div><div class="size pixel"><img src="data:image/png;base64,{{PNG16}}" width="96" height="96" alt="16 px enlarged"><b>16 px × 6</b></div><div class="size pixel"><img src="data:image/png;base64,{{PNG32}}" width="96" height="96" alt="32 px enlarged"><b>32 px × 3</b></div></div><p class="note">Для 16 и 32 px применена оптическая версия с более открытым диагональным разломом. Проверять читаемость на реальном экране иконки.</p></article><article class="card dark"><h2>WeChat · круглая обрезка</h2><div class="circle">{inline('wechat-avatar.svg')}</div><p class="note">Знак центрирован внутри безопасного круга; важные контуры не касаются края аватара.</p></article><article class="card full"><h2>Социальное превью 1200 × 630</h2><div class="sample" style="background:var(--slate)">{inline('og-default.svg')}</div></article><article class="card full"><h2>Использование</h2><div class="swatches"><div class="swatch" style="background:var(--slate);color:var(--chalk)">Сланец<br>#253740</div><div class="swatch" style="background:var(--chalk)">Мел<br>#E9ECE6</div><div class="swatch" style="background:var(--sulphur)">Сера<br>#DDE55E</div></div><p>Охранное поле: не менее половины высоты знака по периметру lockup. Предварительный минимум: горизонтальная версия 160 px по ширине, вертикальная 150 px; ниже использовать знак. Иконка 16 px и круглое поле WeChat представлены отдельно.</p><p>QAZNEDR и HOLDING переведены в контуры по пикселям уточнённого A3 reference. Это техническая векторизация уже выбранного рисунка букв, а не новый шрифт или новое направление. Точный мастер и оптическая чистка контуров ждут решения владельца. Сера применяется здесь только в социальном превью на сланцевом фоне; бронза исходного reference исключена.</p><p><strong>На согласование:</strong> точность характера Q, длина хвоста и ширина разлома; оптический вес и интервалы QAZNEDR; соотношение знака и надписи в обеих композициях.</p></article></section></main></html>'''
(DESIGN/'review/01-master-candidate.html').write_text(review,encoding='utf8')
