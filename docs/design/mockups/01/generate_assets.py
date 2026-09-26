from pathlib import Path

OUT = Path(__file__).parent

MARKS = {
    'a': '''<rect x="3" y="3" width="58" height="58" rx="3" fill="#20302D"/><path d="M8 20 26 17 41 22 56 18v9L41 31 26 26 8 29Z" fill="#D7B568"/><path d="M8 33 26 30 41 35 56 31v9L41 44 26 39 8 42Z" fill="#E9E0CB"/><path d="M8 46 26 43 41 48 56 44v12H8Z" fill="#A8844B"/><path d="m30 8-6 48" stroke="#20302D" stroke-width="4"/>''',
    'b': '''<path d="M48 44A22 22 0 1 1 51 36" fill="none" stroke="#18334A" stroke-width="11" stroke-linecap="butt"/><path d="m39 39 16 17" stroke="#AA684A" stroke-width="9" stroke-linecap="square"/><path d="m43 43 13 13" stroke="#F0E9DC" stroke-width="2"/>''',
    'c': '''<path fill="#17372E" fill-rule="evenodd" d="M32 7a24 24 0 1 0 0 48 24 24 0 0 0 0-48Zm0 8a16 16 0 1 1 0 32 16 16 0 0 1 0-32Z"/><path d="m42 44 12 13" stroke="#A47C45" stroke-width="5" stroke-linecap="square"/><path d="M9 60h46" stroke="#A47C45" stroke-width="2"/>'''
}

CONFIG = {
  'a': {'name': 'Страты', 'ink':'#20302D', 'accent':'#D7B568', 'word':'Arial, Helvetica, sans-serif', 'weight':'700', 'spacing':'3.3'},
  'b': {'name': 'Керн Q', 'ink':'#18334A', 'accent':'#AA684A', 'word':'Arial, Helvetica, sans-serif', 'weight':'700', 'spacing':'2.7'},
  'c': {'name': 'Слово и недра', 'ink':'#17372E', 'accent':'#A47C45', 'word':'Georgia, Times New Roman, serif', 'weight':'400', 'spacing':'1.2'}
}

def wrap(viewbox, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" role="img" aria-label="QAZNEDR HOLDING">{body}</svg>\n'

for key, cfg in CONFIG.items():
    mark = MARKS[key]
    (OUT / f'{key}-mark.svg').write_text(wrap('0 0 64 64', mark), encoding='utf-8')
    (OUT / f'{key}-favicon-16.svg').write_text(wrap('0 0 64 64', mark), encoding='utf-8')
    (OUT / f'{key}-favicon-32.svg').write_text(wrap('0 0 64 64', mark), encoding='utf-8')
    if key == 'c':
        horizontal = f'<text x="4" y="39" fill="{cfg["ink"]}" font-family="{cfg["word"]}" font-size="38" letter-spacing="{cfg["spacing"]}">QAZNEDR</text><path d="M5 49H255" stroke="{cfg["accent"]}" stroke-width="3"/><text x="263" y="51" fill="{cfg["ink"]}" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" letter-spacing="4">HOLDING</text>'
        stacked = f'<text x="25" y="97" fill="{cfg["ink"]}" font-family="{cfg["word"]}" font-size="42" letter-spacing="{cfg["spacing"]}">QAZNEDR</text><path d="M27 111H266" stroke="{cfg["accent"]}" stroke-width="3"/><text x="77" y="139" fill="{cfg["ink"]}" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" letter-spacing="6">HOLDING</text>'
    else:
        horizontal = f'<svg x="0" y="0" width="64" height="64" viewBox="0 0 64 64">{mark}</svg><text x="84" y="36" fill="{cfg["ink"]}" font-family="{cfg["word"]}" font-size="27" font-weight="{cfg["weight"]}" letter-spacing="{cfg["spacing"]}">QAZNEDR</text><text x="86" y="55" fill="{cfg["ink"]}" font-family="{cfg["word"]}" font-size="11" font-weight="700" letter-spacing="6">HOLDING</text>'
        stacked = f'<svg x="112" y="6" width="72" height="72" viewBox="0 0 64 64">{mark}</svg><text x="38" y="113" fill="{cfg["ink"]}" font-family="{cfg["word"]}" font-size="30" font-weight="{cfg["weight"]}" letter-spacing="{cfg["spacing"]}">QAZNEDR</text><text x="96" y="139" fill="{cfg["ink"]}" font-family="{cfg["word"]}" font-size="13" font-weight="700" letter-spacing="6">HOLDING</text>'
    (OUT / f'{key}-horizontal.svg').write_text(wrap('0 0 405 64', horizontal), encoding='utf-8')
    (OUT / f'{key}-stacked.svg').write_text(wrap('0 0 300 156', stacked), encoding='utf-8')

print(f'Created {len(list(OUT.glob("*.svg")))} SVG files')
