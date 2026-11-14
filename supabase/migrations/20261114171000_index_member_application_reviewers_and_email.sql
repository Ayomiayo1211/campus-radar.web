create index if not exists member_applications_reviewed_by_idx
  on public.member_applications (reviewed_by);

create index if not exists member_applications_email_created_at_idx
  on public.member_applications (email, created_at desc);
