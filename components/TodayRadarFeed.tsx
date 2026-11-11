import { getSupabaseAdmin } from '@/lib/server/supabase';
import { TodayRadar, type TodayRadarItem } from '@/components/TodayRadarWidget';

export async function TodayRadarFeed() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const today = `${values.year}-${values.month}-${values.day}`;
  const tomorrow = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + 1)).toISOString().slice(0, 10);
  const start = new Date(`${today}T00:00:00+01:00`).toISOString();
  const end = new Date(`${tomorrow}T00:00:00+01:00`).toISOString();

  const [{ data: events, error: eventsError }, { data: deadlines, error: deadlinesError }] = await Promise.all([
    getSupabaseAdmin()
      .from('radar_items')
      .select('slug,title,event_date')
      .eq('status', 'PUBLISHED')
      .not('event_date', 'is', null)
      .gte('event_date', start)
      .lt('event_date', end)
      .order('event_date', { ascending: true })
      .limit(30),
    getSupabaseAdmin()
      .from('opportunities')
      .select('slug,title,deadline')
      .eq('status', 'PUBLISHED')
      .gte('deadline', today)
      .lt('deadline', tomorrow)
      .order('deadline', { ascending: true })
      .limit(30),
  ]);

  if (eventsError) console.error('Today’s Radar events query failed:', eventsError.message);
  if (deadlinesError) console.error('Today’s Radar deadlines query failed:', deadlinesError.message);

  const items: TodayRadarItem[] = [
    ...(events ?? []).map((item) => ({
      title: item.title,
      href: `/radar/${item.slug}`,
      type: 'Event' as const,
      timeLabel: new Date(item.event_date).toLocaleTimeString('en-NG', {
        timeZone: 'Africa/Lagos',
        hour: 'numeric',
        minute: '2-digit',
      }),
    })),
    ...(deadlines ?? []).map((item) => ({
      title: item.title,
      href: `/opportunities/${item.slug}`,
      type: 'Deadline' as const,
      timeLabel: 'Closes today',
    })),
  ];

  return <TodayRadar items={items} />;
}
