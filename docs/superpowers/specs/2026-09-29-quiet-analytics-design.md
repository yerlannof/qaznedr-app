# Quiet analytics and distinct mineral metadata

Owner explicitly asked to remove the distracting analytics acceptance popup and continue existing search/conversion work.

- Remove only automatic consent banner. Keep approved optional settings in footer, focus handling, existing valid choice, TTL/storage revocation and default-denied GA4/Metrica. Do not silently opt visitors in. Existing Vercel aggregate analytics and Search Console remain separate.
- Improve duplicate descriptions on six existing mineral hubs by composing the already approved localized mineral name and approved catalog description. Keep CollectionPage schema aligned. No new public claims, pages or layout.
- Validate first visits/navigation/expiry without banner, footer opt-in/revocation, locales/themes and private pages; test metadata uniqueness in four languages. Full baseline Jest, lint, build, browser, independent review, deploy and verify.
