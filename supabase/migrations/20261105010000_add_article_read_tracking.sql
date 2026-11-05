alter table public.stories
  add column if not exists read_count bigint not null default 0;

create table if not exists public.story_read_events (
  id bigint generated always as identity primary key,
  story_id uuid not null references public.stories(id) on delete cascade,
  visitor_hash text not null,
  read_date date not null,
  created_at timestamptz not null default now(),
  constraint story_read_events_unique_daily unique (story_id, visitor_hash, read_date)
);

alter table public.story_read_events enable row level security;
revoke all on public.story_read_events from public, anon, authenticated;
grant all on public.story_read_events to service_role;

create or replace function public.record_story_read(p_story_id uuid, p_visitor_hash text)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_id bigint;
  current_count bigint;
begin
  if p_visitor_hash is null or length(p_visitor_hash) < 32 then
    raise exception 'Invalid visitor identifier';
  end if;

  insert into public.story_read_events (story_id, visitor_hash, read_date)
  select s.id, p_visitor_hash, (now() at time zone 'utc')::date
  from public.stories s
  where s.id = p_story_id and s.status = 'PUBLISHED'
  on conflict (story_id, visitor_hash, read_date) do nothing
  returning id into inserted_id;

  if inserted_id is not null then
    update public.stories
    set read_count = read_count + 1
    where id = p_story_id
    returning read_count into current_count;
  else
    select read_count into current_count
    from public.stories
    where id = p_story_id and status = 'PUBLISHED';
  end if;

  return current_count;
end;
$$;

revoke all on function public.record_story_read(uuid, text) from public, anon, authenticated;
grant execute on function public.record_story_read(uuid, text) to service_role;
