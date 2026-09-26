# Geological sequence 10 — refinement proposal

Owner declined the visual proposal09: «Нужно ещё доработать внешний вид». Approval remains absent. Owner then clarified «все что ты перечислил»: improve motion, drawing (more volume/realism), and composition. This supersedes the preliminary motion-only experiment; no version10 has been approved or deployed.

## Diagnosis and direction

09 corrected alignment but still felt mechanically uniform. Three equally separated slabs and a disconnected small marker did not provide a strong visual sequence. Commission a materially different photorealistic transparent geological specimen sprite (physical rock/steppe, matching slab footprints, restrained slate/chalk/earth colors, no glowing ore). Keep approved product copy. Move the large specimen LEFT and a compact caption rail RIGHT under one full-width section header. This is a new composition, not the09 frame with slightly different offsets. Author a sequence with changing scale and attention:

1. Large assembled block, brief initial hold.
2. Top lifts first; the whole composition pulls back enough to reveal structure.
3. Lower slab separates, exposing the middle.
4. Restrained camera-like zoom toward the actual middle contact, with surrounding slabs slightly subdued. One connected leader points to the contact.

New sprite must be visually inspected and its actual alpha bands measured; assembly follows front edges, not bounding rectangles. No rotation of a flat image to imitate a true 3D model. Continuous deterministic scroll mapping, exact reversal, no timed catch-up; mobile stage buttons and static reduced/noJS remain. Stable accessible text in all four locales. No new geological or business assertions.

Inspiration is the principle of staged camera/framing from [JosephASG's Codrops source](https://github.com/JosephASG/codrops-cinematic-scroll-animations), not copied code or assets. Its `cinematic-scene-showcase.tsx` uses a GSAP scrub timeline for camera/target positions. The current proposal can explore framing without installing WebGL packages; actual 3D remains a separate option if the owner's feedback requires it.

## Deliverable

Standalone `docs/design/review/10-geology-sequence.html`, screenshots and checks in `docs/design/mockups/10/`. Parent visual direction and independent review before asking approval. Production retains corrected08 throughout.
