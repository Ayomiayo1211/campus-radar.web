-- Newsroom routing and senior editor support.
alter table public.stories
  add column if not exists assigned_editor_id uuid references public.users(id) on delete set null,
  add column if not exists assigned_reporter_id uuid references public.users(id) on delete set null,
  add column if not exists assigned_by_id uuid references public.users(id) on delete set null,
  add column if not exists assigned_note text;

create index if not exists stories_assigned_editor_idx
  on public.stories(assigned_editor_id) where assigned_editor_id is not null;
create index if not exists stories_assigned_reporter_idx
  on public.stories(assigned_reporter_id) where assigned_reporter_id is not null;

create table if not exists public.story_assignment_history (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  assigned_by_id uuid references public.users(id) on delete set null,
  assigned_by_name text not null,
  assigned_to_id uuid references public.users(id) on delete set null,
  assigned_to_name text not null,
  assignment_type text not null check (assignment_type in ('EDITOR_REVIEW', 'REPORTER_TASK')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists story_assignment_history_story_created_idx
  on public.story_assignment_history(story_id, created_at desc);

alter table public.story_assignment_history enable row level security;
revoke all on table public.story_assignment_history from anon, authenticated;
grant all on table public.story_assignment_history to service_role;

comment on column public.stories.assigned_editor_id is
  'Editor selected to receive and make the final editorial decision on this story.';
comment on column public.stories.assigned_reporter_id is
  'Reporter responsible for an assignment allocated by a Senior Editor or Super Admin.';
comment on table public.story_assignment_history is
  'Audit trail for newsroom submissions and reporter assignments.';
