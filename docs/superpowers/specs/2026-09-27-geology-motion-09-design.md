# Geological motion study 09 — proposal, not approved

Owner requested GitHub research and a more refined, fast geological scene after reporting desktop scroll problems. The approved scene 08's behavioral defect is fixed independently in `4fa2418`; this proposal must not silently replace its approved appearance.

## Direction

- Keep A3, D2, local Source Serif 4 / IBM Plex Sans and existing four-language scene copy.
- Give the illustration more space in a single dark section; steady camera and text.
- One newly generated transparent engraving with three matching isometric slabs, moving along the same vertical axis.
- Compact pose must assemble using matching front edges and correct stacking order, not merely eliminate gaps between rectangular image bounds.
- Scroll directly controls opening; reversing scroll retraces the same coordinates without timed catch-up. A small contact marker appears in the final phase.
- Fine labels follow their slab. Illustration is explicitly schematic, without claims about any real area's depth, reserves or geology.
- Manual buttons on mobile/short screens; all content static with reduced motion or JavaScript disabled.

Research and decisions: `docs/design/mockups/09/RESEARCH.md`. Image provenance and exact prompt: `docs/design/mockups/09/provenance.md`. No third-party source or image copied; no runtime dependency added.

## Deliverable and acceptance

Standalone review page `docs/design/review/09-geology-motion.html`, with review controls outside the proposed site section. Check 375×900, 1024×740 and 1440×900, both themes, RU/KZ/EN/ZH, reduced motion and no JS. Verify assembled/exploded geometry, readable labels, no footer overlap, stable copy and reverse movement. Parent visually inspects screenshots and a separate reviewer checks the result.

Show the concrete interactive proposal to Yerlan. Only after explicit approval record it in APPROVED.md and implement production changes through TDD, full checks and deployment. Until then production retains fixed scene 08.
