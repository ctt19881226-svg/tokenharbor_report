/**
 * run_daily.mjs
 *
 * GitHub Actions entrypoint — chains:
 *   1) fetch_supabase.mjs    -> daily_metrics.json
 *   2) generate_daily_report.mjs -> daily_report.md / executive_summary.txt / CSVs
 *   3) send_email.mjs        -> email via Resend
 *
 * Usage:
 *   node scripts/run_daily.mjs              # defaults to yesterday (UTC)
 *   node scripts/run_daily.mjs 2026-06-21   # specific date
 */

import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const node = process.execPath;

function run(script, args = []) {
  const scriptPath = path.join(__dirname, script);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`▶ node ${script}${args.length ? " " + args.join(" ") : ""}`);
  console.log("=".repeat(60));
  execFileSync(node, [scriptPath, ...args], { stdio: "inherit" });
}

const dateArg = process.argv[2] ? [process.argv[2]] : [];

run("fetch_supabase.mjs", dateArg);
run("generate_daily_report.mjs", dateArg);
run("send_email.mjs", dateArg);

console.log("\n✅ run_daily complete");
