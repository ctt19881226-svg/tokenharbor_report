/**
 * test_queries.mjs
 * 测试 sql-queries-v1.md 中所有 Supabase SQL 查询是否能正常运行
 *
 * 时间窗口约定:
 *   - 报告以「UTC 自然日」为单位
 *   - 任务运行时间为北京时间 08:05(= UTC 00:05)
 *   - "Yesterday" = 前一个 UTC 自然日 [yesterday 00:00:00 UTC, today 00:00:00 UTC)
 *
 * 用法: node scripts/test_queries.mjs
 */

import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString:
    "postgresql://marketing_ro.isbnzmwjmtiuipesgmmg:sV7N85nb2E9BiPdEiEcP7qzopW0MZkX9@aws-1-us-east-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

// 计算时间窗口(UTC 自然日)
function getTimeRange() {
  const now = new Date();
  // 今天 00:00:00 UTC
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  );
  const yesterdayUTC = new Date(todayUTC.getTime() - 24 * 60 * 60 * 1000);

  return {
    yesterday_start: yesterdayUTC.toISOString(), // e.g. 2026-06-22T00:00:00.000Z
    today_start: todayUTC.toISOString(),
  };
}

async function runQuery(label, sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    const value = result.rows[0];
    console.log(`✅ ${label}`);
    console.log(`   结果:`, JSON.stringify(value));
    return { ok: true, label, value };
  } catch (err) {
    console.log(`❌ ${label}`);
    console.log(`   错误: ${err.message}`);
    return { ok: false, label, error: err.message };
  }
}

async function main() {
  const { yesterday_start, today_start } = getTimeRange();

  console.log("=".repeat(60));
  console.log("Token Harbor SQL Query Test");
  console.log(`时间窗口: UTC 自然日`);
  console.log(`yesterday_start = ${yesterday_start}`);
  console.log(`today_start     = ${today_start}`);
  console.log("=".repeat(60));
  console.log();

  const ys = yesterday_start;
  const ts = today_start;

  // ── 1. Growth ─────────────────────────────────────────────
  console.log("── 1. Growth ──────────────────────────────────────────");

  await runQuery("Total Users", `
    select count(*) from profiles where role='user'
  `);

  await runQuery("New Users Yesterday", `
    select count(*) from profiles
    where role='user'
    and created_at >= $1 and created_at < $2
  `, [ys, ts]);

  await runQuery("Valid Users", `
    select count(*) from profiles
    where role='user'
    and device_fingerprint is not null
    and signup_ip is not null
  `);

  await runQuery("Valid User Rate", `
    select round(
      100.0 *
      count(*) filter (where device_fingerprint is not null and signup_ip is not null)
      / nullif(count(*), 0), 2
    ) from profiles where role='user'
  `);

  console.log();

  // ── 2. Verification ───────────────────────────────────────
  console.log("── 2. Verification ────────────────────────────────────");

  await runQuery("Verified Users", `
    select count(*) from profiles
    where email_verified_at is not null
  `);

  await runQuery("Verification Rate", `
    select round(
      100.0 *
      count(*) filter (where email_verified_at is not null)
      / nullif(count(*), 0), 2
    ) from profiles where role='user'
  `);

  console.log();

  // ── 3. Activation ─────────────────────────────────────────
  console.log("── 3. Activation ──────────────────────────────────────");

  await runQuery("Activated Users Total", `
    select count(*) from profiles
    where first_api_request_at is not null
  `);

  await runQuery("New Activated Users Yesterday", `
    select count(*) from profiles
    where first_api_request_at >= $1
    and first_api_request_at < $2
  `, [ys, ts]);

  await runQuery("Activation Rate", `
    select round(
      100.0 *
      count(*) filter (where first_api_request_at is not null)
      / nullif(count(*), 0), 2
    ) from profiles where role='user'
  `);

  console.log();

  // ── 4. Activity ───────────────────────────────────────────
  console.log("── 4. Activity ────────────────────────────────────────");

  await runQuery("Active Users Yesterday", `
    select count(*) from profiles
    where last_active_at >= $1
    and last_active_at < $2
  `, [ys, ts]);

  await runQuery("Active Users 7d", `
    select count(*) from profiles
    where last_active_at >= now() - interval '7 day'
  `);

  console.log();

  // ── 5. Revenue ────────────────────────────────────────────
  console.log("── 5. Revenue ─────────────────────────────────────────");

  await runQuery("Paying Users Total", `
    select count(distinct user_id) from transactions
    where type='recharge'
  `);

  await runQuery("New Paying Users Yesterday", `
    select count(*) from (
      select user_id, min(created_at) as first_recharge_at
      from transactions where type='recharge'
      group by user_id
    ) t
    where first_recharge_at >= $1
    and first_recharge_at < $2
  `, [ys, ts]);

  await runQuery("Revenue Yesterday", `
    select coalesce(sum(amount), 0) from transactions
    where type='recharge'
    and created_at >= $1 and created_at < $2
  `, [ys, ts]);

  await runQuery("Revenue MTD", `
    select coalesce(sum(amount), 0) from transactions
    where type='recharge'
    and date_trunc('month', created_at at time zone 'UTC')
      = date_trunc('month', (now() at time zone 'UTC'))
  `);

  await runQuery("Total Revenue", `
    select coalesce(sum(amount), 0) from transactions
    where type='recharge'
  `);

  console.log();

  // ── 6. Usage ──────────────────────────────────────────────
  console.log("── 6. Usage ───────────────────────────────────────────");

  await runQuery("API Calls Yesterday", `
    select count(*) from request_traces
    where created_at >= $1 and created_at < $2
  `, [ys, ts]);

  await runQuery("Active API Users Yesterday", `
    select count(distinct user_id) from request_traces
    where created_at >= $1 and created_at < $2
  `, [ys, ts]);

  await runQuery("Tokens In Yesterday", `
    select coalesce(sum(tokens_in), 0) from request_traces
    where created_at >= $1 and created_at < $2
  `, [ys, ts]);

  await runQuery("Tokens Out Yesterday", `
    select coalesce(sum(tokens_out), 0) from request_traces
    where created_at >= $1 and created_at < $2
  `, [ys, ts]);

  await runQuery("Total Tokens Yesterday", `
    select coalesce(sum(tokens_in), 0) + coalesce(sum(tokens_out), 0)
    from request_traces
    where created_at >= $1 and created_at < $2
  `, [ys, ts]);

  await runQuery("Cost USD Yesterday", `
    select round(coalesce(sum(cost_usd), 0), 4) from request_traces
    where created_at >= $1 and created_at < $2
  `, [ys, ts]);

  await runQuery("Error Rate Yesterday", `
    select round(
      100.0 * count(*) filter (where ok=false)
      / nullif(count(*), 0), 2
    ) from request_traces
    where created_at >= $1 and created_at < $2
  `, [ys, ts]);

  await runQuery("Cache Hit Rate Yesterday", `
    select round(
      100.0 * count(*) filter (where cache_hit=true)
      / nullif(count(*), 0), 2
    ) from request_traces
    where created_at >= $1 and created_at < $2
  `, [ys, ts]);

  console.log();

  // ── 7. Top Models ─────────────────────────────────────────
  console.log("── 7. Top Models ──────────────────────────────────────");

  await runQuery("Top Models (Top 10)", `
    with model_stats as (
      select model, count(*) as requests
      from request_traces
      where created_at >= $1 and created_at < $2
      group by model
    )
    select model, requests,
      round(100.0 * requests / sum(requests) over(), 2) as share_pct
    from model_stats
    order by requests desc
    limit 10
  `, [ys, ts]);

  console.log();

  // ── 8. Welcome Credit Economics ───────────────────────────
  console.log("── 8. Welcome Credit Economics ────────────────────────");

  await runQuery("Welcome Credit - Users Granted", `
    select count(distinct user_id) from credit_grants where kind='welcome'
  `);

  await runQuery("Welcome Credit - Total Granted", `
    select coalesce(sum(amount_usd), 0) from credit_grants where kind='welcome'
  `);

  await runQuery("Welcome Credit - Users Consumed", `
    select count(distinct cg.user_id)
    from credit_grants cg
    where cg.kind='welcome'
    and exists (
      select 1 from transactions t
      where t.user_id = cg.user_id and t.type='consume'
    )
  `);

  await runQuery("Welcome Credit - Consumption Amount", `
    select abs(coalesce(sum(t.amount), 0))
    from transactions t
    where t.type='consume'
    and exists (
      select 1 from credit_grants cg
      where cg.user_id=t.user_id and cg.kind='welcome'
    )
  `);

  await runQuery("Welcome Credit → Paid", `
    select count(distinct cg.user_id)
    from credit_grants cg
    where cg.kind='welcome'
    and exists (
      select 1 from transactions t
      where t.user_id=cg.user_id and t.type='recharge'
    )
  `);

  await runQuery("Welcome Credit - Total Reclaimed", `
    select coalesce(sum(reclaimed_amount), 0) from credit_grants where kind='welcome'
  `);

  await runQuery("Welcome Credit - Net Granted", `
    select coalesce(sum(amount_usd), 0) - coalesce(sum(reclaimed_amount), 0)
    from credit_grants where kind='welcome'
  `);

  await runQuery("Welcome Credit - Utilization Rate", `
    with granted as (
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
    from granted, consumed
  `);

  console.log();

  // ── 9. Referral ───────────────────────────────────────────
  console.log("── 9. Referral ────────────────────────────────────────");

  await runQuery("Referral Users Total", `
    select count(*) from profiles where referred_by is not null
  `);

  await runQuery("New Referral Users Yesterday", `
    select count(*) from profiles
    where referred_by is not null
    and created_at >= $1 and created_at < $2
  `, [ys, ts]);

  await runQuery("Referral Share", `
    select round(
      100.0 * count(*) filter (where referred_by is not null)
      / nullif(count(*), 0), 2
    ) from profiles
  `);

  console.log();
  console.log("=".repeat(60));
  console.log("测试完成");
  console.log("=".repeat(60));

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
