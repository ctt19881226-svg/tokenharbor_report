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
new_verified_users,  
new_verification_rate_day,

activated_users,  
activation_rate,  
new_activated_users,  
new_activation_rate_day,

active_users_yesterday,  
active_users_7d,

referral_users,  
referral_share,  
new_referral_users,  
referral_share_day,

paying_users,  
new_paying_users,

revenue_yesterday,  
revenue_mtd,  
total_revenue,

api_calls,  
active_api_users,

orchestra_requests,  
orchestra_request_share,  
orchestra_users,  
orchestra_user_adoption,

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

free_deepseek_requests,
free_deepseek_request_share,
free_deepseek_users,
free_deepseek_user_share,
free_deepseek_tokens,
free_deepseek_estimated_cost,

visitors,
sessions,
website_registrations

---

# Example Row

2026-06-22,  
5312,  
1516,  
82,  
1.54,  
898,  
16.85,  
126,  
8.31,  
90,  
1.69,  
1,  
0.07,  
26,  
105,  
4375,  
82.31,  
1440,  
94.99,  
3,  
0,  
0,  
100,  
120,  
641,  
28,  
16063014,  
234613,  
16297627,  
76.2768,  
2.96,  
0,  
864,  
4320,  
52,  
122.6371,  
2,  
0,  
4320,  
2.84,  
0,  
0,  
0

---

# Excluded Metrics

The following metrics should NOT be stored in founder_metrics.csv:

- Executive Summary
    
- Top User-Selected Models
    
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