# Architecture Deprecation Map

Last updated: 2026-04-23

This document distinguishes actively used runtime modules from legacy candidates, so cleanup can happen safely.

## Active Runtime Path (Current)

### Core Runtime
- `src/server/server.js` - server startup
- `src/server/app.js` - middleware, API routes, static frontend serving
- `src/server/services/service-factory.js` - environment-aware service wiring
- `src/server/services/environment-service.js` - environment mode selection

### Active AI Services
- `src/server/services/openai-service.js` - primary AI service in web mode
- `src/server/services/ollama-simplified.js` - primary desktop AI + web fallback
- `src/server/services/prompt-generation.js` - subject-specific prompt logic
- `src/server/services/question-validation.js` - output validation and stem rewriting
- `src/server/services/response-parsing.js` - AI response parser
- `src/server/services/generation-strategies.js` - retry/fallback generation strategies

### Active Storage Services
- `src/server/services/web-storage-service.js` - web storage service (Supabase)
- `src/server/services/database-simplified.js` - desktop storage service (SQLite)
- `src/server/services/*-db-service.js` - domain DB services used by `database-simplified`

### Active Middleware
- `src/server/middleware/auth-middleware.js`
- `src/server/middleware/security-middleware.js`
- `src/server/middleware/rate-limit-middleware.js`
- `src/server/middleware/validation-middleware.js`
- `src/server/middleware/request-context-middleware.js`
- `src/server/middleware/api-response-middleware.js`

## Legacy / Drift Candidates (Not in Active Wiring)

These files are present but not part of the current service-factory path:

- `src/server/services/ai-service-selector.js`
- `src/server/services/hybrid-storage-service.js`
- `src/server/services/usage-service-hybrid.js`
- `src/server/services/database-simplified-backup.js`

They appear to reflect a previous hybrid architecture variant and are currently not referenced by routes/app bootstrap.

## Why This Matters

Recent drift showed status checks in `service-factory` still assuming hybrid-only methods (`getServiceStatus`, `getConnectionStatus`) that active services do not implement.

This has now been corrected in:
- `src/server/services/service-factory.js`

## Safe Cleanup Plan

### Phase 1 - Mark and isolate
- Add `@deprecated` file header comments to all legacy candidates.
- Add a lint/codeowners note to avoid new imports from legacy files.

### Phase 2 - Verify no runtime dependency
- Search for imports across repo before each removal.
- Add CI check that fails on new references to deprecated files.
- Use `npm run check:legacy-imports` (script: `scripts/check-no-legacy-imports.js`).

### Phase 3 - Remove deprecated modules
- Remove files one by one in small PRs.
- Keep one release rollback note with commit references.

## Naming Consistency Cleanup

Current project naming appears mixed across files (`StudyBuddy`, `Jaquizy`, legacy names). Recommended:
- Choose one product name for runtime logs and API messages.
- Keep migration aliasing in docs only (not runtime strings).

