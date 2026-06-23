# Founder Metrics Definition v1

Project: Token Harbor

Version: 1.0

Last Updated: 2026-06-22

---

# Purpose

This document defines the official metrics used in the Token Harbor Founder Daily Report.

The goal is to provide a single source of truth for company growth, product adoption, revenue, API usage, referral performance, welcome credit economics, and website traffic.

All future reporting, dashboards, Notion integrations, CloudCode automations, and AI-generated summaries should follow the definitions in this document.

---

# Report Schedule

## Daily Founder Report

Generation Time:

08:00 China Standard Time (UTC+8)

Reporting Window:

Previous calendar day

Example:

Report Generated:

2026-06-22 08:00 CST

Data Window:

2026-06-21 00:00:00 CST

↓

2026-06-21 23:59:59 CST

---

# Data Sources

## Business Metrics

Source of Truth:

Supabase PostgreSQL

Includes:

- Users
    
- Verification
    
- Activation
    
- Revenue
    
- API Usage
    
- Referral
    
- Welcome Credits
    

---

## Website Analytics

Source of Truth:

Google Analytics 4 (GA4)

Includes:

- Website Traffic
    
- Acquisition Channels
    
- Landing Pages
    

---

# Important Note

Token Harbor supports API-first onboarding.

Many users:

- Register via API
    
- Create API keys
    
- Use Cursor / Claude Code / Cline
    
- Never visit the website again
    

Therefore:

Website Traffic metrics are intentionally separated from Business Metrics.

The following funnel is NOT valid:

Visitors → Registrations → Activated Users → Paying Users

Instead:

Website Traffic and Business Metrics should be analyzed independently.

---

# 1. Growth

## Total Users

Definition:

Total registered users.

Source:

profiles

Formula:

role = 'user'

---

## New Users Yesterday

Definition:

Users registered during the reporting window.

Source:

profiles.created_at

---

## Valid Users

Definition:

Users with both device_fingerprint and signup_ip present.

Purpose:

Internal anti-abuse monitoring only.

Source:

profiles

Formula:

device_fingerprint IS NOT NULL

AND signup_ip IS NOT NULL

---

## Valid User Rate

Definition:

Percentage of users considered valid.

Formula:

Valid Users / Total Users

---

# 2. Verification

## Verified Users

Definition:

Users who completed email verification.

Source:

profiles.email_verified_at

Formula:

email_verified_at IS NOT NULL

---

## Verification Rate

Definition:

Verified Users / Total Users

---

# 3. Activation

## Activated Users Total

Definition:

Users who successfully completed at least one API request.

Source:

profiles.first_api_request_at

Formula:

first_api_request_at IS NOT NULL

---

## New Activated Users Yesterday

Definition:

Users whose first successful API request occurred during the reporting window.

Source:

profiles.first_api_request_at

---

## Activation Rate

Definition:

Activated Users Total / Total Users

---

# 4. Activity

## Active Users Yesterday

Definition:

Users active during the reporting window.

Source:

profiles.last_active_at

---

## Active Users 7d

Definition:

Users active at least once during the last 7 days.

Source:

profiles.last_active_at

---

# 5. Revenue

## Paying Users Total

Definition:

Users who completed at least one recharge.

Source:

transactions

Formula:

type = 'recharge'

Count distinct user_id

---

## New Paying Users Yesterday

Definition:

Users whose first recharge occurred during the reporting window.

Source:

transactions

Formula:

MIN(created_at)

WHERE type='recharge'

GROUP BY user_id

---

## Revenue Yesterday

Definition:

Recharge amount during the reporting window.

Source:

transactions

Formula:

SUM(amount)

WHERE type='recharge'

---

## Revenue MTD

Definition:

Recharge amount since the beginning of the current month.

Source:

transactions

Formula:

SUM(amount)

WHERE type='recharge'

AND current month

---

## Total Revenue

Definition:

Lifetime recharge amount.

Source:

transactions

Formula:

SUM(amount)

WHERE type='recharge'

---

# 6. Usage

## API Calls Yesterday

Definition:

Total API requests during the reporting window.

Source:

request_traces

---

## Active API Users

Definition:

Distinct users making API requests during the reporting window.

Source:

request_traces.user_id

---

## Tokens In

Definition:

Total input tokens during the reporting window.

Source:

request_traces.tokens_in

---

## Tokens Out

Definition:

Total output tokens during the reporting window.

Source:

request_traces.tokens_out

---

## Total Tokens

Definition:

Tokens In + Tokens Out

---

## Cost USD

Definition:

Total upstream model cost during the reporting window.

Source:

request_traces.cost_usd

---

## Error Rate

Definition:

Percentage of failed API requests.

Source:

request_traces.ok

Formula:

Failed Requests / Total Requests

---

## Cache Hit Rate

Definition:

Percentage of requests served from cache.

Source:

request_traces.cache_hit

Formula:

Cache Hits / Total Requests

---

## Top Models (Top 10)

Definition:

Most requested models during the reporting window.

Source:

request_traces.model

Output:

- Rank
    
- Model
    
- Request Count
    
- Share %
    

Limit:

Top 10

---

# 7. Welcome Credit Economics

## Users Granted

Definition:

Users who received Welcome Credit.

Source:

credit_grants

Formula:

kind = 'welcome'

Count distinct user_id

---

## Total Granted

Definition:

Total Welcome Credit granted.

Source:

credit_grants.amount_usd

Formula:

SUM(amount_usd)

WHERE kind='welcome'

---

## Users Consumed Credit

Definition:

Users who received Welcome Credit and later generated at least one consume transaction.

Purpose:

Measure how many users actually used their free credits.

---

## Credit Consumption Amount

Definition:

Total amount of credit consumed by users who received Welcome Credit.

Purpose:

Measure actual Welcome Credit usage.

---

## Welcome Credit → Paid

Definition:

Users who received Welcome Credit and later completed at least one recharge.

Purpose:

Measure free-credit conversion effectiveness.

---

## Total Reclaimed

Definition:

Welcome Credit reclaimed by the system after expiration.

Source:

credit_grants.reclaimed_amount

Formula:

SUM(reclaimed_amount)

WHERE kind='welcome'

---

## Net Granted

Definition:

Effective Welcome Credit exposure.

Formula:

Total Granted − Total Reclaimed

---

## Utilization Rate

Definition:

Percentage of granted Welcome Credit that has been consumed.

Formula:

Credit Consumption Amount

/

Total Granted

---

# 8. Referral

## Referral Users Total

Definition:

Users acquired through referral.

Source:

profiles.referred_by

Formula:

referred_by IS NOT NULL

---

## New Referral Users Yesterday

Definition:

Referral users registered during the reporting window.

Source:

profiles.created_at

Formula:

referred_by IS NOT NULL

AND created_at within reporting window

---

## Referral Share %

Definition:

Percentage of total users acquired via referral.

Formula:

Referral Users Total

/

Total Users

---

# 9. Website Traffic (GA4)

Purpose:

Analyze website traffic and acquisition channels.

These metrics do NOT represent total user growth.

Many Token Harbor users register and use the platform directly through API workflows without visiting the website.

---

## Visitors Yesterday

Definition:

Unique website visitors during the reporting window.

Source:

GA4

---

## Sessions Yesterday

Definition:

Total website sessions during the reporting window.

Source:

GA4

---

## Website Registrations Yesterday

Definition:

Registrations tracked through website conversion events.

Source:

GA4

Purpose:

Measure website conversion performance.

Important:

Website Registrations are website conversion events only.

They do not represent total new users because Token Harbor supports API-first onboarding flows.

---

## Traffic Sources Top 5

Definition:

Top acquisition channels by traffic volume.

Examples:

- Google
    
- Direct
    
- Product Hunt
    
- Twitter/X
    
- Reddit
    

Source:

GA4

Output:

Top 5 sources and traffic share

---

## Top Landing Pages Top 5

Definition:

Most visited entry pages.

Examples:

- /
    
- /models
    
- /pricing
    
- /docs
    

Source:

GA4

Output:

Top 5 landing pages and traffic share

---

# AI Executive Summary

After all metrics are generated, Claude should produce an executive summary.

Maximum Length:

5 bullet points

Summary should cover:

- User Growth
    
- Activation Performance
    
- Revenue Performance
    
- Usage Trends
    
- Top Models
    
- Welcome Credit Efficiency
    
- Referral Growth
    
- Website Traffic Highlights
    

---

# Founder Dashboard Sections

The Daily Founder Report should be displayed in the following order:

1. Executive Summary
    
2. Growth
    
3. Verification
    
4. Activation
    
5. Activity
    
6. Revenue
    
7. Usage
    
8. Welcome Credit Economics
    
9. Referral
    
10. Website Traffic
    
11. Top Models
    

This order should remain consistent across Markdown reports, Notion reports, and future dashboards.