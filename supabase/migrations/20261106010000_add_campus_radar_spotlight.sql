alter table public.stories
  add column if not exists is_spotlight boolean not null default false;

create unique index if not exists stories_single_current_spotlight_idx
  on public.stories (is_spotlight)
  where is_spotlight = true;

create or replace function public.set_current_spotlight(p_story_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.stories set is_spotlight = false where is_spotlight = true;

  if p_story_id is null then
    return true;
  end if;

  update public.stories
  set is_spotlight = true, updated_at = now()
  where id = p_story_id and status = 'PUBLISHED';

  if not found then
    raise exception 'Spotlight story must exist and be published';
  end if;

  return true;
end;
$$;

revoke all on function public.set_current_spotlight(uuid) from public, anon, authenticated;
grant execute on function public.set_current_spotlight(uuid) to service_role;
