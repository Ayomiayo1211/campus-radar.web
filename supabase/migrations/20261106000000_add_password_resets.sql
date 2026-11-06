create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_reset_tokens_user_pending_idx
  on public.password_reset_tokens(user_id, created_at desc)
  where used_at is null;
alter table public.password_reset_tokens enable row level security;
revoke all on public.password_reset_tokens from anon, authenticated, public;
grant all on public.password_reset_tokens to service_role;

create or replace function public.reset_user_password(p_token_hash text, p_password_hash text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare reset_record public.password_reset_tokens%rowtype;
begin
  select * into reset_record
  from public.password_reset_tokens
  where token_hash = p_token_hash
    and used_at is null
    and expires_at > now()
  for update;
  if not found then return false; end if;

  update public.users
  set password_hash = p_password_hash
  where id = reset_record.user_id;
  if not found then return false; end if;

  update public.password_reset_tokens
  set used_at = now()
  where user_id = reset_record.user_id and used_at is null;
  return true;
end;
$$;
revoke all on function public.reset_user_password(text, text) from public, anon, authenticated;
grant execute on function public.reset_user_password(text, text) to service_role;
