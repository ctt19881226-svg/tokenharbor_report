/**
 * send_email.mjs
 *
 * 发送 Token Harbor 日报邮件 (Resend)
 *
 * - 收件人: ctt19881226@gmail.com
 * - 正文:   Executive Summary + Growth + Revenue + Usage 三个核心 section
 * - 附件:   daily_report.md / executive_summary.txt / daily_metrics.json / daily_metrics.csv
 *
 * 用法:
 *   node scripts/send_email.mjs              # 默认昨日 (UTC)
 *   node scripts/send_email.mjs 2026-06-21   # 指定日期
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// ── 配置 ──────────────────────────────────────────────────
const RESEND_API_KEY =
  process.env.RESEND_API_KEY || "re_RC6ehhez_7HxNyHZyr8Udt4BVBN5mSR8W";
// Resend 沙箱发件人,无需域名验证即可发送
const FROM =
  process.env.REPORT_FROM || "Token Harbor <onboarding@resend.dev>";
const TO = process.env.REPORT_TO || "ctt19881226@gmail.com";

// ── 工具 ──────────────────────────────────────────────────
function getReportDate(arg) {
  if (arg && /^\d{4}-\d{2}-\d{2}$/.test(arg)) return arg;
  const now = new Date();
  const y = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)
  );
  return y.toISOString().slice(0, 10);
}

// 从 markdown 抽取指定 H1 section (到下一个 H1 / 文末)
function extractSection(md, heading) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let inSection = false;
  for (const line of lines) {
    if (/^# /.test(line)) {
      if (line.trim() === `# ${heading}`) {
        inSection = true;
        out.push(line);
        continue;
      } else if (inSection) {
        break;
      }
    } else if (inSection) {
      out.push(line);
    }
  }
  // 去掉末尾的空行 / 分隔线
  while (
    out.length &&
    (out[out.length - 1].trim() === "" ||
      out[out.length - 1].trim() === "---")
  ) {
    out.pop();
  }
  return out.join("\n");
}

// 简易 Markdown -> HTML(支持 H1/H2 / 段落 / 列表 / 表格 / 分隔线)
function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let tableRows = [];
  let inTable = false;
  let inList = false;

  function flushTable() {
    if (tableRows.length === 0) return;
    const header = tableRows[0];
    const body = tableRows.slice(2); // skip header row + separator
    out.push(
      "<table style=\"border-collapse:collapse;margin:8px 0;font-size:14px;\">"
    );
    out.push("<thead><tr>");
    for (const cell of header) {
      out.push(
        `<th style="border:1px solid #d0d7de;padding:6px 12px;background:#f6f8fa;text-align:left;">${cell}</th>`
      );
    }
    out.push("</tr></thead><tbody>");
    for (const row of body) {
      out.push("<tr>");
      for (const cell of row) {
        out.push(
          `<td style="border:1px solid #d0d7de;padding:6px 12px;">${cell}</td>`
        );
      }
      out.push("</tr>");
    }
    out.push("</tbody></table>");
    tableRows = [];
  }

  function flushList() {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  }

  for (const raw of lines) {
    const line = raw.trim();

    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line.slice(1, -1).split("|").map((s) => s.trim());
      tableRows.push(cells);
      inTable = true;
      continue;
    } else if (inTable) {
      flushTable();
      inTable = false;
    }

    if (line.startsWith("# ")) {
      flushList();
      out.push(
        `<h2 style="margin:18px 0 8px;color:#24292f;font-size:18px;">${line.slice(
          2
        )}</h2>`
      );
    } else if (line.startsWith("## ")) {
      flushList();
      out.push(
        `<h3 style="margin:14px 0 6px;color:#24292f;font-size:15px;">${line.slice(
          3
        )}</h3>`
      );
    } else if (
      line.startsWith("• ") ||
      line.startsWith("- ") ||
      line.startsWith("* ")
    ) {
      if (!inList) {
        out.push("<ul style=\"margin:6px 0 6px 18px;padding:0;\">");
        inList = true;
      }
      const item = line.replace(/^[•\-\*]\s+/, "");
      // 简单加粗 **xx**
      const itemHtml = item.replace(
        /\*\*([^*]+)\*\*/g,
        "<strong>$1</strong>"
      );
      out.push(`<li style="margin:2px 0;">${itemHtml}</li>`);
    } else if (line === "---") {
      flushList();
      out.push("<hr style=\"border:none;border-top:1px solid #d0d7de;margin:16px 0;\"/>");
    } else if (line === "") {
      flushList();
    } else {
      flushList();
      const html = line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      out.push(`<p style="margin:6px 0;font-size:14px;">${html}</p>`);
    }
  }
  flushTable();
  flushList();
  return out.join("\n");
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  const reportDate = getReportDate(process.argv[2]);
  const dailyDir = path.join(PROJECT_ROOT, "reports", "daily", reportDate);
  const mdPath = path.join(dailyDir, "daily_report.md");
  const summaryPath = path.join(dailyDir, "executive_summary.txt");
  const jsonPath = path.join(dailyDir, "daily_metrics.json");
  const csvPath = path.join(dailyDir, "daily_metrics.csv");

  if (!fs.existsSync(mdPath)) {
    console.error(`❌ 找不到 ${mdPath}`);
    console.error(`   请先运行 fetch_supabase.mjs + generate_daily_report.mjs`);
    process.exit(1);
  }

  const md = fs.readFileSync(mdPath, "utf8");

  const summarySection = extractSection(md, "Executive Summary");
  const growthSection = extractSection(md, "Growth");
  const revenueSection = extractSection(md, "Revenue");
  const usageSection = extractSection(md, "Usage");

  const bodyMd = [summarySection, growthSection, revenueSection, usageSection]
    .filter((s) => s && s.trim().length > 0)
    .join("\n\n---\n\n");

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#24292f;max-width:720px;">
  <h1 style="margin:0 0 4px;color:#0969da;font-size:22px;">Token Harbor Daily Report</h1>
  <p style="color:#57606a;margin:0 0 16px;font-size:13px;">Report Date: <strong>${reportDate}</strong> (UTC)</p>
${mdToHtml(bodyMd)}
  <hr style="border:none;border-top:1px solid #d0d7de;margin:24px 0;"/>
  <p style="color:#57606a;font-size:12px;">Full report (Markdown / bilingual summary / JSON / CSV) is attached.</p>
</div>`;

  // 构建附件
  const attachments = [];
  function addAttachment(filePath, filename) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath).toString("base64");
    attachments.push({ filename, content });
  }
  addAttachment(mdPath, `daily_report_${reportDate}.md`);
  addAttachment(summaryPath, `executive_summary_${reportDate}.txt`);
  addAttachment(jsonPath, `daily_metrics_${reportDate}.json`);
  addAttachment(csvPath, `daily_metrics_${reportDate}.csv`);

  const payload = {
    from: FROM,
    to: [TO],
    subject: `Token Harbor Daily Report — ${reportDate}`,
    html,
    attachments,
  };

  console.log("=".repeat(60));
  console.log(`Token Harbor Daily Report - Email`);
  console.log(`report_date = ${reportDate}`);
  console.log(`from        = ${FROM}`);
  console.log(`to          = ${TO}`);
  console.log(`attachments = ${attachments.length}`);
  console.log("=".repeat(60));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`❌ Resend API failed: HTTP ${res.status}`);
      console.error(text);
      process.exit(1);
    }
    console.log(`✅ Email sent: ${text}`);
  } finally {
    clearTimeout(timer);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
