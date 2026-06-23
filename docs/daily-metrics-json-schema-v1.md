# Daily Metrics JSON Schema v1

Purpose:

Canonical machine-readable output for all founder metrics.

File:

daily_metrics.json

Example:

{  
"report_date": "2026-06-21",

"growth": {  
"total_users": 127,  
"new_users_yesterday": 6,  
"valid_users": 89,  
"valid_user_rate": 70.08  
},

"verification": {  
"verified_users": 81,  
"verification_rate": 63.78  
},

"activation": {  
"activated_users_total": 42,  
"new_activated_users_yesterday": 4,  
"activation_rate": 33.07  
},

"activity": {  
"active_users_yesterday": 9,  
"active_users_7d": 26  
},

"revenue": {  
"paying_users_total": 11,  
"new_paying_users_yesterday": 1,  
"revenue_yesterday": 20.00,  
"revenue_mtd": 183.00,  
"total_revenue": 183.00  
},

"usage": {  
"api_calls_yesterday": 623,  
"active_api_users": 8,  
"tokens_in": 2300000,  
"tokens_out": 5800000,  
"total_tokens": 8100000,  
"cost_usd": 4.72,  
"error_rate": 0.80,  
"cache_hit_rate": 18.40  
},

"th_orchestra": {  
"requests": 417,  
"request_share": 7.6,  
"users": 18,  
"user_adoption": 18.0,  
"top_routed_models": [  
{ "upstream_model": "claude-opus-4-8", "requests": 120, "share_pct": 28.8 },  
{ "upstream_model": "deepseek-v4-flash", "requests": 140, "share_pct": 33.6 }  
]  
},

"welcome_credit": {  
"users_granted": 120,  
"total_granted": 600,  
"users_consumed_credit": 43,  
"credit_consumption_amount": 112,  
"welcome_credit_to_paid": 5,  
"total_reclaimed": 0,  
"net_granted": 600,  
"utilization_rate": 18.67  
},

"referral": {  
"referral_users_total": 18,  
"new_referral_users_yesterday": 2,  
"referral_share": 14.17  
},

"website": {  
"visitors_yesterday": 42,  
"sessions_yesterday": 61,  
"website_registrations_yesterday": 3  
}  
}