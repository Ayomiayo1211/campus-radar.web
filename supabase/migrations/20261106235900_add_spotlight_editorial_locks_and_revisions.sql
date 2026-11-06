alter table public.spotlights
  add column if not exists editing_locked_by uuid references public.users(id) on delete set null,
  add column if not exists editing_locked_at timestamptz;

create index if not exists spotlights_editing_locked_by_idx
  on public.spotlights(editing_locked_by)
  where editing_locked_by is not null;

create table if not exists public.spotlight_edit_history (
  id uuid primary key default gen_random_uuid(),
  spotlight_id uuid not null references public.spotlights(id) on delete cascade,
  editor_id uuid references public.users(id) on delete set null,
  editor_name text not null,
  action text not null check (action in ('STARTED', 'UPDATED', 'RELEASED')),
  before_snapshot jsonb,
  after_snapshot jsonb,
  created_at timestamptz not null default now()
);
create index if not exists spotlight_edit_history_spotlight_created_idx
  on public.spotlight_edit_history(spotlight_id, created_at desc);
alter table public.spotlight_edit_history enable row level security;
revoke all on table public.spotlight_edit_history from anon, authenticated;
grant all on table public.spotlight_edit_history to service_role;
comment on table public.spotlight_edit_history is
  'Immutable editorial activity and before/after snapshots for standalone Spotlights.';