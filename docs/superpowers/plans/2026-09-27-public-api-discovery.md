# Public API discovery plan

1. Verify HEAD/origin/Production (5d26179, success) and read existing API handlers, query contract and approved copy.
2. Add failing contract tests in src/__tests__/lib/seo/api-discovery.test.ts for allowed GET paths, filters, public fields, pagination and manifest consistency.
3. Correct public/api/openapi.json and manifest summary using existing contract and approved copy.
4. Run targeted/full Jest, ESLint, build; inspect served documents and actual read-only API response on local production server and live site.
5. Independent review, record findings/checks in HOLDING_ROADMAP.md, explicit-path commit/push, verify production sync.
