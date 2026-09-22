import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
    if (!process.env[key]) process.env[key] = value;
  }
}

class VerificationStop extends Error {
  constructor(exitCode) {
    super('Supabase verification stopped');
    this.exitCode = exitCode;
  }
}

function stop(message, exitCode = 1, details = '') {
  console.error(`✗ ${message}`);
  if (details) console.error(`  ${details}`);
  throw new VerificationStop(exitCode);
}

function validatePublicPage(page) {
  if (!page) return { published: false, timerCount: 0 };
  const timers = page.payload?.timers;
  if (!Array.isArray(timers)) {
    stop('公开页面 payload.timers 不是数组。', 5);
  }
  return {
    published: true,
    timerCount: timers.length,
    version: Number(page.version || 0),
    publishedAt: page.published_at || null
  };
}

async function main() {
loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const slug = process.env.NEXT_PUBLIC_TIMEPULSE_PAGE_SLUG || 'main';

if (!url || !publishableKey) {
  stop('缺少 Supabase 环境变量。请先配置 .env.local。');
}

const client = createClient(url, publishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

console.log(`检查 Supabase 项目：${new URL(url).host}`);
console.log(`公开页面 slug：${slug}`);

const { data: publicPage, error: publicError, status } = await client
  .from('timepulse_pages')
  .select('slug,payload,is_public,version,published_at')
  .eq('slug', slug)
  .eq('is_public', true)
  .maybeSingle();

if (publicError?.code === 'PGRST205') {
  stop(
    '尚未找到 public.timepulse_pages 数据表。',
    2,
    '请先在 Supabase SQL Editor 运行 supabase/migrations/001_timepulse_pages.sql。'
  );
}

if (publicError) {
  stop('匿名读取失败。', 3, `${publicError.code || status}: ${publicError.message}`);
}

console.log('✓ 匿名读取与 RLS 查询可用');
const publicSummary = validatePublicPage(publicPage);
if (publicSummary.published) {
  console.log(`✓ 已发布 v${publicSummary.version}，包含 ${publicSummary.timerCount} 个计时器`);
  console.log(`  发布时间：${publicSummary.publishedAt || '未知'}`);
} else {
  console.log('! 数据表已就绪，但尚未发布 slug 对应的公开页面');
}

const adminEmail = process.env.TIMEPULSE_ADMIN_EMAIL;
const adminPassword = process.env.TIMEPULSE_ADMIN_PASSWORD;

if (!adminEmail && !adminPassword) {
  console.log('! 未提供管理员临时环境变量，已跳过认证检查');
  console.log('  可设置 TIMEPULSE_ADMIN_EMAIL 与 TIMEPULSE_ADMIN_PASSWORD 后再次运行');
  return;
}

if (!adminEmail || !adminPassword) {
  stop('管理员认证检查需要同时提供邮箱和密码。', 4);
}

const { data: authData, error: authError } = await client.auth.signInWithPassword({
  email: adminEmail,
  password: adminPassword
});

if (authError || !authData.user) {
  stop('管理员登录验证失败。', 4, authError?.message || '没有返回用户会话');
}

console.log(`✓ 管理员认证可用：${authData.user.email}`);

const { data: ownedPage, error: ownerError } = await client
  .from('timepulse_pages')
  .select('slug,owner_id,version')
  .eq('slug', slug)
  .maybeSingle();

if (ownerError) {
  stop('管理员读取检查失败。', 4, ownerError.message);
}

if (ownedPage && ownedPage.owner_id !== authData.user.id) {
  stop('当前管理员不是已发布页面的所有者。', 4);
}

console.log(ownedPage
  ? '✓ 管理员是当前公开页面的所有者'
  : '✓ 管理员认证正常，可进行首次发布');

await client.auth.signOut({ scope: 'local' });
console.log('Supabase 只读验收完成。');
}

main().catch(error => {
  if (error instanceof VerificationStop) {
    process.exitCode = error.exitCode;
    return;
  }
  console.error('✗ Supabase 自检发生未预期错误。');
  console.error(`  ${error.message}`);
  process.exitCode = 1;
});
