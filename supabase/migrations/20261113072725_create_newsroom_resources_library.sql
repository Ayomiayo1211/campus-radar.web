-- Private shared resource library for Campus Radar newsroom staff.
-- Videos are intentionally excluded from this first release.

create table if not exists public.newsroom_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  original_file_name text not null,
  mime_type text not null,
  file_category text not null check (file_category in ('IMAGE', 'PDF', 'AUDIO')),
  file_size bigint not null check (file_size > 0 and file_size <= 26214400),
  storage_path text not null unique,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists newsroom_resources_created_at_idx
  on public.newsroom_resources (created_at desc);
create index if not exists newsroom_resources_category_idx
  on public.newsroom_resources (file_category);

alter table public.newsroom_resources enable row level security;
revoke all on public.newsroom_resources from anon, authenticated;
grant all on public.newsroom_resources to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campus-radar-resources',
  'campus-radar-resources',
  false,
  26214400,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
    'audio/ogg', 'audio/flac', 'audio/aac'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
