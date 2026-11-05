-- Add stable, compact share URLs for published and future stories.
alter table public.stories
  add column short_code text;

update public.stories
set short_code = substr(md5(gen_random_uuid()::text), 1, 8)
where short_code is null;

alter table public.stories
  alter column short_code set not null;

create unique index stories_short_code_key
  on public.stories(short_code);
