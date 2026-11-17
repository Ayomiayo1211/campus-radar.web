-- Atomic server-side rate limiting for sensitive and public API routes.
create table if not exists public.api_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from public, anon, authenticated;
grant all on table public.api_rate_limits to service_role;

create or replace function public.consume_api_rate_limit(
  p_rate_key text,
  p_max_requests integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_count integer;
begin
  if p_rate_key is null or length(p_rate_key) <> 64
     or p_max_requests < 1 or p_max_requests > 10000
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into public.api_rate_limits(rate_key, window_started_at, request_count, updated_at)
  values (p_rate_key, now(), 1, now())
  on conflict (rate_key) do update
    set window_started_at = case
          when public.api_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
          then now()
          else public.api_rate_limits.window_started_at
        end,
        request_count = case
          when public.api_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
          then 1
          else public.api_rate_limits.request_count + 1
        end,
        updated_at = now()
  returning request_count into current_count;

  return current_count <= p_max_requests;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;

create index if not exists api_rate_limits_updated_at_idx
  on public.api_rate_limits(updated_at);

-- Expired keys are pruned by the application maintenance job or a scheduled
-- cleanup; retaining only hashes avoids storing raw IP addresses.

-- Incrementing this value invalidates every previously issued session for a user.
alter table public.users
  add column if not exists session_version integer not null default 0;

create or replace function public.reset_user_password(
  p_token_hash text,
  p_password_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  reset_record public.password_reset_tokens%rowtype;
begin
  select * into reset_record
  from public.password_reset_tokens
  where token_hash = p_token_hash
    and used_at is null
    and expires_at > now()
  for update;

  if not found then
    return false;
  end if;

  update public.users
  set password_hash = p_password_hash,
      session_version = coalesce(session_version, 0) + 1
  where id = reset_record.user_id;

  if not found then
    return false;
  end if;

  update public.password_reset_tokens
  set used_at = now()
  where user_id = reset_record.user_id
    and used_at is null;

  return true;
end;
$$;
