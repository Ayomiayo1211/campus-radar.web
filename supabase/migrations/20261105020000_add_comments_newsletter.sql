create extension if not exists pgcrypto;

create table if not exists public.story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  email text not null,
  body text not null check (char_length(body) between 2 and 2000),
  status text not null default 'PUBLISHED' check (status in ('PUBLISHED','HIDDEN','DELETED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists story_comments_story_created_idx on public.story_comments(story_id, created_at desc);
create index if not exists story_comments_status_created_idx on public.story_comments(status, created_at desc);

create table if not exists public.story_comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.story_comments(id) on delete cascade,
  reporter_hash text not null,
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now(),
  unique(comment_id, reporter_hash)
);

create table if not exists public.comment_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0
);

create or replace function public.check_comment_rate_limit(p_rate_key text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare allowed boolean;
begin
  if p_rate_key is null or char_length(p_rate_key) < 32 then return false; end if;
  insert into public.comment_rate_limits(rate_key, window_started_at, request_count)
  values (p_rate_key, now(), 1)
  on conflict (rate_key) do update
    set window_started_at = case when comment_rate_limits.window_started_at < now() - interval '10 minutes' then now() else comment_rate_limits.window_started_at end,
        request_count = case when comment_rate_limits.window_started_at < now() - interval '10 minutes' then 1 else comment_rate_limits.request_count + 1 end;
  select request_count <= 5 into allowed from public.comment_rate_limits where rate_key = p_rate_key;
  return coalesce(allowed, false);
end;
$$;

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null unique,
  status text not null default 'PENDING' check (status in ('PENDING','ACTIVE','UNSUBSCRIBED')),
  consent_source text not null default 'website',
  confirmation_token_hash text,
  unsubscribe_token_hash text not null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz
);
create index if not exists newsletter_subscribers_status_idx on public.newsletter_subscribers(status);

create table if not exists public.newsletter_deliveries (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  subscriber_id uuid not null references public.newsletter_subscribers(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING','SENT','FAILED')),
  provider_message_id text,
  error_message text,
  attempted_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(story_id, subscriber_id)
);
create index if not exists newsletter_deliveries_story_idx on public.newsletter_deliveries(story_id, status);

alter table public.story_comments enable row level security;
alter table public.story_comment_reports enable row level security;
alter table public.comment_rate_limits enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_deliveries enable row level security;

revoke all on public.story_comments, public.story_comment_reports, public.comment_rate_limits, public.newsletter_subscribers, public.newsletter_deliveries from anon, authenticated;
grant all on public.story_comments, public.story_comment_reports, public.comment_rate_limits, public.newsletter_subscribers, public.newsletter_deliveries to service_role;
revoke all on function public.check_comment_rate_limit(text) from public, anon, authenticated;
grant execute on function public.check_comment_rate_limit(text) to service_role;
