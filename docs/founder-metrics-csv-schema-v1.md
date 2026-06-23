# Founder Metrics CSV Schema v1

Project: Token Harbor

Version: 1.0

Last Updated: 2026-06-22

Purpose:

Historical time-series data store for founder metrics.

This CSV serves as the source for:

- Trend analysis
    
- Weekly reports
    
- Monthly reports
    
- Investor updates
    
- Dashboard visualizations
    
- Future forecasting
    

---

# File Location

/reports/founder_metrics.csv

---

# Update Rules

1. Append one row per day.
    
2. Never modify historical rows.
    
3. Date must be unique.
    
4. Sort by date ascending.
    
5. Missing values should be recorded as 0.
    
6. Percentages should be stored as numeric values, not strings.
    

Example:

33.5

NOT

33.5%

---

# CSV Columns

date,

total_users,  
new_users,

valid_users,  
valid_user_rate,

verified_users,  
verification_rate,

activated_users,  
new_activated_users,  
activation_rate,

active_users_yesterday,  
active_users_7d,

paying_users,  
new_paying_users,

revenue_yesterday,  
revenue_mtd,  
total_revenue,

api_calls,  
active_api_users,

tokens_in,  
tokens_out,  
total_tokens,

cost_usd,

error_rate,  
cache_hit_rate,

users_granted,  
total_granted,

users_consumed_credit,  
credit_consumption_amount,

welcome_credit_to_paid,

total_reclaimed,  
net_granted,  
utilization_rate,

referral_users,  
new_referral_users,  
referral_share,

visitors,  
sessions,  
website_registrations

---

# Example Row

2026-06-21,  
127,  
6,  
89,  
70.08,  
81,  
63.78,  
42,  
4,  
33.07,  
9,  
26,  
11,  
1,  
20.00,  
183.00,  
183.00,  
623,  
8,  
2300000,  
5800000,  
8100000,  
4.72,  
0.80,  
18.40,  
120,  
600,  
43,  
112,  
5,  
0,  
600,  
18.67,  
18,  
2,  
14.17,  
42,  
61,  
3

---

# Excluded Metrics

The following metrics should NOT be stored in founder_metrics.csv:

- Executive Summary
    
- Top Models
    
- Traffic Sources
    
- Landing Pages
    

Reason:

These are report-level outputs, not daily time-series metrics.

Store them in:

daily_report.md

daily_metrics.json

instead.

---

# Future Compatibility

New columns may be appended at the end of the CSV.

Existing columns should never be renamed or reordered.

This ensures backward compatibility with historical reports and dashboards.