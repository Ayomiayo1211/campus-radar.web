create table if not exists public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('EDITOR','REPORTER')),
  token_hash text not null unique,
  invited_by uuid not null references public.users(id) on delete restrict,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists admin_invitations_email_pending_idx
  on public.admin_invitations (lower(email), expires_at)
  where accepted_at is null and revoked_at is null;
alter table public.admin_invitations enable row level security;
revoke all on public.admin_invitations from anon, authenticated;
grant all on public.admin_invitations to service_role;

create or replace function public.accept_admin_invitation(
  p_token_hash text,
  p_name text,
  p_password_hash text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.admin_invitations%rowtype;
  new_user_id uuid;
begin
  select * into invitation
  from public.admin_invitations
  where token_hash = p_token_hash and accepted_at is null
    and revoked_at is null and expires_at > now()
  for update;
  if not found then raise exception 'Invitation is invalid or expired'; end if;
  if exists (select 1 from public.users where lower(email) = lower(invitation.email)) then
    raise exception 'An account with this email already exists';
  end if;
  insert into public.users (name,email,password_hash,role,is_active)
  values (trim(p_name),lower(invitation.email),p_password_hash,invitation.role,true)
  returning id into new_user_id;
  update public.admin_invitations set accepted_at=now() where id=invitation.id;
  return new_user_id;
end;
$$;
revoke all on function public.accept_admin_invitation(text,text,text) from public, anon, authenticated;
grant execute on function public.accept_admin_invitation(text,text,text) to service_role;
