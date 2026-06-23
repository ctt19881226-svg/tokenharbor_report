# Founder Report Template v1

Project: Token Harbor

Version: 1.0

Last Updated: 2026-06-22

Purpose:

Define the exact output format for the Daily Founder Report.

CloudCode should generate a Markdown report following this structure.

---

# Token Harbor Founder Daily Report

Report Date: {{report_date}}

Reporting Window:

{{yesterday_start}}

↓

{{today_end}}

Generated At:

{{generated_at}}

---

# Executive Summary

Generate 3–5 concise bullet points highlighting the most important developments.

Focus on:

- User growth
    
- Activation
    
- Revenue
    
- Usage
    
- Model trends
    
- Referral growth
    
- Website traffic
    

Example:

- 6 new users registered yesterday, bringing total users to 127.
    
- 4 users activated for the first time, maintaining a 33.1% activation rate.
    
- Revenue increased by $20 from one new paying user.
    
- GPT-5.5 and Claude Sonnet 4.6 accounted for 73% of requests.
    
- Product Hunt generated 21% of website traffic.
    

---

# Growth

|Metric|Value|
|---|---|
|Total Users|{{total_users}}|
|New Users Yesterday|{{new_users_yesterday}}|
|Valid Users|{{valid_users}}|
|Valid User Rate|{{valid_user_rate}}%|

---

# Verification

|Metric|Value|
|---|---|
|Verified Users|{{verified_users}}|
|Verification Rate|{{verification_rate}}%|

---

# Activation

|Metric|Value|
|---|---|
|Activated Users|{{activated_users_total}}|
|New Activated Users|{{new_activated_users_yesterday}}|
|Activation Rate|{{activation_rate}}%|

---

# Activity

|Metric|Value|
|---|---|
|Active Users Yesterday|{{active_users_yesterday}}|
|Active Users 7d|{{active_users_7d}}|

---

# Revenue

|Metric|Value|
|---|---|
|Paying Users|{{paying_users_total}}|
|New Paying Users|{{new_paying_users_yesterday}}|
|Revenue Yesterday|${{revenue_yesterday}}|
|Revenue MTD|${{revenue_mtd}}|
|Total Revenue|${{total_revenue}}|

---

# Usage

|Metric|Value|
|---|---|
|API Calls Yesterday|{{api_calls_yesterday}}|
|Active API Users|{{active_api_users}}|
|Tokens In|{{tokens_in}}|
|Tokens Out|{{tokens_out}}|
|Total Tokens|{{total_tokens}}|
|Cost USD|${{cost_usd}}|
|Error Rate|{{error_rate}}%|
|Cache Hit Rate|{{cache_hit_rate}}%|

---

# Welcome Credit Economics

|Metric|Value|
|---|---|
|Users Granted|{{users_granted}}|
|Total Granted|${{total_granted}}|
|Users Consumed Credit|{{users_consumed_credit}}|
|Credit Consumption Amount|${{credit_consumption_amount}}|
|Welcome Credit → Paid|{{welcome_credit_to_paid}}|
|Total Reclaimed|${{total_reclaimed}}|
|Net Granted|${{net_granted}}|
|Utilization Rate|{{utilization_rate}}%|

---

# Referral

|Metric|Value|
|---|---|
|Referral Users Total|{{referral_users_total}}|
|New Referral Users Yesterday|{{new_referral_users_yesterday}}|
|Referral Share|{{referral_share}}%|

---

# Website Traffic

|Metric|Value|
|---|---|
|Visitors Yesterday|{{visitors_yesterday}}|
|Sessions Yesterday|{{sessions_yesterday}}|
|Website Registrations|{{website_registrations_yesterday}}|

---

## Traffic Sources (Top 5)

|Source|Share|
|---|---|
|{{traffic_sources_table}}||

Example:

|Source|Share|
|---|---|
|Google|38%|
|Direct|25%|
|Product Hunt|21%|
|Twitter/X|10%|
|Reddit|6%|

---

## Top Landing Pages

|Landing Page|Share|
|---|---|
|{{landing_pages_table}}||

Example:

|Landing Page|Share|
|---|---|
|/|42%|
|/models|31%|
|/pricing|16%|
|/docs|11%|

---

# Top User-Selected Models

|Rank|Model|Requests|Share|
|---|---|---|---|
|{{top_models_table}}||||

Example:

|Rank|Model|Requests|Share|
|---|---|---|---|
|1|GPT-5.5|213|34.2%|
|2|Claude Sonnet 4.6|189|30.3%|
|3|Gemini 3.5 Flash|92|14.8%|

---

# Notes

Website Traffic metrics come from GA4.

Business Metrics come from Supabase.

Website Traffic and Business Metrics should not be interpreted as a single funnel because Token Harbor supports API-first onboarding flows.

---

# Output Requirements

CloudCode must generate:

1. daily_report.md
    

Human-readable founder report.

2. daily_metrics.json
    

Machine-readable metrics.

3. daily_metrics.csv
    

Historical trend tracking.

4. executive_summary.txt
    

Executive summary only.

All files should be saved under:

/reports/daily/{{report_date}}/