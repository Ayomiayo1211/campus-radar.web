# Campus Radar v1

Campus Radar is a student-focused media and information platform for the Federal University of Agriculture, Abeokuta (FUNAAB).

## Current direction

- Newsroom-led editorial content
- The Radar as the campus pulse for events, updates, announcements and useful information
- Opportunities as a structured information type
- Campus Confidential as a separate anonymous reporting application
- Podcast as a distribution hub linking to listening platforms
- Commercial content distinguished from editorial content
- No public admin login or admin navigation

## Run locally

```bash
npm install
npm run dev
```

## Confidential integration

Set `NEXT_PUBLIC_CONFIDENTIAL_URL` to the real Campus Confidential application URL before launch. Do not hard-code or invent the destination.

## Supabase migration status

The initial PostgreSQL schema is in `supabase/migrations`. The API migration is in progress. Configure `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `AUTH_SECRET` in the deployment environment before using the migrated API routes. The secret key is server-only and must never be exposed to browser code. The current custom newsroom session remains in place while user records move to the `public.users` table.

## Next build stages

1. Content model and database
2. Separate admin/newsroom application
3. Authentication and roles
4. Editorial workflow and moderation
5. Media storage
6. Public submissions
7. Advertising/promoted/sponsored content management
8. Production deployment
