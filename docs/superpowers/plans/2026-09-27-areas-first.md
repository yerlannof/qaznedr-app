# Areas-first implementation plan

1. Record exact approval and owner-supplied facts; collect equivalent KZ/EN/ZH translations and audit public page copy.
2. TDD: footer/contact profile link and home/about/contact sameAs; hero catalog-first action while preserving contact routing for four locales.
3. Implement shared Instagram URL, existing link styling and approved copy in translations/hero/company/schema. Update llms/README and Douyin draft; avoid speculative claims.
4. Run focused Jest, full Jest against baseline, ESLint and build. Verify browser 375/1440, light/dark, four locales and resulting links/schema/text.
5. Independent review whole diff vs specification; correct important defects via tests. Update HOLDING_ROADMAP current status and owner requirements, commit explicit files, push master, wait successful production SHA and check live pages/sync.
