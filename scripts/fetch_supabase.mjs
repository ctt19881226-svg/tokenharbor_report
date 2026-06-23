/**
 * fetch_supabase.mjs
 *
 * Token Harbor — Daily Founder Metrics Fetcher (Supabase)
 *
 * 时间窗口: UTC 自然日
 *   yesterday_start = 昨日 UTC 00:00:00
 *   today_start     = 今日 UTC 00:00:00
 *
 * 报告日期 (report_date) = yesterday (UTC) 的日期, 格式 YYYY-MM-DD
 *
 * 输出:
 *   /reports/daily/{report_date}/daily_metrics.json
 *
 * 第一版说明:
 *   - GA4 (website 节) 全部填 0, 留待第二版接入
 *
 * 用法:
 *   node scripts/fetch_supabase.mjs
 */

import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────
const CONNECTION_STRING =
  process.env.SUPABASE_DB_URL ||
  "postgresql://marketing_ro.isbnzmwjmtiuipesgmmg:sV7N85nb2E9BiPdEiEcP7qzopW0MZkX9@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

// ─────────────────────────────────────────────────────────────
// Time window (UTC natural day)
// ─────────────────────────────────────────────────────────────
function getTimeWindow() {
  const now = new Date();

  // 今天 UTC 00:00:00
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  );

  // 昨天 UTC 00:00:00
  const yesterdayUTC = new Date(todayUTC.getTime() - 24 * 60 * 60 * 1000);

  // report_date = 昨天的日期 YYYY-MM-DD
  const report_date = yesterdayUTC.toISOString().slice(0, 10);

  return {
    yesterday_start: yesterdayUTC.toISOString(), // ISO with Z
    today_start: todayUTC.toISOString(),
    report_date,
  };
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
async function scalar(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  if (!rows[0]) return 0;
  const v = Object.values(rows[0])[0];
  if (v === null || v === undefined) return 0;
  // numeric → number
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}

async function rows(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
async function main() {
  const { yesterday_start, today_start, report_date } = getTimeWindow();

  console.log("=".repeat(60));
  console.log("Token Harbor Daily Metrics Fetcher (Supabase)");
  console.log(`report_date     = ${report_date}`);
  console.log(`yesterday_start = ${yesterday_start}`);
  console.log(`today_start     = ${today_start}`);
  console.log("=".repeat(60));

  const ys = yesterday_start;
  const ts = today_start;

  // ── 1. Growth ──────────────────────────────────────────────
  const total_users = await scalar(
    `select count(*) from profiles where role='user'`
  );

  const new_users_yesterday = await scalar(
    `select count(*) from profiles
     where role='user'
     and created_at >= $1 and created_at < $2`,
    [ys, ts]
  );

  const valid_users = await scalar(
    `select count(*) from profiles
     where role='user'
     and device_fingerprint is not null
     and signup_ip is not null`
  );

  const valid_user_rate = await scalar(
    `select round(
       100.0 *
       count(*) filter (where device_fingerprint is not null and signup_ip is not null)
       / nullif(count(*), 0), 2
     ) from profiles where role='user'`
  );

  // ── 2. Verification ───────────────────────────────────────
  const verified_users = await scalar(
    `select count(*) from profiles where email_verified_at is not null`
  );

  const new_verified_users_yesterday = await scalar(
    `select count(*) from profiles
     where email_verified_at >= $1 and email_verified_at < $2`,
    [ys, ts]
  );

  const verification_rate = await scalar(
    `select round(
       100.0 * count(*) filter (where email_verified_at is not null)
       / nullif(count(*), 0), 2
     ) from profiles where role='user'`
  );

  // ── 3. Activation ─────────────────────────────────────────
  const activated_users_total = await scalar(
    `select count(*) from profiles where first_api_request_at is not null`
  );

  const new_activated_users_yesterday = await scalar(
    `select count(*) from profiles
     where first_api_request_at >= $1 and first_api_request_at < $2`,
    [ys, ts]
  );

  const activation_rate = await scalar(
    `select round(
       100.0 * count(*) filter (where first_api_request_at is not null)
       / nullif(count(*), 0), 2
     ) from profiles where role='user'`
  );

  // ── 4. Activity ───────────────────────────────────────────
  const active_users_yesterday = await scalar(
    `select count(*) from profiles
     where last_active_at >= $1 and last_active_at < $2`,
    [ys, ts]
  );

  const active_users_7d = await scalar(
    `select count(*) from profiles
     where last_active_at >= now() - interval '7 day'`
  );

  // ── 5. Revenue ────────────────────────────────────────────
  const paying_users_total = await scalar(
    `select count(distinct user_id) from transactions where type='recharge'`
  );

  const new_paying_users_yesterday = await scalar(
    `select count(*) from (
       select user_id, min(created_at) as first_recharge_at
       from transactions where type='recharge'
       group by user_id
     ) t
     where first_recharge_at >= $1 and first_recharge_at < $2`,
    [ys, ts]
  );

  const revenue_yesterday = await scalar(
    `select coalesce(sum(amount), 0) from transactions
     where type='recharge'
     and created_at >= $1 and created_at < $2`,
    [ys, ts]
  );

  const revenue_mtd = await scalar(
    `select coalesce(sum(amount), 0) from transactions
     where type='recharge'
     and date_trunc('month', created_at) = date_trunc('month', now())`
  );

  const total_revenue = await scalar(
    `select coalesce(sum(amount), 0) from transactions where type='recharge'`
  );

  // ── 6. Usage ──────────────────────────────────────────────
  const api_calls_yesterday = await scalar(
    `select count(*) from request_traces
     where created_at >= $1 and created_at < $2`,
    [ys, ts]
  );

  const active_api_users = await scalar(
    `select count(distinct user_id) from request_traces
     where created_at >= $1 and created_at < $2`,
    [ys, ts]
  );

  const tokens_in = await scalar(
    `select coalesce(sum(tokens_in), 0) from request_traces
     where created_at >= $1 and created_at < $2`,
    [ys, ts]
  );

  const tokens_out = await scalar(
    `select coalesce(sum(tokens_out), 0) from request_traces
     where created_at >= $1 and created_at < $2`,
    [ys, ts]
  );

  const total_tokens = await scalar(
    `select coalesce(sum(tokens_in), 0) + coalesce(sum(tokens_out), 0)
     from request_traces
     where created_at >= $1 and created_at < $2`,
    [ys, ts]
  );

  const cost_usd = await scalar(
    `select round(coalesce(sum(cost_usd), 0), 4) from request_traces
     where created_at >= $1 and created_at < $2`,
    [ys, ts]
  );

  const error_rate = await scalar(
    `select round(
       100.0 * count(*) filter (where ok=false)
       / nullif(count(*), 0), 2
     ) from request_traces
     where created_at >= $1 and created_at < $2`,
    [ys, ts]
  );

  const cache_hit_rate = await scalar(
    `select round(
       100.0 * count(*) filter (where cache_hit=true)
       / nullif(count(*), 0), 2
     ) from request_traces
     where created_at >= $1 and created_at < $2`,
    [ys, ts]
  );

  // ── 7. Top Models ─────────────────────────────────────────
  // 拉取全量按 model 的请求计数,然后在 JS 端做"跨 provider 合并"
  //   规则:
  //     1) 剥离 provider 前缀:取最后一个 "/" 之后的部分
  //        例: "anthropic/claude-sonnet-4.6"  → "claude-sonnet-4.6"
  //            "deepseek/deepseek-v4-flash"   → "deepseek-v4-flash"
  //     2) 统一分隔符:小写 + 将 "." 替换为 "-"
  //        例: "claude-sonnet-4.6" → "claude-sonnet-4-6"
  //     3) 合并 requests 总数,重新计算 share_pct
  const all_model_rows = await rows(
    `select model, count(*)::int as requests
     from request_traces
     where created_at >= $1 and created_at < $2
     group by model`,
    [ys, ts]
  );

  function normalizeModelName(name) {
    if (!name) return "(unknown)";
    let s = String(name).trim();
    const slash = s.lastIndexOf("/");
    if (slash >= 0) s = s.slice(slash + 1);
    s = s.toLowerCase().replace(/\./g, "-");
    return s;
  }

  const merged = new Map();
  let total_requests = 0;
  for (const r of all_model_rows) {
    const key = normalizeModelName(r.model);
    const req = Number(r.requests) || 0;
    merged.set(key, (merged.get(key) || 0) + req);
    total_requests += req;
  }

  const top_models_normalized = Array.from(merged.entries())
    .map(([model, requests]) => ({
      model,
      requests,
      share_pct:
        total_requests > 0
          ? Math.round((10000 * requests) / total_requests) / 100
          : 0,
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);

  // ── 8. Welcome Credit Economics ───────────────────────────
  const wc_users_granted = await scalar(
    `select count(distinct user_id) from credit_grants where kind='welcome'`
  );

  const wc_total_granted = await scalar(
    `select coalesce(sum(amount_usd), 0) from credit_grants where kind='welcome'`
  );

  const wc_users_consumed = await scalar(
    `select count(distinct cg.user_id)
     from credit_grants cg
     where cg.kind='welcome'
     and exists (
       select 1 from transactions t
       where t.user_id = cg.user_id and t.type='consume'
     )`
  );

  const wc_consumption_amount = await scalar(
    `select abs(coalesce(sum(t.amount), 0))
     from transactions t
     where t.type='consume'
     and exists (
       select 1 from credit_grants cg
       where cg.user_id=t.user_id and cg.kind='welcome'
     )`
  );

  const wc_to_paid = await scalar(
    `select count(distinct cg.user_id)
     from credit_grants cg
     where cg.kind='welcome'
     and exists (
       select 1 from transactions t
       where t.user_id=cg.user_id and t.type='recharge'
     )`
  );

  const wc_total_reclaimed = await scalar(
    `select coalesce(sum(reclaimed_amount), 0)
     from credit_grants where kind='welcome'`
  );

  const wc_net_granted = await scalar(
    `select coalesce(sum(amount_usd), 0) - coalesce(sum(reclaimed_amount), 0)
     from credit_grants where kind='welcome'`
  );

  const wc_utilization_rate = await scalar(
    `with granted as (
       select coalesce(sum(amount_usd), 0) as total_granted
       from credit_grants where kind='welcome'
     ),
     consumed as (
       select abs(coalesce(sum(t.amount), 0)) as total_consumed
       from transactions t
       where t.type='consume'
       and exists (
         select 1 from credit_grants cg
         where cg.user_id=t.user_id and cg.kind='welcome'
       )
     )
     select round(100.0 * total_consumed / nullif(total_granted, 0), 2)
     from granted, consumed`
  );

  // ── 9. Referral ───────────────────────────────────────────
  const referral_users_total = await scalar(
    `select count(*) from profiles where referred_by is not null`
  );

  const new_referral_users_yesterday = await scalar(
    `select count(*) from profiles
     where referred_by is not null
     and created_at >= $1 and created_at < $2`,
    [ys, ts]
  );

  const referral_share = await scalar(
    `select round(
       100.0 * count(*) filter (where referred_by is not null)
       / nullif(count(*), 0), 2
     ) from profiles`
  );

  // ─────────────────────────────────────────────────────────
  // Assemble JSON (按 daily-metrics-json-schema-v1.md)
  // ─────────────────────────────────────────────────────────
  const data = {
    report_date,

    growth: {
      total_users,
      new_users_yesterday,
      valid_users,
      valid_user_rate,
    },

    verification: {
      verified_users,
      verification_rate,
    },

    activation: {
      activated_users_total,
      new_activated_users_yesterday,
      activation_rate,
    },

    activity: {
      active_users_yesterday,
      active_users_7d,
    },

    revenue: {
      paying_users_total,
      new_paying_users_yesterday,
      revenue_yesterday,
      revenue_mtd,
      total_revenue,
    },

    usage: {
      api_calls_yesterday,
      active_api_users,
      tokens_in,
      tokens_out,
      total_tokens,
      cost_usd,
      error_rate,
      cache_hit_rate,
    },

    top_models: top_models_normalized,

    welcome_credit: {
      users_granted: wc_users_granted,
      total_granted: wc_total_granted,
      users_consumed_credit: wc_users_consumed,
      credit_consumption_amount: wc_consumption_amount,
      welcome_credit_to_paid: wc_to_paid,
      total_reclaimed: wc_total_reclaimed,
      net_granted: wc_net_granted,
      utilization_rate: wc_utilization_rate,
    },

    referral: {
      referral_users_total,
      new_referral_users_yesterday,
      referral_share,
    },

    // GA4: 第一版占位
    website: {
      visitors_yesterday: 0,
      sessions_yesterday: 0,
      website_registrations_yesterday: 0,
    },
  };

  // ─────────────────────────────────────────────────────────
  // Write output
  // ─────────────────────────────────────────────────────────
  const outDir = path.join(PROJECT_ROOT, "reports", "daily", report_date);
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "daily_metrics.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + "\n", "utf8");

  console.log();
  console.log("✅ 输出已写入:");
  console.log(`   ${outPath}`);
  console.log();
  console.log(JSON.stringify(data, null, 2));

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
