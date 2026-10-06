# Gold hub contextual guide links — 2026-10-06

## Objective and authority

Owner asks to continue improving the site. The same-day SEO review records RU gold among visited pages (66 in the read-only dashboard snapshot); existing hub offers only reserve classification and FAQ. Improve navigation to already published, approved gold-map guides. This does not assert traffic attribution or forecast rankings.

Reuse the existing plain text-links row in the approved mineral hub context section (design06/APPROVED.md). No new heading, summary, card, section, visual language or public wording. Labels come verbatim from approved insights.links translations; guide URLs use insightHref. Do not add GuideLinks or modify article bodies, metadata, dates, schema or leads.

## Behaviour

Gold links in order: geologicalMap, eastKazakhstanGoldMap, satelliteGoldMap, existing reserveClassification, then existing FAQ. All four locales use their existing labels and direct written-locale URLs. Other five mineral hubs retain the existing reserveClassification/FAQ links unchanged. Gold links render even when its published lead list is empty: explanatory articles do not imply an available area. Existing canonical/schema and visible lead ItemList remain unchanged.

## Evidence

TDD: four locales, gold-specific links, empty and populated lead states, other five hubs retain only their existing guide, no duplicate links. Pointed tests then full Jest baseline/lint/typecheck/format/build; local browser375/1440 two themes and four languages; independent strong review; exact CI/Production and live four-locale links/metadata. IndexNow only the four changed canonical gold-hub URLs, notification is not indexing proof.
