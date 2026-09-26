# A3 «Контур» / D2 — vector candidate v1

**Status:** review candidate for the owner, 2026-09-26. The selected direction is A3 «Контур» with D2 «Сланец / сера». This folder does not declare final logo geometry, final lettering, or approval of a production pack. The raster references are `../../mockups/01/imagegen-a3-contour.png` and `../../mockups/01/imagegen-a3-refined-lockup.png`.

## Files

- `logo-horizontal.svg`, `logo-stacked.svg`, `mark.svg`: primary slate paths on transparent backgrounds.
- `logo-horizontal-mono.svg`, `logo-stacked-mono.svg`, `mark-mono.svg`: solid black single-colour variants.
- `logo-horizontal-inverse.svg`, `logo-stacked-inverse.svg`, `mark-inverse.svg`: chalk paths on transparent backgrounds for slate fields.
- `favicon.svg`, `favicon-16.svg`, `favicon-32.svg`, `favicon-16.png`, `favicon-32.png`: small icon candidates.
- `apple-touch-icon.svg`, `apple-touch-icon.png` (180 × 180), `wechat-avatar.svg`, `wechat-avatar.png` (640 × 640), `og-default.svg`, `og-default.png` (1200 × 630).
- `comparison-sheet.png`: raster references beside the new vector candidate. The self-contained review page is `../../review/01-master-candidate.html`.

The emblem is two manually built path pieces around one diagonal geological break. QAZNEDR and HOLDING are traced from the **selected A3 refined raster reference** using a local pixel threshold. Round spans are fitted with curves, straight strokes are simplified, and the small O/D/G bowls are cleaned to the measured raster bounds. The paths keep the characteristic sharp Q tail, wedge serifs, letter widths and spacing rather than replacing them with a typeface. No `<text>` elements, runtime font references, linked images, gradients, bronze, or filters appear in the logo SVG files. The original generated lettering is part of a raster image, not a font. The Source Serif 4 and IBM Plex families elsewhere in `brand/fonts/` are for typeset brand and site text, not the logo.

## Provisional usage

- Palette: slate `#253740`, chalk `#E9ECE6`, sulphur `#DDE55E`. Primary logo lockups use slate on chalk or chalk on slate. The sulphur accent appears only in the OG HOLDING line on a slate field.
- Clearspace around a lockup or separate mark: at least **½ the rendered Q mark height** on every side. This is a provisional rule to review against actual placements.
- Proposed minimum digital width: horizontal lockup **160 px**, stacked lockup **150 px**. Below these, use the stand-alone mark. The 16 and 32 px favicon use an optical variant with a more open upper diagonal cut.
- The 640 px WeChat square keeps the full mark well inside a circular avatar crop, with about 170 px inset from the square edges before the icon geometry.

## Quality check and open decisions

The 16 and 32 px PNGs were inspected at native size: the Q silhouette and wider optical upper cut read. The 640 px WeChat image and 1200 × 630 OG image were inspected. The stacked mark-to-word proportion has been brought near the selected A3 raster. The word and HOLDING reproduce the raster silhouettes, but thresholding and curve cleanup can shift individual edges by a few source pixels. The mark is a manual reconstruction, not a literal trace. D2 changes the original charcoal/bronze colours to slate/chalk/sulphur. Exact break width and proportions remain for the owner's selection.

Build with `node docs/design/brand/candidate-v1/trace-reference.cjs`, `python3 docs/design/brand/candidate-v1/build.py`, then `node docs/design/brand/candidate-v1/export.cjs` from the repository root. The trace and export use the already installed `sharp` package. Rebuild regenerates the self-contained HTML page and PNG assets.
