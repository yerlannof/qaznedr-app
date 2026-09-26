# Geology layer reveal 08 — review specification

**Status:** design proposal, awaiting owner review. Open [the local review page](../../../review/08-geology-layers.html) directly in a browser. The page uses the ImageGen [transparent sprite](../layers/sprite-v1.png), the A3 vector candidate, and local brand fonts. It contains no project measurements or implied site rights.

## What changes from study 07

Study 07 moves one flat engraving and an outline. This prototype has **three independent DOM planes**, each revealing a different crop of one transparent raster. The planes share a fixed camera, scale, and footprint. The first state stacks their visible faces into a compact illustrated object; the second moves them apart; the third keeps them apart and frames one contact as a question. This is a 2.5D composition of authored artwork, not a 3D model or a subsurface interpretation.

## Source and crop windows

The source is a 1254 × 1254 RGBA PNG with real alpha, arranged vertically. The three parts have a comparable camera and scale, but their footprints do not match perfectly; the compact assembly is an optical alignment, not a seamless geological solid. The three independent content bounds measured in pixels are:

| Plane         | Source bounds         | CSS crop of full square  |
| ------------- | --------------------- | ------------------------ |
| Surface       | x 41–1212, y 116–483  | `inset(8.5% 0 60.7% 0)`  |
| Folded middle | x 41–1210, y 513–880  | `inset(40.8% 0 29.4% 0)` |
| Basement      | x 41–1210, y 885–1229 | `inset(70.5% 0 1% 0)`    |

All three DOM elements retain the original full square coordinate system, then use `clip-path` to show their own band. This preserves the generated registration. The top and middle have a 29 px empty gap in the source and the middle and basement have a 4 px empty gap when alpha values of 8 or less are ignored. Very faint pixels remain below that threshold, so these are practical crop gaps rather than absolute alpha-zero bands. Tiny color fringes remain around a few edges of the generated art. A second ImageGen refinement was rejected because it baked an opaque checkerboard into the pixels. The valid v1 alpha is retained without manual cutout or retouching.

## Motion and reading

The desktop art plane is up to 700 px square inside a 58% width art panel; copy occupies 42%. One normal sticky scene spans three ordinary scroll markers. Scroll position selects the nearest marker. Buttons also select a marker and work with keyboard focus. There is no scroll lock, timer loop, autoplay, or parallax. CSS eases independent `translate` changes over 1 second. The ring appears only on the last stage.

The table gives CSS translations _before_ the shared stage-0 centering offset of +70 px on desktop, +46 px at tablet widths, or +42 px at 375 px. X and Y are screen pixels, not geological distances.

| Plane         | Compact desktop | Separated desktop | Focus desktop | Compact 375 | Separated 375 | Focus 375   |
| ------------- | --------------- | ----------------- | ------------- | ----------- | ------------- | ----------- |
| Surface       | x +26, y 0      | x +7, y −66       | x +3, y −85   | x +13, y 0  | x +5, y −28   | x +4, y −38 |
| Folded middle | x 0, y −125     | x +16, y 0        | x +17, y 0    | x 0, y −66  | x +7, y 0     | x +8, y 0   |
| Basement      | x 0, y −240     | x −7, y +62       | x −12, y +81  | x 0, y −125 | x −3, y +29   | x −4, y +39 |

The 375 px layout puts art first and copy plus three 48 px buttons directly underneath; choosing a button does not move the page. At ≤850 px the scene is in normal document flow and the scroll markers disappear. The same local art is used for RU, EN, and 中文, with all live labels and text outside the image. Chinese text uses system CJK fonts. Light and dark page themes keep the art on slate `#253740` so its engraving remains legible; the global palette is the approved D2 slate, chalk, and sulphur direction. The displayed horizontal logo is explicitly the pending A3 technical candidate, not an approved final master.

Reduced-motion mode presents the separated art and three static explanations in normal flow, with no transform transitions. Without JavaScript, the same static explanations and separated art remain visible. The source is labelled a schematic illustration without scale; focus means a topic for analysis, not evidence of a deposit. The geology, Chinese wording, and final logo geometry still need specialist or owner review before implementation.

## Evidence

- [Desktop storyboard](storyboard-desktop.png): three 1440 × 900 states in order; individual full-size frames are `desktop-1.png`, `desktop-2.png`, and `desktop-3.png`.
- [375 px Russian](mobile-375-ru.png) and [375 px Chinese / stage 3](mobile-375-zh-stage3.png).
- [Reduced-motion capture](reduced-motion.png).
- [QA report](qa.json) and [script](qa.cjs), run with `node docs/design/mockups/08/prototype/qa.cjs` from the repository root. The script uses already installed local Playwright, Sharp, and Chrome; no package installation is needed. It covers 375 / 768 / 1440 widths, working buttons, stage and language persistence, light/dark themes, loaded images, horizontal overflow, page errors, reduced motion, and no-JavaScript content.

For approval, the owner should decide whether the independent layer treatment improves on study 07 and whether the separation amount and illustration density fit the site. The specific illustration, timing, labels, and master logo remain review proposals.
