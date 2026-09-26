# Geology motion study 07 — review specification

**Status:** design proposal for owner review. The working [prototype](../../../review/07-geology-motion.html) uses the existing [engraved cutaway](../../01/elements/geology-cutaway.png). [Storyboard](storyboard.png) shows its three desktop states; desktop and 375 px captures are alongside it.

## Story and behavior

| Stage             | Approximate scroll interval | Visual focus                               | One question answered                       |
| ----------------- | --------------------------- | ------------------------------------------ | ------------------------------------------- |
| 01 Surface        | first third                 | Whole cutaway and landscape                | Where is the broader setting?               |
| 02 Structure      | middle third                | Thin outline over strata/contact area      | Which relationships call for a closer look? |
| 03 Interpretation | last third                  | Tighter outline and brief source-check cue | What would the geologist verify next?       |

Desktop uses a normal sticky section with three `85vh` markers and no scroll interception. The illustration moves at most 24 px horizontally and scales at most 1.06. The focus outline and annotation interpolate in about 600–750 ms after a stage change. The progress rule shows discrete thirds. Stage buttons select a point in the ordinary page scroll and remain keyboard usable. There is no autonomous loop or timed advance.

At 375 px, the scene is an image in the page flow. Three buttons switch the selected outline and one short annotation. The buttons are at least 44 px high. RU / EN / 中文 share one image; Chinese uses system CJK faces and no added tracking on headings. A light-theme control changes the page chrome while retaining the dark art panel so the supplied illustration remains legible.

With `prefers-reduced-motion: reduce`, the sticky scene is replaced by three static text panels. With JavaScript disabled, the same panels remain visible. Neither mode requires the visitor to traverse animation to get the meaning. The source image is labelled as schematic, and the highlight means analytical attention only.

## What the study does not prove

This is one flat engraving with overlay geometry. It does **not** contain independent rock slices, a true layer reveal, 3D geometry, measured geology, grades, resources, coordinates, or site rights. A production layer separation needs newly prepared, consistent artwork, geological review of annotations, and owner approval of this direction.

## Checks

Run `node docs/design/mockups/07/motion/qa.cjs` from the repository root. It uses the existing local Chrome and installed Playwright/Sharp; no installation is needed. The run checks image loads, desktop/mobile horizontal overflow, stage-button state, JavaScript errors, reduced-motion static content, and no-JavaScript content, and refreshes the PNG captures. The 2026-09-26 run passed those checks.
