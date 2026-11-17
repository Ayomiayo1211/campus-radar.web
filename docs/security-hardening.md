# Campus Radar security hardening

## Security boundaries

- `/admin/login` is intentionally public. Knowing the URL must never grant access to newsroom data or actions.
- `AdminSessionGuard` is a navigation guard only. Every protected API route and every server-rendered admin page must enforce authorization independently.
- The newsroom session is an HTTP-only, same-site cookie signed with `AUTH_SECRET`. The server rechecks the user's active status, current role, session version, and maximum session age.
- The Supabase secret key is server-only. Never place it in a `NEXT_PUBLIC_*` variable, client component, source-controlled configuration, or browser response.
- Public database roles must not receive direct grants to newsroom tables. Keep RLS enabled and use the server-side service role only behind authenticated server routes.

## Implemented application controls

- Atomic database-backed IP and account rate limits for login and password recovery.
- Rate limits for public applications, newsletter operations, submissions, comments, reports, Spotlight submissions/uploads, article-read tracking, invitation acceptance, and newsroom media uploads.
- Twelve-hour maximum newsroom sessions and session-version revocation after password reset.
- Generic login and password-recovery responses; internal diagnostics stay in server logs.
- File-signature verification for uploaded images.
- Baseline HTTP security headers.

## Supabase migration and deployment order

1. Review and merge the security pull request.
2. Apply `supabase/migrations/20261117165257_add_api_rate_limits_and_session_revocation.sql` to the production Supabase project.
3. Confirm the `api_rate_limits` table and `consume_api_rate_limit` function exist, and that the function is executable only by `service_role`.
4. Deploy the application code.
5. Test login, password recovery, session invalidation, invitation acceptance, public forms, comments, and both upload flows.

Do not deploy application code that calls `consume_api_rate_limit` or selects `users.session_version` before the migration has been applied.

## Cloudflare dashboard checklist

These settings are account-level controls and are not provisioned by the repository:

- Enable the managed WAF ruleset for the production zone.
- Enable bot protection appropriate for the plan and monitor false positives.
- Add rate-limit rules for `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, and public form/upload endpoints. Use the application limits as a second layer.
- Challenge or block repeated suspicious requests to `/api/*`; do not block legitimate public reads or the public login/recovery pages.
- Ensure the origin is not publicly reachable around Cloudflare. Route the domain through the Worker and avoid exposing an alternate origin hostname.
- Review Security Events after rollout and tune rules based on actual traffic.

## Controlled verification checklist

- Unauthenticated requests to every protected API return 401 or 403 and never return private newsroom data.
- A reporter cannot call editor-only or Super Admin endpoints.
- Repeated login attempts receive 429 responses; valid login works again after the window expires.
- Forgot-password responses do not reveal whether an email is registered.
- A successful password reset invalidates existing sessions for that account.
- Expired, used, or malformed reset and invitation tokens are rejected.
- Upload endpoints reject mismatched MIME types/file signatures and files over their size limits.
- Public application, comment, newsletter, submission, and Spotlight endpoints enforce rate limits.
- No response includes SQL errors, stack traces, secrets, password hashes, reset tokens, or internal database details.

## Incident response

If a newsroom account is suspected compromised, deactivate the account or reset its password. Password reset increments the account's session version and invalidates all existing sessions. If `AUTH_SECRET` is suspected compromised, rotate it in Cloudflare and redeploy; this invalidates all signed newsroom sessions. Rotate the Supabase secret key separately if it may have been exposed.
