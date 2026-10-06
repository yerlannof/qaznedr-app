# Guide → service → contact attribution — 2026-10-06

User authorised independent improvements available without new team materials. Current direct guide/contact links preserve a registered guide; service hops lose it. Fix only technical propagation, reuse existing approved UI/copy, no new topic assumptions. Owner/contact/area data, consent and ads remain unchanged.

## Behaviour

- Published markdown links to existing same-locale /services, /services/legal and /services/geological carry a registered guide query before an existing section anchor.
- These service pages pass a validated single guide to existing detail/catalogue/closing/header/footer contact actions, and to the return/detail service links.
- Mobile service contact and service language switches preserve it. Unknown/array guide queries are ignored. Ordinary direct service visits are unchanged; query context does not enter canonical, schema or OG URLs.
- No session storage or additional identifier collection. Existing WhatsApp/WeChat/form context uses the existing approved title and message.

## Verification

Failing regression tests first: all four languages, real guide service links including due-diligence anchor, contact actions across three service pages, mobile and language switch, unknown/array context and unchanged canonical/schema. Existing guide/contact and service tests remain green. Full Jest baseline, lint, production build; browser 375/1440, two themes and four languages; independent full-diff review; exact Production success and read-only HTTP checks.

## Rendering boundary

Three service routes read validated searchParams server-side and become dynamic. Mobile query reading is restricted to service routes beneath a local Suspense with the existing queryless contact action as fallback. Non-service mobile actions retain static markup.
