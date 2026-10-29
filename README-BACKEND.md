# Campus Radar v1 Backend

The backend is built into the Next.js application using Route Handlers and Prisma.

## Current API

- `GET /api/health`
- `GET /api/stories`
- `POST /api/stories`
- `GET /api/radar`
- `POST /api/radar`
- `GET /api/opportunities`
- `POST /api/opportunities`
- `POST /api/submissions`

## Local setup

1. Copy `.env.example` to `.env`.
2. Run `npm install`.
3. Run `npm run db:generate`.
4. Run `npm run db:migrate -- --name init`.
5. Run `npm run dev`.

The current local database uses SQLite so the backend can be developed without external infrastructure. The schema is intentionally structured so the database can later move to PostgreSQL/Supabase.

Authentication and protected newsroom endpoints are the next backend milestone. Public POST endpoints should not be treated as production-secure until rate limiting, authentication/authorization where appropriate, and abuse protection are added.
