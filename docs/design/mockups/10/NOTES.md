# Sequence 10 — proposed visual refinement

Owner requested further work on09. Owner clarified that motion, artwork realism and composition all need to change. The initial motion-only draft was not presented as a finished proposal; this version is being rebuilt around a newly generated photorealistic specimen and reversed art/copy layout. It does not claim that09 was approved.

Primary reference: [Cinematic3DScroll by JosephASG](https://github.com/JosephASG/codrops-cinematic-scroll-animations), specifically [cinematic-scene-showcase.tsx](https://github.com/JosephASG/codrops-cinematic-scroll-animations/blob/main/src/components/pages/variant-2/cinematic-scene-showcase.tsx). Read via GitHub API on27.09.2026. The example uses a scrubbed GSAP timeline for camera and look-at target positions. We borrow the design principle of sequencing and framing, not source code or assets; no dependency installed.

Actual proposal10 remains2.5D: a coherent block at1.14× scale; top lifts as framing widens to0.89×; base separates next; middle contact becomes the focus at1.01×. No false camera rotation of a flat image. A connected leader identifies the illustrative contact, not an actual mineral resource.

If true3D is later selected, [React Three Fiber's on-demand rendering guidance](https://github.com/pmndrs/react-three-fiber/blob/53ec672ac4a7189711766b87ece18889abbb32d4/docs/advanced/scaling-performance.mdx) is relevant: render only when needed, explicitly invalidate for imperative changes. This documentation does not prove a future scene's performance; geometry, assets and device testing remain necessary.

New source image and exact prompt are recorded in `provenance.md`. The09 sprite is a temporary development fallback only and must not be mistaken for the final10 artwork.

Initial source/background-alpha review: colored edge specks in the raw viewer are alpha1, not opaque red artifacts. The browser composites the new source cleanly; no pixel editing was performed.
