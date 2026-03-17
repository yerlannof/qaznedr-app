# Honest Cleanup: Remove Dead Code & Junk Files

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all dead code, junk files, and broken stubs to leave only functional, working code. Reduce codebase chaos so development can continue on a clean foundation.

**Architecture:** Delete-first approach — remove dead modules and their imports, then fix surviving files, then verify build. No new features, no refactoring of working code.

**Tech Stack:** Next.js 15, TypeScript, Supabase, Tailwind CSS

**Starting state:** 905 TS errors on committed code, 1 TS error with local changes applied. 89 uncommitted local changes that partially fix issues.

---

## Chunk 1: Delete Junk Files

### Task 1: Delete log files, backups, and build artifacts

**Files to delete:**

- `logs/mcp-puppeteer-2025-09-12.log.gz`
- `logs/mcp-puppeteer-2025-09-13.log.gz`
- `logs/mcp-puppeteer-2025-09-14.log.gz`
- `logs/mcp-puppeteer-2025-09-16.log.gz`
- `logs/mcp-puppeteer-2025-09-20.log`
- `logs/mcp-puppeteer-2025-09-24.log`
- `logs/mcp-puppeteer-2025-10-01.log`
- `logs/.db5f93422384aac84324693defe44678e21d5975-audit.json`
- `src/components/features/DepositMap.tsx.bak`
- `src/i18n.ts.bak`
- `src/lib/middleware/performance-monitoring.ts.bak`
- `src/lib/monitoring/sentry-service.ts.bak`
- `src/lib/sync/data-sync-service.ts.bak`
- `src/middleware.ts.bak`
- `build.log`
- `eslint-output.txt`
- `test-output.txt`
- `.DS_Store`

- [ ] **Step 1:** Delete all listed files

```bash
rm -f logs/mcp-puppeteer-*.log* logs/mcp-puppeteer-*.log.gz logs/.db5f93422384aac84324693defe44678e21d5975-audit.json
rm -f src/components/features/DepositMap.tsx.bak src/i18n.ts.bak src/lib/middleware/performance-monitoring.ts.bak src/lib/monitoring/sentry-service.ts.bak src/lib/sync/data-sync-service.ts.bak src/middleware.ts.bak
rm -f build.log eslint-output.txt test-output.txt .DS_Store
```

- [ ] **Step 2:** Add logs/ and \*.bak to .gitignore if not already there

Check `.gitignore` for these patterns. Add if missing:

```
logs/
*.bak
build.log
*.log
.DS_Store
```

- [ ] **Step 3:** Commit

```bash
git add -A logs/ *.bak build.log eslint-output.txt test-output.txt .DS_Store .gitignore
git commit -m "chore: delete junk files (logs, backups, build artifacts)"
```

---

### Task 2: Delete duplicate/obsolete markdown docs

**Files to delete (duplicates of DEPLOYMENT.md):**

- `DEPLOYMENT_GUIDE.md`
- `DEPLOY_INSTRUCTIONS.md`
- `VERCEL_DEPLOY.md`

**Files to delete (duplicates of MCP_COMPLETE_GUIDE.md):**

- `MCP_COMPLETE.md` (SECURITY: contains exposed Supabase keys!)
- `MCP_CONTEXT.md`
- `MCP_FINAL_STATUS.md`
- `MCP_SERVERS_INSTALLED.md`
- `MCP_SERVERS_SETUP.md`
- `MCP_SETUP_COMPLETE.md`
- `MCP_SETUP_GUIDE.md`
- `MCP_STATUS.md`

**Files to delete (session reports):**

- `IMPROVEMENTS_SUMMARY.md`
- `TEST_IMPROVEMENTS_REPORT.md`
- `SESSION_4_TESTING_REPORT.md`
- `PHASE_10_COMPLETION_REPORT.md`

- [ ] **Step 1:** Delete all listed markdown files

```bash
rm -f DEPLOYMENT_GUIDE.md DEPLOY_INSTRUCTIONS.md VERCEL_DEPLOY.md
rm -f MCP_COMPLETE.md MCP_CONTEXT.md MCP_FINAL_STATUS.md MCP_SERVERS_INSTALLED.md MCP_SERVERS_SETUP.md MCP_SETUP_COMPLETE.md MCP_SETUP_GUIDE.md MCP_STATUS.md
rm -f IMPROVEMENTS_SUMMARY.md TEST_IMPROVEMENTS_REPORT.md SESSION_4_TESTING_REPORT.md PHASE_10_COMPLETION_REPORT.md
```

- [ ] **Step 2:** Commit

```bash
git add -A *.md
git commit -m "chore: remove duplicate and obsolete documentation"
```

---

## Chunk 2: Remove Dead Code Modules

### Task 3: Delete dead library modules

These modules are never used or completely broken stubs.

**Files to delete:**

- `src/lib/search/elasticsearch-client.ts`
- `src/lib/search/elasticsearch-service.ts`
- `src/lib/search/elasticsearch-sync.ts`
- `src/lib/email/email-service.ts`
- `src/lib/notifications/websocket-service.ts`
- `src/lib/db/query-optimizer.ts`
- `src/lib/monitoring/security-monitor.ts`
- `src/lib/sync/data-sync-service.ts`
- `src/components/features/MessagingSystemMobile.tsx`

- [ ] **Step 1:** Delete all dead module files

```bash
rm -f src/lib/search/elasticsearch-client.ts src/lib/search/elasticsearch-service.ts src/lib/search/elasticsearch-sync.ts
rm -f src/lib/email/email-service.ts
rm -f src/lib/notifications/websocket-service.ts
rm -f src/lib/db/query-optimizer.ts
rm -f src/lib/monitoring/security-monitor.ts
rm -f src/lib/sync/data-sync-service.ts
rm -f src/components/features/MessagingSystemMobile.tsx
```

- [ ] **Step 2:** Remove empty directories if any become empty

```bash
rmdir src/lib/email/ 2>/dev/null || true
rmdir src/lib/notifications/ 2>/dev/null || true
rmdir src/lib/db/ 2>/dev/null || true
rmdir src/lib/sync/ 2>/dev/null || true
```

- [ ] **Step 3:** Commit

```bash
git add -A
git commit -m "chore: remove dead code modules (elasticsearch, email, websocket, etc.)"
```

---

### Task 4: Delete test/debug API routes

**Directories to delete entirely:**

- `src/app/api/test-sentry/`
- `src/app/api/test-websocket/`
- `src/app/api/test-observability/`
- `src/app/api/test-transactions/`
- `src/app/api/admin/sync/` (depends on deleted elasticsearch + sync modules)

- [ ] **Step 1:** Delete test API route directories

```bash
rm -rf src/app/api/test-sentry/ src/app/api/test-websocket/ src/app/api/test-observability/ src/app/api/test-transactions/
rm -rf src/app/api/admin/sync/
```

- [ ] **Step 2:** Commit

```bash
git add -A
git commit -m "chore: remove debug/test API routes"
```

---

## Chunk 3: Fix Imports in Surviving Files

### Task 5: Clean search API routes — remove Elasticsearch, keep Supabase-only

These 3 routes currently import elasticsearch then fall back to Supabase. Remove the ES import and ES code path, keep only the Supabase logic.

**Files to modify:**

- `src/app/api/search/advanced/route.ts`
- `src/app/api/search/autocomplete/route.ts`
- `src/app/api/search/similar/route.ts`

- [ ] **Step 1:** Read each file and identify ES import lines and ES code paths
- [ ] **Step 2:** Remove ES imports and the try/catch blocks that attempt ES first
- [ ] **Step 3:** Keep only the Supabase fallback logic as the primary path
- [ ] **Step 4:** Run `npx tsc --noEmit` to verify no type errors in these files
- [ ] **Step 5:** Commit

```bash
git add src/app/api/search/
git commit -m "refactor: simplify search routes to Supabase-only (remove Elasticsearch)"
```

---

### Task 6: Clean search-service.ts — remove ES and sync imports

**File:** `src/lib/search/search-service.ts`

- [ ] **Step 1:** Read the file
- [ ] **Step 2:** Remove imports of `elasticsearchService` and `dataSyncService`
- [ ] **Step 3:** Remove any code paths that call these services
- [ ] **Step 4:** Keep Supabase-based search logic
- [ ] **Step 5:** Run `npx tsc --noEmit` to verify
- [ ] **Step 6:** Commit

```bash
git add src/lib/search/search-service.ts
git commit -m "refactor: simplify search-service to Supabase-only"
```

---

### Task 7: Clean useNotifications hook — remove websocket dependency

**File:** `src/hooks/useNotifications.ts`

Currently imports `wsNotificationService`, `Notification`, `NotificationType` from websocket-service.

- [ ] **Step 1:** Read the file
- [ ] **Step 2:** Remove websocket imports
- [ ] **Step 3:** If the hook provides toast/notification display without websockets, keep that functionality. If the entire hook is websocket-dependent, either:
  - (a) Reduce it to a simple toast notification hook (no real-time)
  - (b) Or export a no-op if other components depend on it
- [ ] **Step 4:** Define `Notification` and `NotificationType` types locally if other code uses them
- [ ] **Step 5:** Run `npx tsc --noEmit` to verify
- [ ] **Step 6:** Commit

```bash
git add src/hooks/useNotifications.ts
git commit -m "refactor: simplify useNotifications (remove websocket dependency)"
```

---

### Task 8: Clean MessagingSystem.tsx — remove websocket import

**File:** `src/components/features/MessagingSystem.tsx`

- [ ] **Step 1:** Read the file
- [ ] **Step 2:** Remove `wsNotificationService` import
- [ ] **Step 3:** Remove any websocket connection/subscription code
- [ ] **Step 4:** The component is already stubbed (returns empty conversations). Keep it as a UI shell that shows "no conversations" state — it's used on the messages page
- [ ] **Step 5:** Run `npx tsc --noEmit` to verify
- [ ] **Step 6:** Commit

```bash
git add src/components/features/MessagingSystem.tsx
git commit -m "refactor: remove websocket from MessagingSystem"
```

---

## Chunk 4: Fix Remaining TypeScript & Lint Issues

### Task 9: Fix the resend module error

**File:** `src/lib/email/email-service.ts` — should already be deleted in Task 3.

- [ ] **Step 1:** Verify the file is deleted
- [ ] **Step 2:** Check if any other file imports `resend`. If yes, remove those imports too.
- [ ] **Step 3:** Run `npx tsc --noEmit 2>&1 | grep "error TS" | wc -l` — should be 0
- [ ] **Step 4:** If not 0, fix remaining errors one by one

---

### Task 10: Run ESLint autofix and Prettier

- [ ] **Step 1:** Run Prettier on entire src/

```bash
npx prettier --write "src/**/*.{ts,tsx}" --log-level warn
```

- [ ] **Step 2:** Run ESLint autofix

```bash
npx eslint src/ --fix --quiet 2>&1 | tail -20
```

- [ ] **Step 3:** Check remaining warnings

```bash
npx eslint src/ --quiet 2>&1 | grep -c "Warning"
```

- [ ] **Step 4:** Manually fix any remaining issues (unused variables → prefix with `_`)
- [ ] **Step 5:** Commit

```bash
git add -A
git commit -m "style: autofix ESLint and Prettier issues"
```

---

### Task 11: Remove unused npm packages

After dead code removal, these packages may no longer be needed. Verify and remove:

- [ ] **Step 1:** Check if `resend` is still imported anywhere. If not:

```bash
npm uninstall resend
```

- [ ] **Step 2:** Check if `@elastic/elasticsearch` is still imported anywhere. If not:

```bash
npm uninstall @elastic/elasticsearch
```

- [ ] **Step 3:** Check if `socket.io-client` is still imported anywhere. If not:

```bash
npm uninstall socket.io-client
```

- [ ] **Step 4:** Commit

```bash
git add package.json package-lock.json
git commit -m "chore: remove unused npm packages (resend, elasticsearch, socket.io)"
```

---

## Chunk 5: Config & Workflow Cleanup

### Task 12: Clean up GitHub workflows

**Keep:**

- `.github/workflows/ci.yml` — core CI
- `.github/workflows/deploy-cloudflare.yml` — active deployment
- `.github/workflows/maintenance.yml` — monitoring

**Delete (redundant/Docker-based):**

- `.github/workflows/cd.yml`
- `.github/workflows/ci-cd.yml`
- `.github/workflows/deploy.yml`

- [ ] **Step 1:** Read each workflow to confirm the keep/delete list
- [ ] **Step 2:** Delete redundant workflows
- [ ] **Step 3:** Commit

```bash
git add -A .github/
git commit -m "chore: consolidate GitHub workflows (remove redundant)"
```

---

### Task 13: Clean wrangler.toml placeholder values

**File:** `wrangler.toml`

Contains placeholder IDs like `your-kv-namespace-id`. Either:

- (a) Remove entire wrangler.toml if Cloudflare is not actively used
- (b) Or leave it with a comment that values need to be filled

- [ ] **Step 1:** Read wrangler.toml
- [ ] **Step 2:** Check if the project actively deploys to Cloudflare Workers (check deploy-cloudflare.yml)
- [ ] **Step 3:** If Cloudflare Pages only (not Workers), the wrangler.toml for Workers is unnecessary — can keep just for reference but add a note
- [ ] **Step 4:** Commit if changed

---

## Chunk 6: Build Verification & Final Commit

### Task 14: Full build verification

- [ ] **Step 1:** Run TypeScript check

```bash
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
```

Expected: 0 errors

- [ ] **Step 2:** Run full Next.js build

```bash
npm run build
```

Expected: Build succeeds (warnings OK, errors NOT OK)

- [ ] **Step 3:** Run tests

```bash
npm run test 2>&1 | tail -20
```

Expected: Tests pass (or known failures documented)

- [ ] **Step 4:** If any step fails, fix the issue and re-run

- [ ] **Step 5:** Final commit if any fixes were needed

```bash
git add -A
git commit -m "fix: resolve remaining build issues after cleanup"
```

---

## Summary

| What                | Action      | Files               |
| ------------------- | ----------- | ------------------- |
| Junk files          | DELETE      | ~18 files           |
| Duplicate docs      | DELETE      | ~16 markdown files  |
| Dead lib modules    | DELETE      | 9 files             |
| Test API routes     | DELETE      | 5 directories       |
| Search routes       | SIMPLIFY    | 3 files (remove ES) |
| search-service.ts   | SIMPLIFY    | 1 file              |
| useNotifications    | SIMPLIFY    | 1 file              |
| MessagingSystem     | SIMPLIFY    | 1 file              |
| ESLint/Prettier     | AUTOFIX     | all src/            |
| Unused npm packages | REMOVE      | ~3 packages         |
| GitHub workflows    | CONSOLIDATE | delete 3            |
| Build               | VERIFY      | full build          |

**Total: ~50+ files deleted, ~10 files simplified, full build verification**
