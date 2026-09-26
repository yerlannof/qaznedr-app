# QAZNEDR HOLDING

Source code for the company website: **[qaznedr.kz](https://qaznedr.kz)**.

We present areas selected by our geologists based on their review of geological materials. Our team includes Kazakhstani specialists, including geologists with 50 years of experience. We discuss a specific area and the form of cooperation, and support licensing, due diligence, and fieldwork.

## Public website

- [Areas](https://qaznedr.kz/en/leads): public teasers with mineral, region, geological information and the status check date. The holding does not claim ownership of the displayed areas; detailed materials are shared after a meeting and an NDA.
- [Services](https://qaznedr.kz/en/services): licensing, geology and fieldwork, area due diligence, and analytics.
- [Investor guides](https://qaznedr.kz/en/insights), [company information](https://qaznedr.kz/en/about), and [contact](https://qaznedr.kz/en/contact) through WeChat, WhatsApp or the inquiry form.
- Instagram: [@qaznedr.kz](https://www.instagram.com/qaznedr.kz/).
- Russian, Kazakh, English and Chinese interfaces. Guides currently have RU/EN/ZH versions; KZ guides use the Russian source. Terms remain in Russian pending approved legal translations.

The former open marketplace has been replaced by the holding website. Legacy listing, supplier and investor-directory routes redirect to current pages. Some legacy implementation remains in the repository; it does not describe the current public product.

## Development

Use Node.js 20+ and npm. Configure a dedicated development Supabase project and authentication settings using `.env.example`; keep credentials in the local environment, never in Git. Production area records are managed by the geodata team and must not be edited or seeded by website development tasks.

```bash
npm ci
cp .env.example .env.local
# Fill the required development settings in .env.local before starting.
npm run dev
```

The local app runs at [localhost:3000](http://localhost:3000). Optional contact channels stay hidden when they are not configured.

```bash
npx jest                                      # Full unit/integration suite
npx jest --coverage=false <test-path>          # Focused tests
ESLINT_USE_FLAT_CONFIG=false npx eslint <file> # Changed-file lint
npm run build                                 # Production build and type check
PORT=3107 npm run start                        # Local production browser check
```

Known legacy test failures and the required test-first/review process are documented in [AGENTS.md](AGENTS.md). Browser verification covers 375/1440 px, both themes and changed locales. Use the current roadmap for the latest validation results rather than the old marketplace test baseline alone.

## Stack and deployment

Next.js 15.5 App Router, React 19, TypeScript 5, Tailwind CSS 3, Supabase/Postgres and NextAuth. Jest covers application behavior; Playwright is available for browser checks. Legacy Prisma usage remains in some supporting modules and is not the source of the area catalog.

Vercel deploys production from GitHub `master`. The release workflow is tests, lint, build, browser verification, independent review, then `git push origin master`; do not additionally run a manual production deployment. Verify the GitHub Production deployment SHA/status and the live site after each release. The canonical public domain is **qaznedr.kz**.

## Project documentation

- [Roadmap and current status](docs/HOLDING_ROADMAP.md)
- [Agent workflow and safeguards](AGENTS.md)
- [Technical rules](CLAUDE.md)
- [Approved design and copy](docs/design/APPROVED.md)
- [Holding product specification](docs/superpowers/specs/2026-09-26-qaznedr-holding-pivot-design.md)

## License

Proprietary — all rights reserved.
