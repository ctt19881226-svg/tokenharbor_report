# Founder Report Template v1.3

# Executive Summary

{{executive_summary_bullets}}

---

# Business KPIs

| Current State | Value | Yesterday | Value |
| --- | ---: | --- | ---: |
| Total Registered Users | {{total_registered_users}} | New Registered Users | {{new_registered_users}} |
| Total Verified Users | {{total_verified_users}} | New Verified Users | {{new_verified_users}} |
| Verification Rate | {{verification_rate}}% | | |
| Total Activated Users | {{total_activated_users}} | New Activated Users | {{new_activated_users}} |
| Activation Rate | {{activation_rate}}% | | |
| Total Users Claimed $5 Credit | {{total_users_claimed_5_credit}} | New Users Claimed $5 Credit | {{new_users_claimed_5_credit}} |
| Credit Claim Rate | {{credit_claim_rate}}% | | |
| Total Free Credits Used | ${{total_free_credits_used}} | Free Credits Used Yesterday | ${{free_credits_used_yesterday}} |
| Total Paying Users | {{total_paying_users}} | New Paying Users | {{new_paying_users}} |
| Pay User Rate | {{pay_user_rate}}% | | |
| Total Top-ups | ${{total_topups}} | Top-ups Yesterday | ${{topups_yesterday}} |

---

# Usage

| Metric | Value |
| --- | ---: |
| Active Users Yesterday | {{active_users_yesterday}} |
| Active Users (7d) | {{active_users_7d}} |
| API Requests Yesterday | {{api_requests_yesterday}} |
| Tokens In | {{tokens_in}} |
| Tokens Out | {{tokens_out}} |
| Total Tokens | {{total_tokens}} |
| Estimated Cost | ${{estimated_cost}} |
| Error Rate | {{error_rate}}% |
| Cache Hit Rate | {{cache_hit_rate}}% |

---

# Models

## Top User-Selected Models

| Rank | Model | Requests | Share |
| --- | --- | ---: | ---: |
{{top_user_selected_models_rows}}

---

## TH Orchestra

| Metric | Value |
| --- | ---: |
| Requests | {{th_orchestra_requests}} |
| Request Share | {{th_orchestra_request_share}}% |
| Users | {{th_orchestra_users}} |
| User Adoption | {{th_orchestra_user_adoption}}% |

### Top Routed Models

| Rank | Upstream Model | Requests | Share |
| --- | --- | ---: | ---: |
{{th_orchestra_top_routed_models_rows}}

---

# Free DeepSeek V4 Flash

| Metric | Value |
| --- | ---: |
| Requests | {{free_deepseek_requests}} |
| Request Share | {{free_deepseek_request_share}}% |
| Users | {{free_deepseek_users}} |
| User Share | {{free_deepseek_user_share}}% |
| Tokens | {{free_deepseek_tokens}} |
| Estimated Cost | ${{free_deepseek_estimated_cost}} |

---

# Welcome Credit Economics

| Metric | Value |
| --- | ---: |
| Users Granted | {{users_granted}} |
| Total Granted | ${{total_granted}} |
| Users Consumed Credit | {{users_consumed_credit}} |
| Credit Consumption Amount | ${{credit_consumption_amount}} |
| Welcome Credit -> Paid | {{welcome_credit_to_paid}} |
| Total Reclaimed | ${{total_reclaimed}} |
| Net Granted | ${{net_granted}} |
| Utilization Rate | {{utilization_rate}}% |

---

# Referral

| Metric | Value |
| --- | ---: |
| Referral Users Total | {{referral_users_total}} |
| Referral Share | {{referral_share}}% |
| New Referral Users Yesterday | {{new_referral_users_yesterday}} |

---

# User Quality

| Metric | Value |
| --- | ---: |
| Total Users | {{total_users}} |
| Valid Users | {{valid_users}} |
| Valid User Rate | {{valid_user_rate}}% |

---

# Website Traffic

| Metric | Value |
| --- | ---: |
| Visitors Yesterday | {{visitors_yesterday}} |
| Sessions Yesterday | {{sessions_yesterday}} |
| Website Registrations | {{website_registrations}} |

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