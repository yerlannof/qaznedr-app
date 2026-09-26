# Geological sprite v1

- File: `geology-sprite-v1.png`
- Method: built-in `image_gen.imagegen`, new-image generation; no API or CLI fallback.
- Generated file: `/Users/yerlankulumgariyev/.codex/generated_images/01a0df6d-e4d9-71a3-9245-453f7a6d6e78/exec-c48a0569-e091-41a0-88e8-3a190fc385cb.png`
- Output: 1254 × 1254 px, 8-bit RGBA PNG with transparent background.
- Nontransparent bands at alpha > 16: top `y=140–453`, middle `y=525–821`, base `y=882–1201`. Band x extents: `114–1140`, `112–1141`, `113–1141`. Empty full-width rows: `454–524`, `822–881`.
- Source reference inspected for visual direction only: `public/brand/geology-layers.png`. The generated file is a new image, not an edit of that reference.
- Intended as an illustrative graphic, not a depiction of a real deposit or mineral claim.

## Exact final prompt

```text
Use case: stylized-concept
Asset type: transparent PNG sprite for premium editorial website
Create a SINGLE isometric geology block separated cleanly into THREE isolated horizontal slabs. Museum specimen lithographic engraving in slate #253740, chalk #e9ece6, muted earthy grays, very sparse sulfur #dde55e flecks. Top slab: mountain-steppe terrain above cut rock. Middle slab: folded sedimentary strata. Bottom slab: fractured crystalline bedrock. All slabs have identical width, perspective, diamond footprint and matching x coordinates for all four corners; all are centered on the same vertical axis. They must visually become one cohesive rectangular rock cube if vertically moved together.
CRITICAL GRAPHIC LAYOUT: Square transparent RGBA canvas. Top piece entirely contained in y=6–28% of canvas. Middle piece entirely contained in y=40–59% of canvas. Base piece entirely contained in y=72–91% of canvas. The entire full-width horizontal strips y=29–39% and y=60–71% must be 100% transparent, completely empty, with NO pixels from any object. Make the horizontal gaps visibly large and unambiguous. Keep each slab width about 80%, equal across the three slabs. No overlapping silhouettes, even at the center points. Each slab should be quite flat vertically while having visible thick front-facing cut sides. Precise geometric consistency is more important than dense landscape height.
True alpha transparency everywhere outside three slabs. No background, ground, shadow, fog, reflections, labels, text, arrows, borders, grid, gold, glowing ore, debris, watermarks. Refined natural engraving details, crisp clean edges. Illustrative, no implied real mineral deposit.
```

The tool selected 1254 px despite the request for a square layout. It also placed the pieces lower than the prompt's target percentages; the actual measured bands above should be used for clipping.
