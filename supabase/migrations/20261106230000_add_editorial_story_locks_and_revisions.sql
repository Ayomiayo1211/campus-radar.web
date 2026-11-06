alter table public.stories
  add column if not exists editing_locked_by uuid references public.users(id) on delete set null,
  add column if not exists editing_locked_at timestamptz;

create index if not exists stories_editing_locked_by_idx
  on public.stories(editing_locked_by)
  where editing_locked_by is not null;

create table if not exists public.story_edit_history (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  editor_id uuid references public.users(id) on delete set null,
  editor_name text not null,
  action text not null check (action in ('STARTED', 'UPDATED', 'RELEASED')),
  before_snapshot jsonb,
  after_snapshot jsonb,
  created_at timestamptz not null default now()
);

create index if not exists story_edit_history_story_created_idx
  on public.story_edit_history(story_id, created_at desc);

alter table public.story_edit_history enable row level security;
revoke all on table public.story_edit_history from anon, authenticated;
grant all on table public.story_edit_history to service_role;

comment on column public.stories.editing_locked_by is
  'The only newsroom user allowed to edit this story while the editorial lock is active.';
comment on column public.stories.editing_locked_at is
  'Timestamp when the current editor claimed the story.';
comment on table public.story_edit_history is
  'Immutable editorial activity and before/after snapshots for newsroom stories.';
