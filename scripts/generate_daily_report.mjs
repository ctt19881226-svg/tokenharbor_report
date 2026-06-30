/**
 * generate_daily_report.mjs
 *
 * 读取 /reports/daily/{report_date}/daily_metrics.json
 * 生成:
 *   - daily_report.md         (Markdown 日报)
 *   - executive_summary.txt   (中英双语规则模板)
 *   - daily_metrics.csv       (当日单行,本目录下)
 * 并追加/更新:
 *   - /reports/founder_metrics.csv  (历史时序,按日期唯一)
 *
 * 用法:
 *   node scripts/generate_daily_report.mjs              # 默认昨日 (UTC)
 *   node scripts/generate_daily_report.mjs 2026-06-21   # 指定日期
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// ── 时间窗口 (UTC 自然日) ─────────────────────────────────
function getReportDate(arg) {
  if (arg && /^\d{4}-\d{2}-\d{2}$/.test(arg)) return arg;
  const now = new Date();
  const yesterdayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)
  );
  return yesterdayUTC.toISOString().slice(0, 10);
}

function isoToday(reportDate) {
  // reportDate = yesterday; today = reportDate + 1
  const d = new Date(reportDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ── 工具 ─────────────────────────────────────────────────
function fmtNumber(n) {
  if (n === null || n === undefined) return "0";
  if (typeof n !== "number") return String(n);
  return Number.isInteger(n) ? n.toLocaleString("en-US") : n.toString();
}
function fmtMoney(n) {
  const v = Number(n ?? 0);
  return v.toFixed(2);
}
function fmtPct(n) {
  const v = Number(n ?? 0);
  return v.toFixed(2);
}

// ── 1. Daily Report Markdown ─────────────────────────────
// 从完整双语摘要中提取 [English] 段(到下一个 [ 标签或文末为止)
function extractEnglishSummary(summaryText) {
  if (!summaryText) return "";
  const lines = summaryText.split(/\r?\n/);
  const out = [];
  let inEn = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === "[English]") {
      inEn = true;
      continue;
    }
    if (inEn && /^\[.+\]$/.test(t)) {
      // 进入下一个语言段(如 [中文]),停止
      break;
    }
    if (inEn) out.push(line);
  }
  // 去掉首尾空行
  while (out.length && out[0].trim() === "") out.shift();
  while (out.length && out[out.length - 1].trim() === "") out.pop();
  return out.join("\n");
}

function renderMarkdown(m, reportDate, englishSummary) {
  const g = m.growth || {};
  const v = m.verification || {};
  const a = m.activation || {};
  const ac = m.activity || {};
  const r = m.revenue || {};
  const u = m.usage || {};
  const wc = m.welcome_credit || {};
  const ref = m.referral || {};
  const w = m.website || {};
  const top = m.top_models || [];
  const tho = m.th_orchestra || {};
  const routed = tho.top_routed_models || [];
  const dsf = m.free_deepseek || {};

  const topModelsRows = top.length
    ? top
        .map(
          (row, i) =>
            `| ${i + 1} | ${row.model} | ${fmtNumber(row.requests)} | ${fmtPct(
              row.share_pct
            )}% |`
        )
        .join("\n")
    : "| - | (no data) | 0 | 0% |";

  const orchestraRows = routed.length
    ? routed
        .map(
          (row, i) =>
            `| ${i + 1} | ${row.upstream_model} | ${fmtNumber(row.requests)} | ${fmtPct(
              row.share_pct
            )}% |`
        )
        .join("\n")
    : "| - | (no data) | 0 | 0% |";

  const totalUsers = Number(g.total_users) || 0;
  const verifiedUsers = Number(v.verified_users) || 0;
  const activatedUsers = Number(a.activated_users_total) || 0;
  const creditUsers = Number(wc.users_granted) || 0;
  const payingUsers = Number(r.paying_users_total) || 0;

  const verificationRate = totalUsers > 0 ? (100 * verifiedUsers) / totalUsers : 0;
  const activationRate = totalUsers > 0 ? (100 * activatedUsers) / totalUsers : 0;
  const creditClaimRate = totalUsers > 0 ? (100 * creditUsers) / totalUsers : 0;
  const payUserRate = totalUsers > 0 ? (100 * payingUsers) / totalUsers : 0;

  const newCreditUsers = wc.new_users_granted_yesterday ?? 0;
  const freeCreditsUsedYesterday = wc.credit_consumption_amount_yesterday ?? 0;

  const summaryBlock =
    englishSummary && englishSummary.trim().length > 0
      ? englishSummary
      : "- No executive summary was generated.";

  return `# Executive Summary

${summaryBlock}

---

# Business KPIs

| Current State | Value | Yesterday | Value |
| --- | ---: | --- | ---: |
| Total Registered Users | ${fmtNumber(g.total_users)} | New Registered Users | ${fmtNumber(g.new_users_yesterday)} |
| Total Verified Users | ${fmtNumber(v.verified_users)} | New Verified Users | ${fmtNumber(v.new_verified_users_yesterday)} |
| Verification Rate | ${fmtPct(verificationRate)}% | | |
| Total Activated Users | ${fmtNumber(a.activated_users_total)} | New Activated Users | ${fmtNumber(a.new_activated_users_yesterday)} |
| Activation Rate | ${fmtPct(activationRate)}% | | |
| Total Users Claimed $5 Credit | ${fmtNumber(wc.users_granted)} | New Users Claimed $5 Credit | ${fmtNumber(newCreditUsers)} |
| Credit Claim Rate | ${fmtPct(creditClaimRate)}% | | |
| Total Free Credits Used | $${fmtMoney(wc.credit_consumption_amount)} | Free Credits Used Yesterday | $${fmtMoney(freeCreditsUsedYesterday)} |
| Total Paying Users | ${fmtNumber(r.paying_users_total)} | New Paying Users | ${fmtNumber(r.new_paying_users_yesterday)} |
| Pay User Rate | ${fmtPct(payUserRate)}% | | |
| Total Top-ups | $${fmtMoney(r.total_revenue)} | Top-ups Yesterday | $${fmtMoney(r.revenue_yesterday)} |

---

# Usage

| Metric | Value |
| --- | ---: |
| Active Users Yesterday | ${fmtNumber(ac.active_users_yesterday)} |
| Active Users (7d) | ${fmtNumber(ac.active_users_7d)} |
| API Requests Yesterday | ${fmtNumber(u.api_calls_yesterday)} |
| Tokens In | ${fmtNumber(u.tokens_in)} |
| Tokens Out | ${fmtNumber(u.tokens_out)} |
| Total Tokens | ${fmtNumber(u.total_tokens)} |
| Estimated Cost | $${fmtMoney(u.cost_usd)} |
| Error Rate | ${fmtPct(u.error_rate)}% |
| Cache Hit Rate | ${fmtPct(u.cache_hit_rate)}% |

---

# Models

## Top User-Selected Models

| Rank | Model | Requests | Share |
| --- | --- | ---: | ---: |
${topModelsRows}

---

## TH Orchestra

| Metric | Value |
| --- | ---: |
| Requests | ${fmtNumber(tho.requests)} |
| Request Share | ${fmtPct(tho.request_share)}% |
| Users | ${fmtNumber(tho.users)} |
| User Adoption | ${fmtPct(tho.user_adoption)}% |

### Top Routed Models

| Rank | Upstream Model | Requests | Share |
| --- | --- | ---: | ---: |
${orchestraRows}

---

# Free DeepSeek V4 Flash

| Metric | Value |
| --- | ---: |
| Requests | ${fmtNumber(dsf.requests)} |
| Request Share | ${fmtPct(dsf.request_share)}% |
| Users | ${fmtNumber(dsf.users)} |
| User Share | ${fmtPct(dsf.user_share)}% |
| Tokens | ${fmtNumber(dsf.tokens)} |
| Estimated Cost | $${fmtMoney(dsf.estimated_cost)} |

---

# Welcome Credit Economics

| Metric | Value |
| --- | ---: |
| Users Granted | ${fmtNumber(wc.users_granted)} |
| Total Granted | $${fmtMoney(wc.total_granted)} |
| Users Consumed Credit | ${fmtNumber(wc.users_consumed_credit)} |
| Credit Consumption Amount | $${fmtMoney(wc.credit_consumption_amount)} |
| Welcome Credit -> Paid | ${fmtNumber(wc.welcome_credit_to_paid)} |
| Total Reclaimed | $${fmtMoney(wc.total_reclaimed)} |
| Net Granted | $${fmtMoney(wc.net_granted)} |
| Utilization Rate | ${fmtPct(wc.utilization_rate)}% |

---

# Referral

| Metric | Value |
| --- | ---: |
| Referral Users Total | ${fmtNumber(ref.referral_users_total)} |
| Referral Share | ${fmtPct(ref.referral_share)}% |
| New Referral Users Yesterday | ${fmtNumber(ref.new_referral_users_yesterday)} |

---

# User Quality

| Metric | Value |
| --- | ---: |
| Total Users | ${fmtNumber(g.total_users)} |
| Valid Users | ${fmtNumber(g.valid_users)} |
| Valid User Rate | ${fmtPct(g.valid_user_rate)}% |

---

# Website Traffic

| Metric | Value |
| --- | ---: |
| Visitors Yesterday | ${fmtNumber(w.visitors_yesterday)} |
| Sessions Yesterday | ${fmtNumber(w.sessions_yesterday)} |
| Website Registrations | ${fmtNumber(w.website_registrations_yesterday)} |

## Traffic Sources (Top 5)

| Source | Share |
| --- | ---: |
| (GA4 not yet connected) | - |

## Top Landing Pages

| Landing Page | Share |
| --- | ---: |
| (GA4 not yet connected) | - |

---

# Notes

- Business KPIs come from Supabase.
- Usage metrics exclude internal accounts where profiles.is_system = true.
- Top User-Selected Models exclude TH Orchestra and internal routing models.
- TH Orchestra is tracked as a separate product capability.
- Free DeepSeek V4 Flash usage is defined as model='deepseek-v4-flash' AND cost_usd=0.
- User Quality metrics are internal operational metrics and may not align with historical credit-claim counts because fraud controls were introduced after launch.
- Website Traffic metrics come from GA4 and are currently unavailable.
- Token Harbor supports API-first onboarding, so Website Traffic and Business KPIs should not be interpreted as a single funnel.
`;
}
function renderExecutiveSummary(m, reportDate) {
  const g = m.growth || {};
  const v = m.verification || {};
  const a = m.activation || {};
  const r = m.revenue || {};
  const u = m.usage || {};
  const top = m.top_models || [];
  const tho = m.th_orchestra || {};
  const dsf = m.free_deepseek || {};

  const topModel = top[0]
    ? `${top[0].model} (${fmtNumber(top[0].requests)} requests, ${fmtPct(top[0].share_pct)}%)`
    : "no user-selected model usage recorded";

  const en = [
    `${fmtNumber(g.new_users_yesterday)} new registered users; total registered users reached ${fmtNumber(g.total_users)}.`,
    `${fmtNumber(v.new_verified_users_yesterday)} new verified users; total verified users reached ${fmtNumber(v.verified_users)}.`,
    `${fmtNumber(a.new_activated_users_yesterday)} new activated users; total activated users reached ${fmtNumber(a.activated_users_total)}.`,
    `${fmtNumber(r.new_paying_users_yesterday)} new paying users; top-ups yesterday were $${fmtMoney(r.revenue_yesterday)} and total top-ups were $${fmtMoney(r.total_revenue)}.`,
    `${fmtNumber(u.api_calls_yesterday)} API requests, ${fmtNumber(u.total_tokens)} total tokens, and estimated cost of $${fmtMoney(u.cost_usd)}.`,
    `Top user-selected model: ${topModel}.`,
    `TH Orchestra recorded ${fmtNumber(tho.requests)} requests from ${fmtNumber(tho.users)} user(s).`,
    `Free DeepSeek V4 Flash recorded ${fmtNumber(dsf.requests)} requests, ${fmtNumber(dsf.tokens)} tokens, and estimated cost of $${fmtMoney(dsf.estimated_cost)}.`,
  ];

  const cn = [
    `昨日新增注册用户 ${fmtNumber(g.new_users_yesterday)}，总注册用户 ${fmtNumber(g.total_users)}。`,
    `昨日新增验证用户 ${fmtNumber(v.new_verified_users_yesterday)}，总验证用户 ${fmtNumber(v.verified_users)}。`,
    `昨日新增激活用户 ${fmtNumber(a.new_activated_users_yesterday)}，总激活用户 ${fmtNumber(a.activated_users_total)}。`,
    `昨日新增付费用户 ${fmtNumber(r.new_paying_users_yesterday)}，昨日充值 $${fmtMoney(r.revenue_yesterday)}，累计充值 $${fmtMoney(r.total_revenue)}。`,
    `昨日 API 请求 ${fmtNumber(u.api_calls_yesterday)} 次，总 tokens ${fmtNumber(u.total_tokens)}，预估成本 $${fmtMoney(u.cost_usd)}。`,
    `Top User-Selected Model: ${topModel}。`,
    `TH Orchestra 请求 ${fmtNumber(tho.requests)} 次，使用用户 ${fmtNumber(tho.users)}。`,
    `Free DeepSeek V4 Flash 请求 ${fmtNumber(dsf.requests)} 次，tokens ${fmtNumber(dsf.tokens)}，预估成本 $${fmtMoney(dsf.estimated_cost)}。`,
  ];

  return `Token Harbor Executive Summary - ${reportDate}

[English]
${en.map((s) => `- ${s}`).join("\n")}

[中文]
${cn.map((s) => `- ${s}`).join("\n")}
`;
}

// -- 2.5 Claude API call (with fallback)
const ANTHROPIC_BASE_URL =
  process.env.ANTHROPIC_BASE_URL || "https://tokenharbor.ai";
const ANTHROPIC_AUTH_TOKEN =
  process.env.ANTHROPIC_AUTH_TOKEN ||
  "thk_live_O6mNhuQUEORl2fVIAPUwUfhc9MoOT-A-8mqZ3U9wTq4rMMqYcsy4Cp12_xyVKNkn";
const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || "claude-sonnet-4-6";

async function callClaudeForSummary(metrics, reportDate, fallbackSummary) {
  const prompt = `You are the Token Harbor founder analyst. Produce a bilingual executive summary for the daily report dated ${reportDate}.

Requirements:
- 3 to 5 bullets per language section
- Maximum 120 words per language section
- Be factual and data-driven; do not speculate about causes
- Summarize only factual changes from the metrics
- Priority order: Business KPIs, Usage, Models, TH Orchestra, Free DeepSeek V4 Flash, Welcome Credit Economics, Referral, User Quality, Website Traffic
- Note: Website Traffic comes from GA4 (not yet connected, values are 0) — do NOT comment on website traffic as a real signal.

Output format MUST be exactly (no extra commentary, no code fences):

Token Harbor Executive Summary — ${reportDate}

[English]
• ...
• ...
• ...

[中文]
• ...
• ...
• ...

Metrics JSON:
${JSON.stringify(metrics, null, 2)}
`;

  const url = `${ANTHROPIC_BASE_URL.replace(/\/$/, "")}/v1/messages`;
  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_AUTH_TOKEN,
        authorization: `Bearer ${ANTHROPIC_AUTH_TOKEN}`,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (!text || typeof text !== "string") {
      throw new Error("Empty content in API response");
    }
    return { text: text.trim() + "\n", source: "claude" };
  } catch (err) {
    console.warn(
      `⚠️  Claude API 调用失败,回退到规则模板: ${err.message}`
    );
    return { text: fallbackSummary, source: "fallback" };
  } finally {
    clearTimeout(timer);
  }
}

// -- 3. CSV (founder_metrics.csv schema)
const CSV_COLUMNS = [
  "date",
  "total_users",
  "new_users",
  "valid_users",
  "valid_user_rate",
  "verified_users",
  "verification_rate",
  "new_verified_users",
  "new_verification_rate_day",
  "activated_users",
  "activation_rate",
  "new_activated_users",
  "new_activation_rate_day",
  "active_users_yesterday",
  "active_users_7d",
  "referral_users",
  "referral_share",
  "new_referral_users",
  "referral_share_day",
  "paying_users",
  "new_paying_users",
  "revenue_yesterday",
  "revenue_mtd",
  "total_revenue",
  "api_calls",
  "active_api_users",
  "orchestra_requests",
  "orchestra_request_share",
  "orchestra_users",
  "orchestra_user_adoption",
  "tokens_in",
  "tokens_out",
  "total_tokens",
  "cost_usd",
  "error_rate",
  "cache_hit_rate",
  "users_granted",
  "new_users_granted_yesterday",
  "total_granted",
  "users_consumed_credit",
  "credit_consumption_amount",
  "credit_consumption_amount_yesterday",
  "welcome_credit_to_paid",
  "total_reclaimed",
  "net_granted",
  "utilization_rate",
  "free_deepseek_requests",
  "free_deepseek_request_share",
  "free_deepseek_users",
  "free_deepseek_user_share",
  "free_deepseek_tokens",
  "free_deepseek_estimated_cost",
  "visitors",
  "sessions",
  "website_registrations",
];

function pct(part, total) {
  return total > 0 ? Number(((part / total) * 100).toFixed(2)) : 0;
}

function buildCsvRow(m, reportDate) {
  const g = m.growth || {};
  const v = m.verification || {};
  const a = m.activation || {};
  const ac = m.activity || {};
  const r = m.revenue || {};
  const u = m.usage || {};
  const wc = m.welcome_credit || {};
  const ref = m.referral || {};
  const w = m.website || {};
  const tho = m.th_orchestra || {};
  const dsf = m.free_deepseek || {};

  const num = (x) => (x === null || x === undefined ? 0 : x);
  const newUsers = Number(g.new_users_yesterday) || 0;
  const newVerified = Number(v.new_verified_users_yesterday) || 0;
  const newActivated = Number(a.new_activated_users_yesterday) || 0;
  const newReferral = Number(ref.new_referral_users_yesterday) || 0;

  return {
    date: reportDate,
    total_users: num(g.total_users),
    new_users: num(g.new_users_yesterday),
    valid_users: num(g.valid_users),
    valid_user_rate: num(g.valid_user_rate),
    verified_users: num(v.verified_users),
    verification_rate: num(v.verification_rate),
    new_verified_users: num(v.new_verified_users_yesterday),
    new_verification_rate_day: pct(newVerified, newUsers),
    activated_users: num(a.activated_users_total),
    activation_rate: num(a.activation_rate),
    new_activated_users: num(a.new_activated_users_yesterday),
    new_activation_rate_day: pct(newActivated, newUsers),
    active_users_yesterday: num(ac.active_users_yesterday),
    active_users_7d: num(ac.active_users_7d),
    referral_users: num(ref.referral_users_total),
    referral_share: num(ref.referral_share),
    new_referral_users: num(ref.new_referral_users_yesterday),
    referral_share_day: pct(newReferral, newUsers),
    paying_users: num(r.paying_users_total),
    new_paying_users: num(r.new_paying_users_yesterday),
    revenue_yesterday: num(r.revenue_yesterday),
    revenue_mtd: num(r.revenue_mtd),
    total_revenue: num(r.total_revenue),
    api_calls: num(u.api_calls_yesterday),
    active_api_users: num(u.active_api_users),
    orchestra_requests: num(tho.requests),
    orchestra_request_share: num(tho.request_share),
    orchestra_users: num(tho.users),
    orchestra_user_adoption: num(tho.user_adoption),
    tokens_in: num(u.tokens_in),
    tokens_out: num(u.tokens_out),
    total_tokens: num(u.total_tokens),
    cost_usd: num(u.cost_usd),
    error_rate: num(u.error_rate),
    cache_hit_rate: num(u.cache_hit_rate),
    users_granted: num(wc.users_granted),
    new_users_granted_yesterday: num(wc.new_users_granted_yesterday),
    total_granted: num(wc.total_granted),
    users_consumed_credit: num(wc.users_consumed_credit),
    credit_consumption_amount: num(wc.credit_consumption_amount),
    credit_consumption_amount_yesterday: num(wc.credit_consumption_amount_yesterday),
    welcome_credit_to_paid: num(wc.welcome_credit_to_paid),
    total_reclaimed: num(wc.total_reclaimed),
    net_granted: num(wc.net_granted),
    utilization_rate: num(wc.utilization_rate),
    free_deepseek_requests: num(dsf.requests),
    free_deepseek_request_share: num(dsf.request_share),
    free_deepseek_users: num(dsf.users),
    free_deepseek_user_share: num(dsf.user_share),
    free_deepseek_tokens: num(dsf.tokens),
    free_deepseek_estimated_cost: num(dsf.estimated_cost),
    visitors: num(w.visitors_yesterday),
    sessions: num(w.sessions_yesterday),
    website_registrations: num(w.website_registrations_yesterday),
  };
}

function rowToCsvLine(row) {
  return CSV_COLUMNS.map((c) => row[c] ?? 0).join(",");
}

function rowFromCsvLine(headers, line) {
  const values = line.split(",");
  const row = {};
  headers.forEach((header, i) => {
    row[header] = values[i];
  });

  row.verification_rate ??= row.verification_rate_total;
  row.activation_rate ??= row.activation_rate_total;
  row.referral_share ??= row.referral_share_total;

  const newUsers = Number(row.new_users) || 0;
  const newVerified = Number(row.new_verified_users) || 0;
  const newActivated = Number(row.new_activated_users) || 0;
  const newReferral = Number(row.new_referral_users) || 0;
  row.new_verification_rate_day = pct(newVerified, newUsers);
  row.new_activation_rate_day = pct(newActivated, newUsers);
  row.referral_share_day = pct(newReferral, newUsers);

  return row;
}

function writeSingleDayCsv(filePath, row) {
  const header = CSV_COLUMNS.join(",");
  const line = rowToCsvLine(row);
  fs.writeFileSync(filePath, header + "\n" + line + "\n", "utf8");
}

function upsertHistoricalCsv(filePath, row) {
  let lines = [];
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8").trim();
    if (content.length > 0) {
      lines = content.split(/\r?\n/);
    }
  }

  const header = CSV_COLUMNS.join(",");
  let dataRows = [];

  if (lines.length > 0) {
    const existingHeader = lines[0].split(",");
    dataRows = lines
      .slice(1)
      .filter((l) => l.trim().length > 0)
      .map((line) => rowToCsvLine(rowFromCsvLine(existingHeader, line)));
  }

  dataRows = dataRows.filter((l) => {
    const firstCol = l.split(",")[0];
    return firstCol !== row.date;
  });

  dataRows.push(rowToCsvLine(row));

  dataRows.sort((a, b) => {
    const da = a.split(",")[0];
    const db = b.split(",")[0];
    return da < db ? -1 : da > db ? 1 : 0;
  });

  fs.writeFileSync(filePath, header + "\n" + dataRows.join("\n") + "\n", "utf8");
}

// ── Main ────────────────────────────────────────────────
async function main() {
  const reportDate = getReportDate(process.argv[2]);
  const dailyDir = path.join(PROJECT_ROOT, "reports", "daily", reportDate);
  const jsonPath = path.join(dailyDir, "daily_metrics.json");

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ 找不到 ${jsonPath}`);
    console.error(`   请先运行: node scripts/fetch_supabase.mjs ${reportDate}`);
    process.exit(1);
  }

  const metrics = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  const mdPath = path.join(dailyDir, "daily_report.md");
  const summaryPath = path.join(dailyDir, "executive_summary.txt");
  const dayCsvPath = path.join(dailyDir, "daily_metrics.csv");
  const histCsvPath = path.join(PROJECT_ROOT, "reports", "founder_metrics.csv");

  // 1) executive_summary.txt
  //    优先用 Claude API 生成,失败时回退到规则模板(双语保留)
  const fallbackSummary = renderExecutiveSummary(metrics, reportDate);
  const { text: summaryText, source: summarySource } =
    await callClaudeForSummary(metrics, reportDate, fallbackSummary);
  fs.writeFileSync(summaryPath, summaryText, "utf8");

  // 2) daily_report.md (只嵌入英文版摘要)
  const englishSummary = extractEnglishSummary(summaryText);
  fs.writeFileSync(
    mdPath,
    renderMarkdown(metrics, reportDate, englishSummary),
    "utf8"
  );

  // 3) daily_metrics.csv (单日单行)
  const csvRow = buildCsvRow(metrics, reportDate);
  writeSingleDayCsv(dayCsvPath, csvRow);

  // 4) founder_metrics.csv (历史)
  upsertHistoricalCsv(histCsvPath, csvRow);

  console.log("=".repeat(60));
  console.log(`Token Harbor Daily Report Generator`);
  console.log(`report_date = ${reportDate}`);
  console.log(`summary     = ${summarySource} (${ANTHROPIC_MODEL})`);
  console.log("=".repeat(60));
  console.log(`✅ ${mdPath}`);
  console.log(`✅ ${summaryPath}`);
  console.log(`✅ ${dayCsvPath}`);
  console.log(`✅ ${histCsvPath} (upserted)`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
