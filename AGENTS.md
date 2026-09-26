# AGENTS.md

Instructions for AI agents other than Claude Code (e.g. Codex) working in this repository.

## Role split

- **Codex = design.** Brand identity, logos, mockups, HTML prototypes.
- **Claude Code = code.** Everything in `src/`, database, SEO, i18n, deploys.
- **The owner approves every design result** before it is implemented.

## Rules for Codex

1. Read `docs/design/BRIEF.md` first, then the task file you were given in `docs/design/tasks/`.
2. **Write only inside `docs/design/`.** Do not modify `src/`, config files, `package.json`, migrations, or anything else outside `docs/design/`.
3. Do not run `git commit` / `git push`, do not install npm packages, do not deploy.
4. Present options for approval as a self-contained page `docs/design/review/NN-*.html` plus images in `docs/design/mockups/NN/`. Stop and wait for the owner's choice before producing finals.
5. Record what the owner approved in `docs/design/APPROVED.md`.
6. Design constraints: Lucide icons only, no emoji in UI, no glassmorphism, no gradient backgrounds, no flashy animations, mobile-first (375px), light and dark theme, WCAG AA contrast, Chinese text uses system CJK fonts or a self-hosted subset.

Product context: `docs/superpowers/specs/2026-09-26-qaznedr-holding-pivot-design.md`.
