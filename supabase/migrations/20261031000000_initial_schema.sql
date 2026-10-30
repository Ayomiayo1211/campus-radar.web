-- Campus Radar initial PostgreSQL schema.
-- All application data is accessed through server-side API routes.
-- RLS is enabled and direct anon/authenticated table access is revoked.

create table public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'REPORTER',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body text not null,
  content_type text not null,
  origin text not null,
  commercial_status text not null default 'EDITORIAL',
  status text not null default 'DRAFT',
  featured boolean not null default false,
  cover_image text,
  author_name text not null,
  author_id uuid references public.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.story_tags (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  tag text not null,
  constraint story_tags_story_id_tag_key unique (story_id, tag)
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  url text not null,
  secure_url text not null,
  resource_type text not null default 'image',
  format text,
  width integer,
  height integer,
  bytes integer,
  original_name text,
  alt_text text,
  folder text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.story_images (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  media_id uuid unique,
  url text not null,
  alt_text text,
  caption text,
  photographer text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.radar_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  kind text not null,
  origin text not null,
  commercial_status text not null default 'EDITORIAL',
  status text not null default 'DRAFT',
  cover_image text,
  event_date timestamptz,
  location text,
  link text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  organisation text not null,
  type text not null,
  description text not null,
  deadline timestamptz,
  application_url text,
  origin text not null,
  commercial_status text not null default 'EDITORIAL',
  status text not null default 'DRAFT',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  name text,
  contact text,
  title text,
  body text not null,
  source text not null default 'WEBSITE',
  status text not null default 'PENDING',
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser text not null,
  type text not null,
  placement text not null,
  creative_url text,
  target_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ad_campaigns_valid_dates check (ends_at >= starts_at)
);

create index stories_status_published_at_idx on public.stories(status, published_at);
create index stories_content_type_status_idx on public.stories(content_type, status);
create index story_tags_story_id_idx on public.story_tags(story_id);
create index story_images_story_id_display_order_idx on public.story_images(story_id, display_order);
create index radar_items_status_published_at_idx on public.radar_items(status, published_at);
create index opportunities_status_deadline_idx on public.opportunities(status, deadline);
create index submissions_status_created_at_idx on public.submissions(status, created_at);
create index ad_campaigns_status_starts_at_ends_at_idx on public.ad_campaigns(status, starts_at, ends_at);

alter table public.users enable row level security;
alter table public.stories enable row level security;
alter table public.story_tags enable row level security;
alter table public.story_images enable row level security;
alter table public.radar_items enable row level security;
alter table public.opportunities enable row level security;
alter table public.submissions enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.media enable row level security;

revoke all on public.users, public.stories, public.story_tags, public.story_images,
  public.radar_items, public.opportunities, public.submissions,
  public.ad_campaigns, public.media from anon, authenticated;

grant all on public.users, public.stories, public.story_tags, public.story_images,
  public.radar_items, public.opportunities, public.submissions,
  public.ad_campaigns, public.media to service_role;
