# Approved scene12 and map services — implementation

Owner approved the shown review12 and exact RU draft on 29Sep. Preserve A3/D2, locale parity, public area data untouched.

Scene: all three text steps in document flow, sticky artwork desktop/mobile, native scroll only; progress tracks real step geometry, keyboard controls navigate to matching step; no-JS/reduced motion/height<=640 are static expanded. No new animation dependency. Header clearance and mobile floating contact must not obscure selected step.

Service: add approved map-support block to existing geological service page and update its 4-locale title/description. Map guide receives approved contextual closing CTA, other guides unchanged. Subtle approved contour separator used in new blocks. Existing homepage area order retained. Direct WhatsApp action (RU/KZ/EN where configured) includes geology topic, Chinese WeChat/fallback routes to context-preserving contact page. Tracking uses existing consent-gated safeTrack, no new data.

Validation: TDD (scene motion/fallback/control, copy4locales, CTA routes/topic/analytics), full baseline comparison, lint/build, responsive4locale/two-theme check, static fallback source/shortscreen test, independent review and production release.
