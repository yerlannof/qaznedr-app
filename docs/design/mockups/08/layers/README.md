# Geological reveal sprite, candidate v1

`sprite-v1.png` is a 1254 × 1254 RGBA sprite produced with the built-in ImageGen tool. Its background has genuine transparent pixels. It contains three independently croppable geological parts in a similar isometric view within one image. Their outlines are optically adjusted in the prototype; they are not exact surfaces of one measured 3D model.

| Layer, top to bottom       | Content bounds, inclusive | Suggested crop including breathing room |
| -------------------------- | ------------------------- | --------------------------------------- |
| Terrain cap                | x 41–1212, y 116–483      | x 0–1253, y 100–495                     |
| Folded sedimentary stratum | x 41–1210, y 513–880      | x 0–1253, y 500–882                     |
| Fractured basement         | x 41–1210, y 885–1229     | x 0–1253, y 883–1253                    |

Alpha threshold for content bounds: greater than 8 on a scale of 0–255. At the alpha >8 threshold, no foreground is detected at y 484–512 and y 881–884. At alpha >1, faint antialias pixels extend into the gaps, so these rows must not be described as fully alpha-zero. These bands are **unequal** despite the request for three equal cells, so animate with the measured crop windows rather than equal thirds. The second low-alpha gap is only four pixels and requires precise clipping. Native CSS cropping or transforms can separate the slabs without changing image pixels. Align each layer at the same horizontal center and adjust vertical offsets so the front vertices meet in the closed state.

Visual limitations: This is conceptual artwork. The vein is decorative, not a map of a real deposit. The top slab uses terrain color and engraving while the strata beneath use chalk/slate. The terrain front vertex is slightly left of the lower two, and some silhouette pixels have small bright cyan/yellow/red fringes. Review the assembled closed and expanded positions before implementation.

One targeted ImageGen refinement was attempted to clean the edges and align the vertices. Its output had a grey checkerboard baked into a fully opaque image (every pixel alpha 255), so it was rejected. `sprite-v1.png` remains the valid transparent asset. No manual matting or recoloring was applied.

## Final generation prompt

Use case: stylized-concept. Asset: transparent PNG sprite sheet for three independently movable website geology layers. Draw a SQUARE transparent canvas divided into THREE EQUAL HORIZONTAL BANDS, top/middle/bottom. EACH BAND contains ONE isolated, intact, thin isometric geological slab, centered horizontally at the same x position and same exact diamond-shaped plan footprint, scale, perspective and camera angle. Keep clear transparent padding around every slab and between the bands; no pixels touching band boundaries. Top band: a thin terrain cap with engraved Kazakh steppe and mountain ridgeline, visible top and slim front/right rock faces. Middle band: a separate thin sedimentary slab with intricate folded limestone and slate strata visible on its front and right cut faces. Bottom band: separate thin rugged basement slab, darker fractured rock with one modest pale sulphur-yellow vein on front and right cut faces. The three slab boundaries and planar shapes must align when stacked vertically by CSS translation. Art direction: elegant detailed geologic engraving, fine etched contours and stipple, editorial scientific illustration, chalk off-white highlights (#E9ECE6), deep slate (#253740), restrained sulphur (#DDE55E). Render rocks with organic intricate detail, no blank rectangular block faces. Orthographic three-quarter view, wide shallow diamond footprint, no cast shadows beyond the shapes. ACTUAL transparent alpha background, not a checkerboard illustration, not white or dark backdrop. No text, labels, arrows, UI, logo, border, people or deposits claim. Reference concept: geological cutaway's engraved Kazakh mountain and strata; D2 slate/chalk/sulphur brand palette. The bands must be independently croppable for a restrained 2.5D layer reveal.

## Independent asset verification

Pixel counts, threshold-qualified bounds and SHA-256: [asset-qa.json](../qa/asset-qa.json). The runtime uses the same source PNG in three separately clipped DOM elements. This is one image atlas with three drawable parts, not three separate source images or 3D geometry.
