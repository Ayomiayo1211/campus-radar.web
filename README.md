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

Copy `.env.example` to `.env.local` and set the server-only values before testing protected API routes. Never expose `SUPABASE_SECRET_KEY` or `AUTH_SECRET` in browser code or commit their values.

## Backend and deployment

The application uses Supabase PostgreSQL for newsroom data and Cloudflare Workers (OpenNext) for hosting. The schema migrations are in `supabase/migrations`. Row-level security is enabled on the application tables; direct client table privileges are revoked. Application data access is server-side through the Supabase secret key.

Public Supabase URL and publishable key are configured in `wrangler.jsonc`. The Cloudflare deployment workflow expects these GitHub Actions secrets in the `production` environment:

- `CLOUDFLARE_API_TOKEN` (Workers Scripts:Edit and D1:Edit permissions on the Campus Radar account)
- `CLOUDFLARE_ACCOUNT_ID`
- `SUPABASE_SECRET_KEY`

After the migration code is merged, the **Migrate legacy D1 content to Supabase** workflow runs automatically. It reads the old D1 database without modifying it, imports newsroom records using stable IDs, copies supported Cloudinary images into Supabase Storage, and verifies every imported row. A successful verified migration triggers **Deploy Campus Radar** automatically. The deployment installs locked dependencies, writes the Supabase server secret to the Worker, generates a stable `AUTH_SECRET` on first deployment if needed, then builds and deploys the OpenNext application. Both workflows can also be run manually.

## Initial newsroom administrator

Add the GitHub Actions secrets `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. After a successful deployment, the **Bootstrap Campus Radar Super Admin** workflow runs automatically; it can also be run manually. Use a unique password of at least 12 characters. The workflow hashes the password and creates or updates the Super Admin record without exposing credentials in source control.

## Cutover sequence

After merge to `master`, the legacy D1 import runs automatically. It imports newsroom records with stable IDs, transfers supported Cloudinary images into Supabase Storage, verifies every imported row, and leaves the source D1 database unchanged. A successful import triggers the Cloudflare deployment; a successful deployment triggers initial Super Admin provisioning when the administrator secrets are configured.

Do not delete or reset the legacy D1 database until the migration and image availability have been checked in GitHub Actions. The workflows can also be run manually from the Actions tab.

## Verification

A GitHub Actions build workflow runs on pull requests and pushes to `master`. Production deployment and live newsroom testing remain pending until the required account secrets are configured, the D1 content migration is verified, and the initial Super Admin is provisioned.
