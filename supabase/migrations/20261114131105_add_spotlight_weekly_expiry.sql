alter table public.spotlights
  add column if not exists expires_at timestamptz;

-- Existing published Spotlights retain a seven-day window measured from publication.
update public.spotlights
set expires_at = published_at + interval '7 days'
where status = 'PUBLISHED'
  and published_at is not null
  and expires_at is null;

-- Do not leave an already-expired Spotlight in the public popup.
update public.spotlights
set is_current = false
where is_current = true
  and expires_at is not null
  and expires_at <= now();

alter table public.spotlight_edit_history
  drop constraint if exists spotlight_edit_history_action_check;

alter table public.spotlight_edit_history
  add constraint spotlight_edit_history_action_check
  check (action in ('STARTED', 'UPDATED', 'RELEASED', 'DEACTIVATED'));

create index if not exists spotlights_current_expiry_idx
  on public.spotlights (expires_at)
  where is_current = true;
