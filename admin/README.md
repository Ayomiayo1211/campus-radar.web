# Campus Radar Admin

The public site must not expose an admin login. The production admin should be a separate application/deployment (for example, `admin.campusradar...`) protected by authentication and role-based authorization.

Recommended roles:
- Super Admin
- Editor
- Reporter/Writer
- Commercial/Ads

Do not put admin credentials, service-role keys, or Confidential secrets in the public application.

The v1 repository intentionally leaves the admin application as a separate surface so it can be implemented with the final authentication/database decision.
