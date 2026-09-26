# Layer sprite asset QA

`asset-qa.json` records a pixel-level audit of the selected `sprite-v1.png` and its current use in `review/08-geology-layers.html`. The source is one 1254 × 1254 RGBA PNG with genuine transparent pixels. At alpha >8, three horizontal content bands are separated by fully clear rows, and the README crop windows include every band pixel without including adjacent-band pixels at that threshold.

At alpha >1, antialiased pixels bridge the narrow gaps, so the bands are visually separate at the >8 threshold but not fully disconnected across all nonzero alpha values. The artwork is one raster plate with three visual parts, revealed through HTML clipping: a 2.5D composition, not three separate PNG files or a 3D model. The alpha distribution among pixels above 8 is included in the JSON; most foreground pixels encode alpha 252–253 out of 255 (about 99% opacity), so the partial-alpha count does not imply visibly translucent rock. No image editing was performed.
