import { createClient } from '@supabase/supabase-js';

const required = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'SUPABASE_SECRET_KEY', 'NEXT_PUBLIC_SUPABASE_URL'];
for (const key of required) if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const databaseId = process.env.D1_DATABASE_ID || 'b0602127-f6e1-4791-916b-dbd37017f389';
const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function d1(sql) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    const message = payload.errors?.map((item) => item.message).join('; ') || `Cloudflare D1 returned HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload.result?.[0]?.results ?? [];
}

async function stableId(table, oldId) {
  const input = new TextEncoder().encode(`campus-radar-d1:${table}:${oldId}`);
  const digest = await crypto.subtle.digest('SHA-256', input);
  const bytes = new Uint8Array(digest).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

const asDate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};
const asBool = (value) => value === true || value === 1 || value === '1';
const asNullable = (value) => value === undefined ? null : value;
const chunks = (items, size = 100) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

async function importTable(table, rows) {
  if (!rows.length) { console.log(`${table}: 0 records`); return; }
  for (const batch of chunks(rows)) {
    const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw new Error(`Supabase import failed for ${table}: ${error.message}`);
  }
  console.log(`${table}: ${rows.length} records processed`);
}

const tableNames = new Set((await d1("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'")).map((row) => String(row.name).toLowerCase()));
const legacyTables = ['User', 'Story', 'StoryTag', 'StoryImage', 'RadarItem', 'Opportunity', 'Submission', 'AdCampaign', 'Media'];
const source = {};
for (const table of legacyTables) {
  if (!tableNames.has(table.toLowerCase())) { source[table] = []; continue; }
  source[table] = await d1(`SELECT * FROM "${table}"`);
}

const ids = {};
for (const table of legacyTables) {
  ids[table] = new Map();
  for (const row of source[table]) if (row.id !== null && row.id !== undefined) ids[table].set(String(row.id), await stableId(table, row.id));
}

const users = source.User.map(row => ({
  id: ids.User.get(String(row.id)), name: row.name, email: String(row.email).trim().toLowerCase(),
  password_hash: row.passwordHash, role: row.role || 'REPORTER', is_active: asBool(row.isActive),
  created_at: asDate(row.createdAt) || new Date(0).toISOString(), updated_at: asDate(row.updatedAt) || asDate(row.createdAt) || new Date(0).toISOString(),
}));
const stories = source.Story.map(row => ({
  id: ids.Story.get(String(row.id)), slug: row.slug, title: row.title, excerpt: row.excerpt, body: row.body,
  content_type: row.contentType, origin: row.origin, commercial_status: row.commercialStatus || 'EDITORIAL',
  status: row.status || 'DRAFT', featured: asBool(row.featured), cover_image: asNullable(row.coverImage),
  author_name: row.authorName || 'Campus Radar', author_id: row.authorId ? ids.User.get(String(row.authorId)) || null : null,
  published_at: asDate(row.publishedAt), created_at: asDate(row.createdAt) || new Date(0).toISOString(), updated_at: asDate(row.updatedAt) || asDate(row.createdAt) || new Date(0).toISOString(),
}));
const storyTags = source.StoryTag.map(row => ({ id: ids.StoryTag.get(String(row.id)), story_id: ids.Story.get(String(row.storyId)), tag: row.tag }));
const media = source.Media.map(row => ({
  id: ids.Media.get(String(row.id)), public_id: row.publicId, url: row.url, secure_url: row.secureUrl,
  resource_type: row.resourceType || 'image', format: asNullable(row.format), width: asNullable(row.width), height: asNullable(row.height),
  bytes: asNullable(row.bytes), original_name: asNullable(row.originalName), alt_text: asNullable(row.altText), folder: asNullable(row.folder),
  created_at: asDate(row.createdAt) || new Date(0).toISOString(), updated_at: asDate(row.updatedAt) || asDate(row.createdAt) || new Date(0).toISOString(),
}));
const storyImages = source.StoryImage.map(row => ({
  id: ids.StoryImage.get(String(row.id)), story_id: ids.Story.get(String(row.storyId)),
  media_id: row.mediaId ? ids.Media.get(String(row.mediaId)) || null : null, url: row.url,
  alt_text: asNullable(row.altText), caption: asNullable(row.caption), photographer: asNullable(row.photographer),
  display_order: Number(row.displayOrder || 0), created_at: asDate(row.createdAt) || new Date(0).toISOString(), updated_at: asDate(row.updatedAt) || asDate(row.createdAt) || new Date(0).toISOString(),
}));
const radarItems = source.RadarItem.map(row => ({
  id: ids.RadarItem.get(String(row.id)), slug: row.slug, title: row.title, summary: row.summary, kind: row.kind,
  origin: row.origin, commercial_status: row.commercialStatus || 'EDITORIAL', status: row.status || 'DRAFT',
  cover_image: asNullable(row.coverImage), event_date: asDate(row.eventDate), location: asNullable(row.location), link: asNullable(row.link),
  published_at: asDate(row.publishedAt), created_at: asDate(row.createdAt) || new Date(0).toISOString(), updated_at: asDate(row.updatedAt) || asDate(row.createdAt) || new Date(0).toISOString(),
}));
const opportunities = source.Opportunity.map(row => ({
  id: ids.Opportunity.get(String(row.id)), slug: row.slug, title: row.title, organisation: row.organisation,
  type: row.type, description: row.description, deadline: asDate(row.deadline), application_url: asNullable(row.applicationUrl),
  origin: row.origin, commercial_status: row.commercialStatus || 'EDITORIAL', status: row.status || 'DRAFT',
  published_at: asDate(row.publishedAt), created_at: asDate(row.createdAt) || new Date(0).toISOString(), updated_at: asDate(row.updatedAt) || asDate(row.createdAt) || new Date(0).toISOString(),
}));
const submissions = source.Submission.map(row => ({
  id: ids.Submission.get(String(row.id)), type: row.type, name: asNullable(row.name), contact: asNullable(row.contact),
  title: asNullable(row.title), body: row.body, source: row.source || 'WEBSITE', status: row.status || 'PENDING',
  reviewed_by: row.reviewedBy ? ids.User.get(String(row.reviewedBy)) || String(row.reviewedBy) : null,
  reviewed_at: asDate(row.reviewedAt), created_at: asDate(row.createdAt) || new Date(0).toISOString(), updated_at: asDate(row.updatedAt) || asDate(row.createdAt) || new Date(0).toISOString(),
}));
const adCampaigns = source.AdCampaign.map(row => ({
  id: ids.AdCampaign.get(String(row.id)), advertiser: row.advertiser, type: row.type, placement: row.placement,
  creative_url: asNullable(row.creativeUrl), target_url: asNullable(row.targetUrl), starts_at: asDate(row.startsAt), ends_at: asDate(row.endsAt),
  status: row.status || 'DRAFT', created_at: asDate(row.createdAt) || new Date(0).toISOString(), updated_at: asDate(row.updatedAt) || asDate(row.createdAt) || new Date(0).toISOString(),
}));

await importTable('users', users);
await importTable('stories', stories);
await importTable('story_tags', storyTags);
await importTable('media', media);
await importTable('story_images', storyImages);
await importTable('radar_items', radarItems);
await importTable('opportunities', opportunities);
await importTable('submissions', submissions);
await importTable('ad_campaigns', adCampaigns);
console.log('D1 to Supabase import completed. Source D1 data was read only and has not been modified.');
