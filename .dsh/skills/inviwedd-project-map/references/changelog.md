# Changelog

Newest first. One entry per update: date · what changed · why · files involved · git commit.

## 2026-11-14 · v1.0.0 · initial skill creation
- Created `inviwedd-project-map` on the owner's request, because context is lost between sessions and the repository had no durable project map.
- Recorded: architecture and repo layout, all 37 `route.ts` files / 47 handlers with their auth layer, the 5 committed migrations and the tables they create (plus the three tables used by code but absent from migrations), the 20 environment variable names and where each is read, the product/technical decisions with reasons, and the open blockers found in a read-only review.
- Verified from a read-only pass at git `868ac95`; `tsc --noEmit` and `eslint .` both pass. No source file modified, no `.env*` read, no migration executed.
- Files: `.dsh/skills/inviwedd-project-map/SKILL.md`, `references/{api-routes,db-schema,env-and-deploy,decisions,open-items,changelog}.md`.
