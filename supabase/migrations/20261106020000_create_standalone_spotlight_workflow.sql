create table if not exists public.spotlights (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 180),
  excerpt text not null check (char_length(excerpt) between 10 and 500),
  body text not null,
  image_url text,
  author_name text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','ARCHIVED','REVIEW')),
  is_current boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  submitted_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create unique index if not exists spotlights_one_current_idx on public.spotlights (is_current) where is_current = true;
create index if not exists spotlights_status_created_idx on public.spotlights(status, created_at desc);
alter table public.spotlights enable row level security;
revoke all on public.spotlights from anon, authenticated;
grant all on public.spotlights to service_role;

create table if not exists public.spotlight_submission_links (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  created_by uuid references public.users(id) on delete set null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.spotlight_submission_links enable row level security;
revoke all on public.spotlight_submission_links from anon, authenticated;
grant all on public.spotlight_submission_links to service_role;

insert into public.spotlights (title, excerpt, body, image_url, author_name, status, is_current, published_at)
select title, excerpt, body, cover_image, author_name, 'PUBLISHED', true, published_at
from public.stories
where is_spotlight = true and status = 'PUBLISHED'
order by updated_at desc
limit 1
on conflict do nothing;
update public.stories set is_spotlight = false where is_spotlight = true;
