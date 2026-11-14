create table if not exists public.user_teams (
  user_id uuid not null references public.users(id) on delete cascade,
  team text not null check (
    team in ('EDITORIAL', 'CREATIVE', 'PHOTOGRAPHY', 'PODCAST', 'EVENTS', 'PARTNERSHIPS')
  ),
  assigned_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, team)
);

create index if not exists user_teams_team_idx
  on public.user_teams (team, user_id);

alter table public.user_teams enable row level security;

revoke all on public.user_teams from anon, authenticated;
grant all on public.user_teams to service_role;

create or replace function public.set_user_teams(
  p_user_id uuid,
  p_teams text[],
  p_assigned_by uuid
)
returns void
language plpgsql
set search_path = public
as $$
declare
  selected_teams text[] := coalesce(p_teams, '{}'::text[]);
begin
  if exists (
    select 1
    from unnest(selected_teams) as selected(team)
    where selected.team is null
      or selected.team not in ('EDITORIAL', 'CREATIVE', 'PHOTOGRAPHY', 'PODCAST', 'EVENTS', 'PARTNERSHIPS')
  ) then
    raise exception 'One or more team values are invalid';
  end if;

  delete from public.user_teams
  where user_id = p_user_id
    and not (team = any(selected_teams));

  insert into public.user_teams (user_id, team, assigned_by)
  select p_user_id, selected.team, p_assigned_by
  from (
    select distinct unnest(selected_teams) as team
  ) as selected
  on conflict (user_id, team) do nothing;
end;
$$;

revoke all on function public.set_user_teams(uuid, text[], uuid) from public, anon, authenticated;
grant execute on function public.set_user_teams(uuid, text[], uuid) to service_role;
