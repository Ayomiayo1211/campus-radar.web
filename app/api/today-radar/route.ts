import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
    const db = getSupabaseAdmin();

    const [{ data: events, error: eventsError }, { data: deadlines, error: deadlinesError }] = await Promise.all([
      db.from('radar_items')
        .select('slug,title,event_date')
        .eq('status', 'PUBLISHED')
        .not('event_date', 'is', null)
        .gte('event_date', start)
        .lt('event_date', end)
        .order('event_date', { ascending: true })
        .limit(30),
      db.from('opportunities')
        .select('slug,title,deadline')
        .eq('status', 'PUBLISHED')
        .gte('deadline', today)
        .lt('deadline', tomorrow)
        .order('deadline', { ascending: true })
        .limit(30),
    ]);

    if (eventsError || deadlinesError) {
      console.error("Today's Radar query failed:", eventsError?.message, deadlinesError?.message);
      return NextResponse.json({ error: "Could not load today's activities." }, { status: 500 });
    }

    const items = [
      ...(events ?? []).filter((item) => item.event_date !== null).map((item) => ({
        title: item.title,
        href: `/radar/${item.slug}`,
        type: 'Event' as const,
        timeLabel: item.event_date
          ? new Date(item.event_date).toLocaleTimeString('en-NG', {
              timeZone: 'Africa/Lagos',
              hour: 'numeric',
              minute: '2-digit',
            })
          : 'Time TBA',
      })),
      ...(deadlines ?? []).map((item) => ({
        title: item.title,
        href: `/opportunities/${item.slug}`,
        type: 'Deadline' as const,
        timeLabel: 'Closes today',
      })),
    ];

    return NextResponse.json({ items }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error("Today's Radar feed failed:", error);
    return NextResponse.json({ error: "Could not load today's activities." }, { status: 500 });
  }
}
