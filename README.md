Templink — Monorepo

Packages
- backend: Express + Prisma API
- frontend: Vite + React app
- shared: Type and config shared across packages

Backend
- Env (backend/.env)
  - DATABASE_URL: Postgres connection string
  - PORT: API port (default 3000)
  - STORAGE_LOCAL_DIR: Base dir for stored files (e.g., ../uploads)
  - PUBLIC_BASE_URL: Optional, used to build absolute links
  - CORS_ORIGINS: Comma‑separated list of allowed origins
  - MAX_FILE_SIZE_MB, DEFAULT_EXPIRY_HOURS, DEFAULT_MAX_DOWNLOADS, MAX_DOWNLOADS_CAP
  - CLEANUP_*: Interval/batch/purge policy for the cleanup job

- Run
  - Dev: pnpm dev:be
  - Build: pnpm --filter backend build
  - Start: pnpm --filter backend start

- Scripts (backend/package.json)
  - typecheck: tsc -p tsconfig.json --noEmit
  - prisma:generate: prisma generate
  - migrate:dev: prisma migrate dev
  - migrate:deploy: prisma migrate deploy
  - studio: prisma studio

- Endpoints
  - GET /healthz → 200 OK
  - GET /readyz → 200 when DB ready; 503 during shutdown
  - POST /api/upload (form‑data: file, expiresAt?, maxDownloads?) → { data }
  - GET /api/file/:token/info → { data } | 404 { error } | 410 { error (DELETED|EXPIRED) }
  - GET /api/file/:token/download → stream | 404 { error } | 410 { error (DELETED|EXPIRED|LIMIT_REACHED) }

- Response envelopes
  - Success: { data }
  - Error: { error: { code, message } }

- Rate limits
  - /api: 100/15m, /api/upload: 10/15m, /api/file/:token/download: 60/15m

- Cleanup job
  - Runs periodically to delete expired/exhausted blobs and mark/purge records
  - Controlled by CLEANUP_INTERVAL_MS, CLEANUP_BATCH_SIZE, CLEANUP_SOFT_DELETE_ONLY, CLEANUP_PURGE_AFTER_HOURS

Frontend
- Dev: pnpm dev:fe
- Configure VITE_API_URL to point at backend

Monorepo commands
- Dev both: pnpm dev
- Build all: pnpm -r build
- Lint/typecheck (once added): pnpm -r lint, pnpm -r typecheck
