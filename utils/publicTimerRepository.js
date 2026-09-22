import { getSupabaseClient, publicPageSlug } from '../lib/supabaseClient';

const TABLE_NAME = 'timepulse_pages';
export const PUBLIC_PAYLOAD_SCHEMA_VERSION = 1;

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    const error = new Error('Supabase 尚未配置，请先填写环境变量。');
    error.code = 'SUPABASE_NOT_CONFIGURED';
    throw error;
  }
  return client;
}

function normalizePage(row) {
  if (!row) return null;
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
  const timers = Array.isArray(payload.timers) ? payload.timers.filter(Boolean) : [];
  const featuredTimerId = timers.some(timer => timer.id === payload.featuredTimerId)
    ? payload.featuredTimerId
    : timers[0]?.id || null;

  return {
    slug: row.slug,
    timers,
    featuredTimerId,
    siteSettings: payload.siteSettings && typeof payload.siteSettings === 'object'
      ? payload.siteSettings
      : {},
    schemaVersion: Number(payload.schemaVersion || PUBLIC_PAYLOAD_SCHEMA_VERSION),
    version: Number(row.version || 1),
    publishedAt: row.published_at || null,
    updatedAt: row.updated_at || null
  };
}

export async function fetchPublicTimerPage(slug = publicPageSlug) {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('slug,payload,is_public,version,published_at,updated_at')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();

  if (error) throw error;
  return normalizePage(data);
}

export async function publishTimerPage({
  ownerId,
  timers,
  featuredTimerId,
  expectedVersion,
  slug = publicPageSlug
}) {
  const supabase = requireClient();
  if (!ownerId) throw new Error('管理员会话已失效，请重新登录。');
  if (!Array.isArray(timers) || timers.length === 0) throw new Error('至少需要一个计时器才能发布。');

  const payload = {
    schemaVersion: PUBLIC_PAYLOAD_SCHEMA_VERSION,
    featuredTimerId: timers.some(timer => timer.id === featuredTimerId)
      ? featuredTimerId
      : timers[0].id,
    timers,
    siteSettings: {}
  };
  const timestamp = new Date().toISOString();

  const { data: existing, error: readError } = await supabase
    .from(TABLE_NAME)
    .select('slug,owner_id,version')
    .eq('slug', slug)
    .maybeSingle();

  if (readError) throw readError;

  if (!existing) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        slug,
        owner_id: ownerId,
        payload,
        is_public: true,
        version: 1,
        published_at: timestamp,
        updated_at: timestamp
      })
      .select('slug,payload,is_public,version,published_at,updated_at')
      .single();

    if (error) throw error;
    return normalizePage(data);
  }

  if (existing.owner_id !== ownerId) {
    const error = new Error('当前账号不是这个公开页面的所有者。');
    error.code = 'NOT_PAGE_OWNER';
    throw error;
  }

  if (expectedVersion != null && Number(existing.version) !== Number(expectedVersion)) {
    const error = new Error('云端数据已被更新，请先重新加载后再发布。');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }

  const nextVersion = Number(existing.version || 0) + 1;
  let updateQuery = supabase
    .from(TABLE_NAME)
    .update({
      payload,
      is_public: true,
      version: nextVersion,
      published_at: timestamp,
      updated_at: timestamp
    })
    .eq('slug', slug)
    .eq('owner_id', ownerId);

  if (expectedVersion != null) updateQuery = updateQuery.eq('version', expectedVersion);

  const { data, error } = await updateQuery
    .select('slug,payload,is_public,version,published_at,updated_at')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const conflict = new Error('发布前云端数据发生变化，请重新加载后再试。');
    conflict.code = 'VERSION_CONFLICT';
    throw conflict;
  }

  return normalizePage(data);
}

