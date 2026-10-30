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

## Next build stages

1. Content model and database
2. Separate admin/newsroom application
3. Authentication and roles
4. Editorial workflow and moderation
5. Media storage
6. Public submissions
7. Advertising/promoted/sponsored content management
8. Production deployment


## Cloudflare production deployment

The production application runs as a Cloudflare Worker using OpenNext and the existing D1 database configured in `wrangler.jsonc`. The separate public content API is deployed from `d1-api/wrangler.jsonc`.

### One-time Cloudflare setup

1. In Cloudflare, open Workers & Pages and confirm the existing Worker named `campus-radar-v1` is the intended production application.
2. Confirm its D1 binding is named `campus_radar_db` and points to the existing database `campus-radar-db` (ID `b0602127-f6e1-4791-916b-dbd37017f389`). Do not create a replacement database.
3. Add Worker secrets to `campus-radar-v1`:
   - `AUTH_SECRET`: a random secret of at least 32 characters.
   - `CLOUDINARY_URL`: the existing Cloudinary connection URL. Keep it private.
4. In GitHub repository Settings → Secrets and variables → Actions, add:
   - `CLOUDFLARE_API_TOKEN`: a token permitted to deploy Workers and access the configured D1 database.
   - `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID.
5. If the public Campus Confidential link is configured as a build-time variable, add `NEXT_PUBLIC_CONFIDENTIAL_URL` under GitHub Settings → Secrets and variables → Actions → Variables.

### Deploy

After the two GitHub Actions secrets are configured, open Actions → Deploy Campus Radar to Cloudflare → Run workflow. The workflow deploys the public D1 content API first, then builds and deploys the Next.js application.

The workflow does not run migrations, reset the database, or import data. It uses the existing D1 database binding.

### Admin account

The admin login uses the existing `User` records in D1. No default admin password is created by deployment. Use an existing active Super Admin account. If no active Super Admin exists, provision one through a controlled one-time administrative process; do not publish credentials or add a hard-coded default account.

### Post-deployment checks

- Open the Worker URL and verify the homepage, News, Features, Opinion, The Radar and Opportunities.
- Open `/admin/login`, sign in with an existing active account, and confirm role-based access.
- Test creating a draft, submitting it for review, publishing, and verifying that it appears publicly.
- Test a Radar item, an opportunity, a public submission and a media upload.
- Confirm that an unauthorised session cannot access protected APIs.

The Campus Confidential application remains a separate Supabase-backed service and is not migrated or merged into this database.


### First Super Admin provisioning (only if needed)

The application does not create a default admin account. If the existing D1 database has no active `SUPER_ADMIN`, use the one-time bootstrap route:

1. Add a temporary Cloudflare Worker secret named `ADMIN_BOOTSTRAP_TOKEN` to `campus-radar-v1`. Use a random value of at least 32 characters.
2. Send a `POST` request to `/api/admin/bootstrap` with header `x-admin-bootstrap-token: <your-token>` and JSON body containing your chosen `name`, `email` and a strong `password` (at least 12 characters).
3. Sign in at `/admin/login` using those credentials.
4. Immediately delete `ADMIN_BOOTSTRAP_TOKEN` from the Worker secrets. The route returns 404 when that secret is absent and refuses to create an account if an active Super Admin already exists.

Never put the token or password in source control, a public issue, or a chat message. Do not use this route to create additional admins.
