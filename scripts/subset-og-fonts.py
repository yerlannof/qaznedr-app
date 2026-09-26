#!/usr/bin/env python3
"""Build static Noto Sans SC OG subsets from the official variable font."""

import argparse
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.subset import Options, Subsetter

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / 'public' / 'brand' / 'fonts'


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        'source_font', type=Path, help='Path to upstream NotoSansSC[wght].ttf'
    )
    args = parser.parse_args()
    source = args.source_font.expanduser().resolve()
    if not source.is_file():
        parser.error(f'source font does not exist: {source}')

    text = (ROOT / 'src/lib/i18n/translations.ts').read_text(encoding='utf-8')
    for guide in sorted((ROOT / 'content/insights').glob('*/zh.md')):
        text += '\n' + guide.read_text(encoding='utf-8')
    text += ''.join(chr(codepoint) for codepoint in range(0x20, 0x7F))
    unicodes = sorted(map(ord, set(text)))

    FONT_DIR.mkdir(parents=True, exist_ok=True)
    for weight, filename in (
        (400, 'NotoSansSC-OG-Regular.ttf'),
        (700, 'NotoSansSC-OG-Bold.ttf'),
    ):
        font = TTFont(source)
        font = instantiateVariableFont(font, {'wght': weight}, inplace=True)
        options = Options()
        options.flavor = None
        options.recalc_bounds = True
        options.canonical_order = True
        subsetter = Subsetter(options=options)
        subsetter.populate(unicodes=unicodes)
        subsetter.subset(font)
        target = FONT_DIR / filename
        font.save(target)
        cmap = font.getBestCmap()
        missing = sorted({char for char in text if ord(char) > 127 and ord(char) not in cmap})
        print(
            f'{filename}: {target.stat().st_size:,} bytes, '
            f'{len(cmap):,} glyphs, {len(missing)} requested unsupported code points'
        )
        if missing:
            print('Unsupported examples:', repr(''.join(missing[:40])))


if __name__ == '__main__':
    main()
