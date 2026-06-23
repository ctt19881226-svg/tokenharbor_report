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

  const yesterdayStart = `${reportDate}T00:00:00Z`;
  const todayEnd = `${isoToday(reportDate)}T00:00:00Z`;
  const generatedAt = new Date().toISOString();

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

  const summaryBlock =
    englishSummary && englishSummary.trim().length > 0
      ? englishSummary
      : "(See `executive_summary.txt` for the bilingual summary.)";

  // Yesterday snapshot computed rates
  const newUsers = Number(g.new_users_yesterday) || 0;
  const newVerified = Number(v.new_verified_users_yesterday) || 0;
  const newActivated = Number(a.new_activated_users_yesterday) || 0;
  const newReferral = Number(ref.new_referral_users_yesterday) || 0;

  const newVerifRate = newUsers > 0 ? ((newVerified / newUsers) * 100).toFixed(2) : "0.00";
  const newActivRate = newUsers > 0 ? ((newActivated / newUsers) * 100).toFixed(2) : "0.00";
  const newRefShare  = newUsers > 0 ? ((newReferral  / newUsers) * 100).toFixed(2) : "0.00";

  return `# Token Harbor Founder Daily Report

Report Date: ${reportDate}

Reporting Window:

${yesterdayStart}

↓

${todayEnd}

Generated At:

${generatedAt}

---

# Executive Summary

${summaryBlock}

(Full bilingual version: see \`executive_summary.txt\`.)

---

# Yesterday Snapshot

| Metric | Value |
|---|---|
| New Users | ${fmtNumber(g.new_users_yesterday)} |
| New Verified Users | ${fmtNumber(v.new_verified_users_yesterday)} |
| Verification Rate | ${newVerifRate}% |
| New Activated Users | ${fmtNumber(a.new_activated_users_yesterday)} |
| Activation Rate | ${newActivRate}% |
| Active Users Yesterday | ${fmtNumber(ac.active_users_yesterday)} |
| New Paying Users | ${fmtNumber(r.new_paying_users_yesterday)} |
| Revenue Yesterday | $${fmtMoney(r.revenue_yesterday)} |
| New Referral Users | ${fmtNumber(ref.new_referral_users_yesterday)} |
| Referral Share | ${newRefShare}% |

---

# Growth

| Metric | Value |
|---|---|
| Total Users | ${fmtNumber(g.total_users)} |
| New Users Yesterday | ${fmtNumber(g.new_users_yesterday)} |
| Valid Users | ${fmtNumber(g.valid_users)} |
| Valid User Rate | ${fmtPct(g.valid_user_rate)}% |

---

# Verification

| Metric | Value |
|---|---|
| Verified Users Total | ${fmtNumber(v.verified_users)} |
| New Verified Users Yesterday | ${fmtNumber(v.new_verified_users_yesterday)} |
| Verification Rate | ${fmtPct(v.verification_rate)}% |

---

# Activation

| Metric | Value |
|---|---|
| Activated Users | ${fmtNumber(a.activated_users_total)} |
| New Activated Users | ${fmtNumber(a.new_activated_users_yesterday)} |
| Activation Rate | ${fmtPct(a.activation_rate)}% |

---

# Activity

| Metric | Value |
|---|---|
| Active Users Yesterday | ${fmtNumber(ac.active_users_yesterday)} |
| Active Users 7d | ${fmtNumber(ac.active_users_7d)} |

---

# Revenue

| Metric | Value |
|---|---|
| Paying Users | ${fmtNumber(r.paying_users_total)} |
| New Paying Users | ${fmtNumber(r.new_paying_users_yesterday)} |
| Revenue Yesterday | $${fmtMoney(r.revenue_yesterday)} |
| Revenue MTD | $${fmtMoney(r.revenue_mtd)} |
| Total Revenue | $${fmtMoney(r.total_revenue)} |

---

# Usage

| Metric | Value |
|---|---|
| API Calls Yesterday | ${fmtNumber(u.api_calls_yesterday)} |
| Active API Users | ${fmtNumber(u.active_api_users)} |
| Tokens In | ${fmtNumber(u.tokens_in)} |
| Tokens Out | ${fmtNumber(u.tokens_out)} |
| Total Tokens | ${fmtNumber(u.total_tokens)} |
| Cost USD | $${fmtMoney(u.cost_usd)} |
| Error Rate | ${fmtPct(u.error_rate)}% |
| Cache Hit Rate | ${fmtPct(u.cache_hit_rate)}% |

---

# Welcome Credit Economics

| Metric | Value |
|---|---|
| Users Granted | ${fmtNumber(wc.users_granted)} |
| Total Granted | $${fmtMoney(wc.total_granted)} |
| Users Consumed Credit | ${fmtNumber(wc.users_consumed_credit)} |
| Credit Consumption Amount | $${fmtMoney(wc.credit_consumption_amount)} |
| Welcome Credit → Paid | ${fmtNumber(wc.welcome_credit_to_paid)} |
| Total Reclaimed | $${fmtMoney(wc.total_reclaimed)} |
| Net Granted | $${fmtMoney(wc.net_granted)} |
| Utilization Rate | ${fmtPct(wc.utilization_rate)}% |

---

# Referral

| Metric | Value |
|---|---|
| Referral Users Total | ${fmtNumber(ref.referral_users_total)} |
| New Referral Users Yesterday | ${fmtNumber(ref.new_referral_users_yesterday)} |
| Referral Share | ${fmtPct(ref.referral_share)}% |

---

# Website Traffic

| Metric | Value |
|---|---|
| Visitors Yesterday | ${fmtNumber(w.visitors_yesterday)} |
| Sessions Yesterday | ${fmtNumber(w.sessions_yesterday)} |
| Website Registrations | ${fmtNumber(w.website_registrations_yesterday)} |

## Traffic Sources (Top 5)

| Source | Share |
|---|---|
| (GA4 not yet connected) | - |

## Top Landing Pages

| Landing Page | Share |
|---|---|
| (GA4 not yet connected) | - |

---

# Top Models

| Rank | Model | Requests | Share |
|---|---|---|---|
${topModelsRows}

---

# Notes

Website Traffic metrics come from GA4 (not yet connected; values reported as 0).

Business Metrics come from Supabase.

Website Traffic and Business Metrics should not be interpreted as a single funnel because Token Harbor supports API-first onboarding flows.
`;
}

// ── 2. Executive Summary (中英双语 / 规则模板) ────────────
function renderExecutiveSummary(m, reportDate) {
  const g = m.growth || {};
  const a = m.activation || {};
  const r = m.revenue || {};
  const u = m.usage || {};
  const top = m.top_models || [];
  const ref = m.referral || {};
  const w = m.website || {};

  const top2 = top.slice(0, 2);
  const top2Share = top2.reduce((s, x) => s + Number(x.share_pct || 0), 0);
  const top2Names = top2.map((x) => x.model).join(" + ");

  const en = [
    `${fmtNumber(g.new_users_yesterday)} new users registered yesterday, bringing total users to ${fmtNumber(g.total_users)}.`,
    `${fmtNumber(a.new_activated_users_yesterday)} users activated for the first time (activation rate ${fmtPct(a.activation_rate)}%).`,
    Number(r.new_paying_users_yesterday) > 0
      ? `Revenue increased by $${fmtMoney(r.revenue_yesterday)} from ${fmtNumber(r.new_paying_users_yesterday)} new paying user(s); revenue MTD $${fmtMoney(r.revenue_mtd)}.`
      : `No new paying users yesterday; revenue MTD $${fmtMoney(r.revenue_mtd)}.`,
    `${fmtNumber(u.api_calls_yesterday)} API calls, ${fmtNumber(u.total_tokens)} tokens, cost $${fmtMoney(u.cost_usd)} (error rate ${fmtPct(u.error_rate)}%).`,
    top2.length
      ? `${top2Names} accounted for ${fmtPct(top2Share)}% of all requests.`
      : `No model usage recorded yesterday.`,
    `Referrals contributed ${fmtNumber(ref.new_referral_users_yesterday)} of new users (overall referral share ${fmtPct(ref.referral_share)}%).`,
  ];

  const cn = [
    `昨日新增用户 ${fmtNumber(g.new_users_yesterday)},总用户数达到 ${fmtNumber(g.total_users)}。`,
    `${fmtNumber(a.new_activated_users_yesterday)} 名用户首次激活(激活率 ${fmtPct(a.activation_rate)}%)。`,
    Number(r.new_paying_users_yesterday) > 0
      ? `新增 ${fmtNumber(r.new_paying_users_yesterday)} 名付费用户,昨日收入 $${fmtMoney(r.revenue_yesterday)},月度累计 $${fmtMoney(r.revenue_mtd)}。`
      : `昨日无新增付费用户,月度累计收入 $${fmtMoney(r.revenue_mtd)}。`,
    `API 调用 ${fmtNumber(u.api_calls_yesterday)} 次,消耗 ${fmtNumber(u.total_tokens)} tokens,成本 $${fmtMoney(u.cost_usd)}(错误率 ${fmtPct(u.error_rate)}%)。`,
    top2.length
      ? `${top2Names} 合计占据 ${fmtPct(top2Share)}% 的请求量。`
      : `昨日无模型调用记录。`,
    `推荐渠道带来 ${fmtNumber(ref.new_referral_users_yesterday)} 名新用户(整体推荐占比 ${fmtPct(ref.referral_share)}%)。`,
  ];

  return `Token Harbor Executive Summary — ${reportDate}

[English]
${en.map((s) => `• ${s}`).join("\n")}

[中文]
${cn.map((s) => `• ${s}`).join("\n")}
`;
}

// ── 2.5 Claude API call (with fallback) ──────────────────
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
- Focus on meaningful changes; avoid restating every metric
- Highlight anomalies and trends
- Priority order: Growth, Activation, Revenue, Usage, Top Models, Referral, Website Traffic
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

// ── 3. CSV (founder_metrics.csv schema) ──────────────────
const CSV_COLUMNS = [
  "date",
  "total_users", "new_users",
  "valid_users", "valid_user_rate",
  "verified_users", "verification_rate",
  "activated_users", "new_activated_users", "activation_rate",
  "active_users_yesterday", "active_users_7d",
  "paying_users", "new_paying_users",
  "revenue_yesterday", "revenue_mtd", "total_revenue",
  "api_calls", "active_api_users",
  "tokens_in", "tokens_out", "total_tokens",
  "cost_usd",
  "error_rate", "cache_hit_rate",
  "users_granted", "total_granted",
  "users_consumed_credit", "credit_consumption_amount",
  "welcome_credit_to_paid",
  "total_reclaimed", "net_granted", "utilization_rate",
  "referral_users", "new_referral_users", "referral_share",
  "visitors", "sessions", "website_registrations",
];

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

  const num = (x) => (x === null || x === undefined ? 0 : x);

  return {
    date: reportDate,
    total_users: num(g.total_users),
    new_users: num(g.new_users_yesterday),
    valid_users: num(g.valid_users),
    valid_user_rate: num(g.valid_user_rate),
    verified_users: num(v.verified_users),
    verification_rate: num(v.verification_rate),
    activated_users: num(a.activated_users_total),
    new_activated_users: num(a.new_activated_users_yesterday),
    activation_rate: num(a.activation_rate),
    active_users_yesterday: num(ac.active_users_yesterday),
    active_users_7d: num(ac.active_users_7d),
    paying_users: num(r.paying_users_total),
    new_paying_users: num(r.new_paying_users_yesterday),
    revenue_yesterday: num(r.revenue_yesterday),
    revenue_mtd: num(r.revenue_mtd),
    total_revenue: num(r.total_revenue),
    api_calls: num(u.api_calls_yesterday),
    active_api_users: num(u.active_api_users),
    tokens_in: num(u.tokens_in),
    tokens_out: num(u.tokens_out),
    total_tokens: num(u.total_tokens),
    cost_usd: num(u.cost_usd),
    error_rate: num(u.error_rate),
    cache_hit_rate: num(u.cache_hit_rate),
    users_granted: num(wc.users_granted),
    total_granted: num(wc.total_granted),
    users_consumed_credit: num(wc.users_consumed_credit),
    credit_consumption_amount: num(wc.credit_consumption_amount),
    welcome_credit_to_paid: num(wc.welcome_credit_to_paid),
    total_reclaimed: num(wc.total_reclaimed),
    net_granted: num(wc.net_granted),
    utilization_rate: num(wc.utilization_rate),
    referral_users: num(ref.referral_users_total),
    new_referral_users: num(ref.new_referral_users_yesterday),
    referral_share: num(ref.referral_share),
    visitors: num(w.visitors_yesterday),
    sessions: num(w.sessions_yesterday),
    website_registrations: num(w.website_registrations_yesterday),
  };
}

function rowToCsvLine(row) {
  return CSV_COLUMNS.map((c) => row[c]).join(",");
}

function writeSingleDayCsv(filePath, row) {
  const header = CSV_COLUMNS.join(",");
  const line = rowToCsvLine(row);
  fs.writeFileSync(filePath, `${header}\n${line}\n`, "utf8");
}

// 追加/更新历史 CSV:同日期则替换,否则追加;最后按日期升序排序
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

  if (lines.length === 0) {
    dataRows = [];
  } else {
    // 跳过 header
    dataRows = lines.slice(1).filter((l) => l.trim().length > 0);
  }

  // 移除同日期的旧行
  dataRows = dataRows.filter((l) => {
    const firstCol = l.split(",")[0];
    return firstCol !== row.date;
  });

  // 追加新行
  dataRows.push(rowToCsvLine(row));

  // 按 date 升序
  dataRows.sort((a, b) => {
    const da = a.split(",")[0];
    const db = b.split(",")[0];
    return da < db ? -1 : da > db ? 1 : 0;
  });

  fs.writeFileSync(filePath, `${header}\n${dataRows.join("\n")}\n`, "utf8");
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
