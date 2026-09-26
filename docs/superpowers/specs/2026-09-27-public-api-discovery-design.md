# Public API discovery correction

The owner asked to continue all independent roadmap work. Read-only audit found that the AI discovery manifest links to an OpenAPI document advertising the hidden legacy marketplace. This contradicts the approved areas-first positioning.

Scope: describe only the existing public GET /api/leads and GET /api/leads/{code}, using actual request filters, pagination, response envelopes and a documented subset of teaser fields. Do not add routes, change authorization, publish rows or expose private data. Do not document enquiry submission or gated endpoints as tools. Preserve API/private-route robots exclusions, with one exact allow rule for the static /api/openapi.json document currently linked by the manifest. Replace the manifest's unqualified “free” summary with the already approved English areas-first sentence from llms.txt. Leave the unconfigured email as an explicit owner-dependent issue; do not invent a replacement.

Acceptance: contract tests fail against the legacy document, then pass; documented paths map to current handlers; documented field names belong to TEASER_COLUMNS; canonical server and manifest link agree. Build, existing test baseline, independent review and local/production HTTP/browser checks pass. This corrects discovery metadata, not a promise of search indexing or traffic. No visual design changes.
