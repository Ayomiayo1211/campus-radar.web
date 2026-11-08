-- Treat existing date-only deadlines as valid through the end of that calendar day.
update public.opportunities
set deadline = date_trunc('day', deadline) + interval '1 day' - interval '1 millisecond'
where deadline is not null and deadline = date_trunc('day', deadline);

-- Permanently remove expired opportunities, regardless of publication status.
-- Expired records are deleted from the database rather than retained as an archive.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'campus-radar-delete-expired-opportunities',
  '0 * * * *',
  $$delete from public.opportunities where deadline is not null and deadline < now()$$
);
