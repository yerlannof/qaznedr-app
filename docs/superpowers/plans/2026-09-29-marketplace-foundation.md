# Closed marketplace foundation — implementation plan

**Scope:** internal, equipment-only foundation for the proposal in
`docs/superpowers/specs/2026-09-29-geology-portal-marketplace-proposal.md`.
It does not reopen routes, add public navigation/indexing, publish inventory,
or change `leads` / `lead_private`.

## Code facts established by the audit

- The legacy route is hidden by `HIDDEN_ROUTE_REDIRECTS` in
  `src/lib/seo/pages.ts`; `src/middleware.ts` returns 308 redirects. Preserve
  every entry during all phases below.
- Account creation in `src/app/api/auth/register/route.ts` writes Prisma's
  `User`, while active NextAuth (`src/app/api/auth/[...nextauth]/route.ts`)
  uses `src/lib/services/auth.config.ts`, whose credentials provider reads the
  Supabase `users` table. This leaves two identity sources; a complete registration-to-login integration test must establish and then remove the inconsistency.
- Legacy listing reads/creates use `kazakhstan_deposits` via Supabase, while
  `src/app/api/listings/[id]/route.ts` edits/deletes via Prisma. The current
  create handler expects a Supabase Auth user, although the wizard uses
  NextAuth. `api/my-listings` uses an anon client and therefore cannot rely on
  RLS to expose a NextAuth owner's private rows.
- `kazakhstan_deposits` is a geological-deposit schema. Its `coordinates`,
  mineral and licence fields make it unsuitable for equipment offers. It is
  separate from, and must remain separate from, the curated geobase.
- `profiles.role` already supports `user`, `admin`, and `super_admin`; the
  existing `requireAdmin()` resolves that role server-side through a
  service-role client. It is a reusable authorization seam.
- Legacy moderation promotes an approved seller to `is_trusted_seller` and
  permits that seller's later create directly to `ACTIVE`. The foundation must
  not copy either behavior. `src/lib/supabase/storage.ts` also uploads straight
  from the browser and returns public URLs without server-side file inspection.

## Decisions for this foundation

1. Use the existing NextAuth session as the application session and Supabase
   Postgres as the only persistence system. Create and authenticate catalogue
   users against one Supabase-backed identity record used by that provider;
   remove marketplace dependence on Prisma rather than extending any Prisma
   schema. The precise OTP identity provider remains undecided, so this phase
   supplies the server boundary and no SMS/OTP delivery claim.
2. Add a new equipment-only table, for example `equipment_listings`, plus
   `equipment_listing_images` and a moderation-event table. Do not alter or
   reuse `kazakhstan_deposits`, `leads`, `lead_private`, or their data paths.
3. Keep statuses minimal: `DRAFT`, `PENDING_MODERATION`, `ACTIVE`,
   `REJECTED`, `ARCHIVED`. An owner can create/save a draft, submit it, edit a
   draft/rejected item, or archive any owned item. A material edit of ACTIVE
   clones/retains the submitted changes as `PENDING_MODERATION` and removes
   the changed public version until approval; the moderator alone transitions
   a pending item to `ACTIVE` or `REJECTED`. Define the material-field list in
   the server validator (title, offer type/category, location, terms/price,
   availability, description, images and public contact), not in the client.

## Data and authorization migration

1. Add a forward-only migration under `supabase/migrations/` for the new
   tables, constraints, timestamps and indexes. Proposed required columns:
   owner ID, status, offer type (`RENT` / `SALE` / `SERVICE`), equipment
   category, title, description, region, city, price/currency/price-unit or
   price-on-request, availability text/date, public contact choice, source
   language, submitted/approved/archived timestamps, and `updated_at`.
   Store category-specific characteristics in a constrained JSONB field only
   after a category-specific server schema validates it; do not manufacture
   mining/coordinates fields. Images get a separate row with owner/listing ID,
   storage path, display order and safe metadata; documents are out of this
   first scope.
2. Apply RLS with no browser write path for catalogue rows: anon has no access
   to drafts/pending/rejected or files; public read is `ACTIVE` equipment
   listings only. The application API performs owner and moderator operations
   with `createServiceClient()` after checking the NextAuth session. Service
   role remains server-only. Do not use `auth.uid()` as the owner proof because
   the session is NextAuth, not a Supabase Auth session.
3. Add generated types in `src/lib/supabase/database.types.ts` after applying
   the migration, then typed repository/server helpers under
   `src/lib/equipment-listings/` (identity/session, queries, validation,
   moderation). They must obtain `session.user.id` server-side, fetch the row
   by ID and owner before each mutation, and use `requireAdmin()` for review.
   The request body never sets owner, status, moderation actor, or public
   contact visibility outside allowed fields.

## Implementation phases

### 1. Reconcile identity, privately

- Gate every new catalogue API and UI entry behind a server-only feature flag defaulting to disabled. The same closed-launch restriction must cover the existing `/api/auth/register` route that this plan changes; preserve sign-in for existing users. A hidden navigation link or 308 page redirect alone does not close an API. Keep disabled in production until the limited launch; the flag must not be caller-controlled. Registration integration is tested in the isolated test environment before modifying existing live login behavior.

- Replace the Prisma transaction in `src/app/api/auth/register/route.ts` with
  the selected Supabase-backed identity provisioner and atomic profile upsert.
  Align it with the credentials path in `src/lib/services/auth.config.ts` and
  retain the existing env-admin route in `src/lib/auth/env-admin.ts`.
- Centralize session extraction in `src/lib/auth/` and make profile setup,
  catalogue repositories and admin checks use that same provider config.
  Remove the unused/conflicting `src/lib/auth/index.ts` configuration only
  after all imports are migrated and its callers are proven absent.
- Do not implement phone OTP until the owner selects provider, supported
  countries, cost/rate limits and fallback. Keep registration fields and
  adapters provider-neutral so a verified-phone state can be added later.

**Acceptance:** a newly registered test user can authenticate through the
actual NextAuth route and has exactly one matching Supabase user/profile ID;
duplicates fail without partial profile creation; an unauthenticated request
cannot create or read a private item.

### 2. Build the closed equipment API

- Add private endpoints under `src/app/api/equipment-listings/` for owner list,
  draft creation, detail, update, submit and archive; add a separate
  `src/app/api/admin/equipment-listings/` queue/detail/moderation endpoint.
  Do not repurpose `/api/listings`, `/api/my-listings`, or their deposit
  transforms.
- Add explicit Zod schemas in `src/lib/validations/` for each owner action and
  for moderation action/rejection reason. Map them to the database model in
  server code; reject unknown fields and invalid status transitions.
- A material owner edit of an ACTIVE listing moves it to `PENDING_MODERATION` and hides the changed public version. Autosave in DRAFT stays DRAFT; edits in REJECTED stay non-public until explicit resubmission. Pending edits must invalidate any in-flight approval through a revision check. Approval is an intentional moderator action;
  rejection records an internal reason and keeps the item non-public. No
  trusted-seller shortcut, auto-approval, or client role/status override.
- Adapt the retained private pages only after API tests pass, likely
  `src/app/[locale]/listings/create/page.tsx`,
  `src/app/[locale]/dashboard/my-listings/page.tsx` and
  `src/app/[locale]/listings/[id]/edit/page.tsx`. Keep them unavailable through
  the existing redirect until design, copy and limited-launch approval.

**Acceptance:** test the complete server flow: authenticated owner saves draft
→ submits → moderator rejects/approves → public repository sees only approved
item → owner material edit hides it and returns it to queue → moderator
approves → owner archives. A second user receives 403/404 for each owner-only
detail/update/archive attempt; user roles cannot moderate; admin may moderate.

### 3. Safe image intake, still closed

- Create a server-authorized upload initiation/finalization path under
  `src/app/api/equipment-listings/[id]/images/`. Require the session owner (or
  an admin), ownership of the draft/pending item, per-listing count/size
  limits, allowlisted image MIME types and extensions, server-generated object
  names scoped to listing/owner, and no caller-selected bucket/path.
- Use a dedicated private storage bucket/prefix. Verify the upload result on
  the server before inserting an image row; strip or reject unsafe metadata as
  supported by the chosen processing path, never trust browser MIME/type or a
  supplied public URL. Serve public image URLs only for ACTIVE listings through
  a controlled public derivative or short-lived signed URL. Delete/reconcile
  orphaned uploads on failed finalization and archive policy later.
- Do not reuse `StorageService.upload()` for catalogue uploads until its direct
  public-client behavior is replaced or constrained by the above API.

**Acceptance:** non-owner uploads, path traversal/object-name injection,
unsupported MIME/extension, oversize/count excess and references to another
owner's object fail; an unapproved listing's image cannot be fetched through
the public listing path; an approved listing returns only its ordered images.

### 4. Validate closed readiness and defer launch work

- Add focused Jest suites mirroring the changed code in
  `src/__tests__/api/` and `src/lib/equipment-listings/__tests__/`: identity
  reconciliation, status transitions, owner/admin authorization, public query
  isolation and upload authorization. Mock service clients and session/admin
  seams; include the legacy baseline failures only as known baseline, never as
  evidence of completion.
- Run focused suites with `--coverage=false`, then full Jest, ESLint on changed
  files and `npm run build`. Review the migration with an empty local/test
  database; do not inspect production rows or credentials.
- Only after owner-approved design, content, moderation operator, contact
  policy, provider decision and non-empty approved inventory: separately plan
  removal of selected `HIDDEN_ROUTE_REDIRECTS`, public pages/metadata/sitemap,
  four-language UI, search indexing and browser checks. This plan does none of
  those changes.

## Dependencies and owner decisions

- Required before public phone registration: OTP provider, supported countries, fallback, delivery budget and abuse limits. Internal schema, authorization and session-adapter work can proceed with synthetic test identities without choosing or paying a provider; do not introduce a public password-only flow by default.
- Required before public launch: approved equipment taxonomy/required fields,
  business terms and public-contact policy, named moderation operator and
  review standard, upload retention/deletion policy, approved four-language
  text and design review.
- Existing facts do not establish the live Supabase `users` table shape,
  storage bucket configuration or OTP provider capability. Verify those through
  migration/configuration review in implementation, without reading secrets or
  production data.

## Public data boundary

Public reads use an explicit allowlisted projection/view: approved listing content and only contacts deliberately selected for publication. Never return owner-private phone/email, moderation notes, account data or private attachment paths. An ACTIVE-only RLS policy restricts rows, not columns; deny direct anonymous SELECT on the base table where those private columns live. Test public API/view and direct anonymous database reads separately.
