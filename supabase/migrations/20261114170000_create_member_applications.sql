create table if not exists public.member_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  matric_number text not null check (char_length(matric_number) between 2 and 60),
  level text not null check (level in ('100','200','300','400','500','Postgraduate','Other')),
  department text not null check (char_length(department) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 40),
  whatsapp text,
  email text not null check (char_length(email) <= 254),
  teams text[] not null check (
    cardinality(teams) between 1 and 6
    and teams <@ array['EDITORIAL','CREATIVE','PHOTOGRAPHY','PODCAST','EVENTS','PARTNERSHIPS']::text[]
  ),
  why_team text,
  skills text,
  portfolio text,
  prior_role text check (prior_role is null or prior_role in ('Yes','No')),
  heard_from text,
  hours_per_week text not null check (hours_per_week in ('1–3 hrs','4–6 hrs','7–10 hrs','10+ hrs')),
  terms_acknowledged boolean not null default false check (terms_acknowledged = true),
  status text not null default 'NEW' check (status in ('NEW','REVIEWING','ACCEPTED','REJECTED')),
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists member_applications_created_at_idx
  on public.member_applications (created_at desc);
create index if not exists member_applications_status_created_at_idx
  on public.member_applications (status, created_at desc);
create index if not exists member_applications_email_created_at_idx
  on public.member_applications (lower(email), created_at desc);

alter table public.member_applications enable row level security;
revoke all on public.member_applications from anon, authenticated;
grant all on public.member_applications to service_role;
