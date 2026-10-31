# Campus Radar v1

Campus Radar is a student-focused media and information platform for the Federal University of Agriculture, Abeokuta (FUNAAB).

## Product structure

- Newsroom-led editorial content
- The Radar for campus updates, events, announcements and campus life
- Opportunities as a structured information type
- Podcast as a distribution hub linking to listening platforms
- Commercial content distinguished from editorial content
- Campus Confidential remains a separate application; set its real URL through `NEXT_PUBLIC_CONFIDENTIAL_URL`

## Local development

```bash
npm install
npm run dev
``

Copy `.env.example` to `.env.local` and set the server-only values before testing protected API routes. Never expose `SUPABASE_SECRET_KEY`, `AUTH_SECRET`, or `CLOUDINARY_URL` in browser code or commit their values.

## Backend and deployment

The application uses Supabase PostgreSQL for newsroom data and Cloudflare Workers (OpenNext) for hosting. The schema migrations are in `supabase/migrations`. Row-level security is enabled on the application tables; direct client table privileges are revoked. Application data access is server-side through the Supabase secret key.

Public Supabase URL and publishable key are configured in `wrangler.jsonc`. The Cloudflare deployment workflow expects these GitHub Actions secrets in the `production` environment:

- `CLOUDFLARE_API_TOKEN` (Workers Scripts:Edit and D1:Edit permissions on the Campus Radar account)
- `CLOUDFLARE_ACCOUNT_ID`
- `SUPABASE_SECRET_KEY`
- `AUTH_SECRET` (at least 32 random characters)

First run the **Migrate legacy D1 content to Supabase** workflow. It reads the old D1 database without modifying it and imports the existing newsroom records into Supabase using stable IDs, so a retry does not create duplicate rows. Verify the imported counts before proceeding. Then run the **Deploy Campus Radar** workflow. It installs dependencies, writes the Supabase server secret to the Worker, generates a stable `AUTH_SECRET` on first deployment if needed, then builds and deploys the OpenNext application.

## Initial newsroom administrator

After the Worker secrets are configured, run `scripts/bootstrap-admin.mjs` once in a trusted environment with `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` set. Use a unique password of at least 12 characters. The script hashes the password and creates or updates the Super Admin record; it does not store credentials in the repository.

## Data migration status

The Supabase schema is applied. The application API migration is in progress. Existing records in the former Cloudflare D1 database have **not** yet been imported. The manual migration workflow is provided; do not delete or reset the D1 database until its import and record counts have been verified.

## Verification

A GitHub Actions build workflow runs on pull requests and migration-branch pushes. Production deployment and live newsroom testing remain pending until the required account secrets are available and the D1 content migration is verified.
