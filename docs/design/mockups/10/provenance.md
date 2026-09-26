# Geological realistic sprite v1

- Asset: `geology-realistic-v1.png`
- Method: built-in `image_gen.imagegen`, new image generation; no API or CLI fallback.
- Built-in output: `/Users/yerlankulumgariyev/.codex/generated_images/01a0df6d-e4d9-71a3-9245-453f7a6d6e78/exec-7d52ba41-646e-49b5-af6b-5240a33e19f9.png`
- Actual dimensions: 1254 × 1254 px; 8-bit RGBA PNG, true alpha.
- Visible bands at alpha > 16: top `y=73–446`, middle `y=464–841`, base `y=854–1218`. Full-width transparent gaps: `447–463` (17 px), `842–853` (12 px). X extents: `70–1185`, `73–1183`, `71–1184` respectively.
- Limits: transparent gaps are clean but much narrower than requested; a few bright edge pixels are visible along the slab boundaries. The horizontal footprints align closely, though the forms are naturally irregular and will not physically mesh with pixel precision after translation. This is a conceptual illustration of geology, not a real deposit or mineral assertion.

## Exact prompt

```text
Use case: stylized-concept
Asset type: premium transparent website hero sprite, photoreal geological specimen
Create ONE square PNG with TRUE transparent RGBA background. Exactly three separate physical rock slabs from a single geological cutaway block, floating in a clean vertical exploded arrangement. High-end PHOTOREALISTIC geological museum specimen render, convincing physical mass and depth, rough erosion and natural fracture, crisp realistic detail. Not an engraving, drawing, etching, diagram, infographic, cartoon, or painted illustration.
Geometry is critical: all three slabs have exactly the SAME isometric diamond footprint, the SAME left and right x coordinates, same central front corner x coordinate, same viewing angle and width (about 82% of canvas), centered on the same vertical axis. Their matching side edges should form a single solid geological block when moved together vertically. Three solid slabs only, no fragments.
Top slab entirely in the upper band y 6–29%: low rugged Kazakh steppe ridges and weathered stony hills, sparse dry grass, subtle distant horizon of the physical terrain, absolutely no towering alpine mountains or snowy peaks. Its front-facing cut sides are thick, with visible rocky mass.
Middle slab entirely in y 40–62%: weathered folded sedimentary rock, expressive real stone strata on BOTH front-facing cut sides; substantial thickness, tactile grain and irregular natural edges.
Base slab entirely in y 73–94%: deep dark crystalline bedrock, strong fracture planes and granular facets on BOTH front-facing cut sides; substantial thickness.
ENTIRE full-width horizontal rows y 30–39% AND y 63–72% must be completely transparent, empty alpha, with zero object pixels or shadows. Keep large clean gaps between objects. No overlaps even at points.
Palette: restrained deep slate #253740, chalk #e9ece6, natural earthy stone gray and taupe compatible with QAZNEDR D2. Tiny sparse muted sulfur #dde55e mineral flecks only, subtle and credible. NO gold, no glowing veins or ore.
Strong but soft directional studio light from upper left to reveal three-dimensional rough relief, realistic self-shadowing ONLY within the rock forms. Bright enough to read dark slate texture. Premium contemporary editorial realism, not fantasy.
No backdrop, color field, floor, cast ground shadow, haze, fog, glow, lens effect, floating dust/debris, grid, labels, text, arrows, watermark, extra pieces. The specimen is illustrative and makes no claim about a real deposit.
```

Parent pixel inspection: the vivid red edge specks visible in the raw-image viewer have alpha1; there are zero pixels with R>200/G<80/B<80 and alpha>16. Judge composited edges in the browser, not the raw viewer's transparency presentation. Source file was not retouched.
