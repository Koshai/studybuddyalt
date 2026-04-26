# Project Improvements and Future Notes

Last updated: 2026-04-22

This note captures improvements identified across the current codebase and what should be planned next.

## 1) Immediate Fixes (Do First)

- [ ] Remove duplicate route definition for `/api/auth/resend-confirmation` in `src/server/routes/auth-routes.js`.
- [ ] Fix local dev API port mismatch: frontend points to `http://localhost:3001/api` in `src/frontend/js/api-simplified.js`, while server defaults to `3000` in `src/server/server.js`.
- [ ] Update stale startup scripts in `package.json` (`launch` and `desktop`) that reference `launch-studybuddy.js` if this file is not intended to exist.
- [ ] Remove token-related verbose logs from auth/API/middleware paths to avoid sensitive information in logs.
- [ ] Audit and lock down debug/test endpoints so they are disabled or admin-protected in production.
- [ ] Refresh `README.md` to match actual architecture, ports, and project structure (current docs describe old/incorrect layout).

## 2) Stability and Reliability

- [ ] Add centralized error format helper so all API responses are consistent (error code, message, context id).
- [ ] Add request correlation IDs and structured logging for production troubleshooting.
- [ ] Add startup health checks for critical integrations (Supabase, OpenAI, storage service, config load).
- [ ] Add graceful shutdown handling in server startup path (close DB connections, flush logs).
- [ ] Reduce broad `try/catch` fallbacks that silently allow operations after errors (some limit checks currently do this).
- [ ] Add retry + circuit-breaker style handling for external AI provider calls.

## 3) Security Hardening

- [ ] Review all auth-related routes for least-privilege access and production gating.
- [ ] Audit CORS policy to support environment-driven allowed origins instead of hardcoded host list.
- [ ] Add stricter input validation coverage for all write endpoints using existing validation middleware pattern.
- [ ] Enforce rate limits per route class (auth, generation, upload, admin) with stricter thresholds for expensive endpoints.
- [ ] Add secret/config validation at boot (required env vars, invalid combinations).
- [ ] Add security-focused tests for auth middleware and admin endpoints.

## 4) Architecture Cleanup (Reduce Drift)

- [ ] Pick and document one canonical runtime architecture for web mode and one for desktop mode.
- [ ] Identify and deprecate legacy/backup modules (for example `*-backup.js`, older hybrid selector paths) to reduce confusion.
- [ ] Standardize naming conventions (`StudyBuddy` vs `Jaquizy` vs legacy names) across UI, config, package metadata, and logs.
- [ ] Split very large service files (especially storage and API client) into smaller domain modules.
- [ ] Introduce clear interfaces/contracts for storage and AI providers to avoid behavior drift between Supabase and SQLite paths.
- [ ] Add an ADR (architecture decision record) directory for major technical decisions.

## 5) Data Layer and Migrations

- [ ] Move schema and migration management to a repeatable migration tool/process rather than ad-hoc SQL scripts.
- [ ] Consolidate SQL setup/update files into versioned migration sequence with rollback notes.
- [ ] Add data integrity checks and periodic validation scripts (foreign keys, orphan records, duplicate user data).
- [ ] Add backup and restore runbook for both Supabase and SQLite local mode.
- [ ] Define one source of truth for tier/usage limits (config + backend + frontend currently risk drift).

## 6) Testing Strategy (High Priority)

- [ ] Create baseline automated test suite (currently no standard `tests/**/*.test.js` coverage in practice).
- [ ] Add API integration tests for auth, topic/note CRUD, upload processing, and practice session flow.
- [ ] Add contract tests for service factory mode switching (web vs desktop paths).
- [ ] Add frontend smoke tests for auth boot, dashboard load, navigation state transitions.
- [ ] Add regression tests for token refresh behavior in `api-simplified.js`.
- [ ] Add CI test gate with coverage threshold.

## 7) Performance and Scalability

- [ ] Optimize N+1-style route logic where per-topic loops perform repeated storage calls.
- [ ] Add pagination and filtering on list endpoints (topics, notes, flashcards, feedback, admin listings).
- [ ] Add caching strategy for static config and frequently requested aggregate stats.
- [ ] Add asynchronous job queue for expensive tasks (OCR, PDF extraction, AI generation bursts).
- [ ] Profile and optimize frontend initial load (many script tags + global registration can be heavy).

## 8) Developer Experience

- [ ] Add consistent formatter/linter setup and scripts (`lint`, `format`, `test`, `typecheck` if TS introduced).
- [ ] Add pre-commit hooks for lint/test sanity checks.
- [ ] Add `CONTRIBUTING.md` with local setup, architecture map, and branch conventions.
- [ ] Add environment templates and onboarding docs (`.env.example`) covering web + desktop modes.
- [ ] Add route/service ownership map to reduce onboarding time.

## 9) Product and UX Improvements (Near-Term)

- [ ] Implement global search across notes/questions/topics.
- [ ] Add bulk operations (delete/move/tag) for notes, questions, flashcards.
- [ ] Improve mobile responsiveness and interaction polish for primary study flows.
- [ ] Improve empty-state and error-state consistency across major screens.
- [ ] Add richer progress analytics (streak quality, mastery by topic, weak-area recommendations).
- [ ] Add safer confirmation UX for destructive actions (already partially available via modal components).

## 10) Monetization and Business Readiness

- [ ] Complete Stripe billing path end-to-end: checkout, webhooks, subscription state sync, billing portal.
- [ ] Connect subscription tier reliably to usage enforcement and UI gating.
- [ ] Replace placeholder ad configuration IDs with production-safe ad integration flow.
- [ ] Add billing and usage audit logs for support and reconciliation.
- [ ] Add abuse prevention for high-cost generation endpoints (quotas, cooldown, anti-automation signals).

## 11) AI Quality Roadmap

- [ ] Add deterministic validation pipeline for generated questions before saving.
- [ ] Add provider fallback policy with quality thresholds and timeout handling.
- [ ] Add prompt/version tracking to measure generation quality over time.
- [ ] Add offline model capability matrix and UX guidance for hardware constraints.
- [ ] Add user feedback loop to improve generation quality (thumbs up/down to retraining heuristics).

## 12) Suggested Execution Plan

### Phase A (1-2 weeks): Foundation
- Fix route/script/port inconsistencies.
- Lock down production debug surface.
- Refresh docs and environment setup instructions.
- Add baseline tests for critical auth + core CRUD.

### Phase B (2-4 weeks): Reliability + Security
- Centralize error handling/logging.
- Harden validation/rate limiting and environment checks.
- Add CI gates and migration discipline.

### Phase C (4-8 weeks): Product Strengthening
- Search + bulk actions + mobile improvements.
- Monetization completion (Stripe + usage gating).
- Performance optimization and async processing.

### Phase D (ongoing): Platform Maturity
- AI quality tuning with telemetry.
- Architecture simplification and module ownership.
- Advanced analytics and roadmap features.

## 13) Future Feature Candidates (After Core Stability)

- Study planner and spaced-repetition scheduling engine.
- Better collaboration flows (shared sets/groups).
- Import/export connectors (Notion, OneNote, Drive).
- Stronger offline sync conflict resolution.
- Public API access for premium plans.

## 14) Working Backlog Template

Use this for incoming ideas (including your suggestions):

- Title:
- Problem:
- Proposed improvement:
- Impact (User/Business/Tech):
- Priority (P0/P1/P2):
- Effort (S/M/L):
- Dependencies:
- Owner:
- Target phase:

