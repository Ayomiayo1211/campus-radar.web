alter table public.story_comments alter column story_id drop not null;
alter table public.story_comments add column if not exists spotlight_id uuid references public.spotlights(id) on delete cascade;
alter table public.story_comments drop constraint if exists story_comments_parent_check;
alter table public.story_comments add constraint story_comments_parent_check
  check (
    (story_id is not null and spotlight_id is null)
    or
    (story_id is null and spotlight_id is not null)
  );
create index if not exists spotlight_comments_spotlight_created_idx
  on public.story_comments(spotlight_id, created_at desc)
  where spotlight_id is not null;
