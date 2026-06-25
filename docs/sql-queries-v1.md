# SQL Queries v1

Project: Token Harbor

Version: 1.0

Last Updated: 2026-06-22

Purpose:

This document defines all SQL queries required to generate the Founder Daily Report.

---

# Global Variables

CloudCode should calculate:

```text
yesterday_start
today_start
```

Example:

```text
yesterday_start = 2026-06-21 00:00:00+08
today_start     = 2026-06-22 00:00:00+08
```

All "Yesterday" metrics use:

```sql
created_at >= :yesterday_start
and created_at < :today_start
```

---

# 1. Growth

## Total Users

```sql
select count(*)
from profiles
where role='user';
```

---

## New Users Yesterday

```sql
select count(*)
from profiles
where role='user'
and created_at >= :yesterday_start
and created_at < :today_start;
```

---

## Valid Users

```sql
select count(*)
from profiles
where role='user'
and device_fingerprint is not null
and signup_ip is not null;
```

---

## Valid User Rate

```sql
select round(
    100.0 *
    count(*) filter (
        where device_fingerprint is not null
        and signup_ip is not null
    )
    /
    nullif(count(*),0),
    2
)
from profiles
where role='user';
```

---

# 2. Verification

## Verified Users

```sql
select count(*)
from profiles
where email_verified_at is not null;
```

---

## Verification Rate

```sql
select round(
    100.0 *
    count(*) filter (
        where email_verified_at is not null
    )
    /
    nullif(count(*),0),
    2
)
from profiles
where role='user';
```

---

# 3. Activation

## Activated Users Total

```sql
select count(*)
from profiles
where first_api_request_at is not null;
```

---

## New Activated Users Yesterday

```sql
select count(*)
from profiles
where first_api_request_at >= :yesterday_start
and first_api_request_at < :today_start;
```

---

## Activation Rate

```sql
select round(
    100.0 *
    count(*) filter (
        where first_api_request_at is not null
    )
    /
    nullif(count(*),0),
    2
)
from profiles
where role='user';
```

---

# 4. Activity

## Active Users Yesterday

```sql
select count(*)
from profiles
where last_active_at >= :yesterday_start
and last_active_at < :today_start;
```

---

## Active Users 7d

```sql
select count(*)
from profiles
where last_active_at >= now() - interval '7 day';
```

---

# 5. Revenue

## Paying Users Total

```sql
select count(distinct user_id)
from transactions
where type='recharge';
```

---

## New Paying Users Yesterday

```sql
select count(*)
from (
    select
        user_id,
        min(created_at) as first_recharge_at
    from transactions
    where type='recharge'
    group by user_id
) t
where first_recharge_at >= :yesterday_start
and first_recharge_at < :today_start;
```

---

## Revenue Yesterday

```sql
select coalesce(sum(amount),0)
from transactions
where type='recharge'
and created_at >= :yesterday_start
and created_at < :today_start;
```

---

## Revenue MTD

```sql
select coalesce(sum(amount),0)
from transactions
where type='recharge'
and date_trunc('month', created_at)
=
date_trunc('month', now());
```

---

## Total Revenue

```sql
select coalesce(sum(amount),0)
from transactions
where type='recharge';
```

---

# 6. Usage

## API Calls Yesterday

```sql
select count(*)
from request_traces
where created_at >= :yesterday_start
and created_at < :today_start;
```

---

## Active API Users

```sql
select count(distinct user_id)
from request_traces
where created_at >= :yesterday_start
and created_at < :today_start;
```

---

## Tokens In

```sql
select coalesce(sum(tokens_in),0)
from request_traces
where created_at >= :yesterday_start
and created_at < :today_start;
```

---

## Tokens Out

```sql
select coalesce(sum(tokens_out),0)
from request_traces
where created_at >= :yesterday_start
and created_at < :today_start;
```

---

## Total Tokens

```sql
select
    coalesce(sum(tokens_in),0)
    +
    coalesce(sum(tokens_out),0)
from request_traces
where created_at >= :yesterday_start
and created_at < :today_start;
```

---

## Cost USD

```sql
select round(
    coalesce(sum(cost_usd),0),
    4
)
from request_traces
where created_at >= :yesterday_start
and created_at < :today_start;
```

---

## Error Rate

```sql
select round(
    100.0 *
    count(*) filter (where ok=false)
    /
    nullif(count(*),0),
    2
)
from request_traces
where created_at >= :yesterday_start
and created_at < :today_start;
```

---

## Cache Hit Rate

```sql
select round(
    100.0 *
    count(*) filter (where cache_hit=true)
    /
    nullif(count(*),0),
    2
)
from request_traces
where created_at >= :yesterday_start
and created_at < :today_start;
```

---

# 7. Top User-Selected Models

## Top User-Selected Models (Top 10)

```sql
with model_stats as (
    select
        model,
        count(*) as requests
    from request_traces
    where created_at >= :yesterday_start
    and created_at < :today_start
    group by model
)
select
    model,
    requests,
    round(
        100.0 * requests /
        sum(requests) over(),
        2
    ) as share_pct
from model_stats
order by requests desc
limit 10;
```

---

# 7.5 Free DeepSeek V4 Flash

## Requests

```sql
select count(*) as requests
from request_traces rt
left join profiles p on p.id = rt.user_id
where rt.created_at >= :yesterday_start
and rt.created_at < :today_start
and rt.model = 'deepseek-v4-flash'
and rt.cost_usd = 0
and coalesce(p.is_system,false) = false;
```

---

## Users

```sql
select count(distinct rt.user_id) as users
from request_traces rt
left join profiles p on p.id = rt.user_id
where rt.created_at >= :yesterday_start
and rt.created_at < :today_start
and rt.model = 'deepseek-v4-flash'
and rt.cost_usd = 0
and coalesce(p.is_system,false) = false;
```

---

## Tokens

```sql
select
    coalesce(sum(input_tokens),0) as input_tokens,
    coalesce(sum(output_tokens),0) as output_tokens,
    coalesce(sum(input_tokens + output_tokens),0) as total_tokens
from request_traces rt
left join profiles p on p.id = rt.user_id
where rt.created_at >= :yesterday_start
and rt.created_at < :today_start
and rt.model = 'deepseek-v4-flash'
and rt.cost_usd = 0
and coalesce(p.is_system,false) = false;
```

---

## Request Share

```sql
select
    100.0 *
    (
        select count(*)
        from request_traces rt
        left join profiles p on p.id = rt.user_id
        where rt.created_at >= :yesterday_start
        and rt.created_at < :today_start
        and rt.model = 'deepseek-v4-flash'
        and rt.cost_usd = 0
        and coalesce(p.is_system,false) = false
    )
    /
    nullif(
        (
            select count(*)
            from request_traces rt
            left join profiles p on p.id = rt.user_id
            where rt.created_at >= :yesterday_start
            and rt.created_at < :today_start
            and coalesce(p.is_system,false) = false
        ),
        0
    ) as request_share_pct;
```

---

## User Share

```sql
select
    100.0 *
    (
        select count(distinct rt.user_id)
        from request_traces rt
        left join profiles p on p.id = rt.user_id
        where rt.created_at >= :yesterday_start
        and rt.created_at < :today_start
        and rt.model = 'deepseek-v4-flash'
        and rt.cost_usd = 0
        and coalesce(p.is_system,false) = false
    )
    /
    nullif(
        (
            select count(distinct rt.user_id)
            from request_traces rt
            left join profiles p on p.id = rt.user_id
            where rt.created_at >= :yesterday_start
            and rt.created_at < :today_start
            and coalesce(p.is_system,false) = false
        ),
        0
    ) as user_share_pct;
```

---

# 8. Welcome Credit Economics

## Users Granted

```sql
select count(distinct user_id)
from credit_grants
where kind='welcome';
```

---

## Total Granted

```sql
select coalesce(sum(amount_usd),0)
from credit_grants
where kind='welcome';
```

---

## Users Consumed Credit

```sql
select count(distinct cg.user_id)
from credit_grants cg
where cg.kind='welcome'
and exists (
    select 1
    from transactions t
    where t.user_id = cg.user_id
    and t.type='consume'
);
```

---

## Credit Consumption Amount

```sql
select abs(
    coalesce(sum(t.amount),0)
)
from transactions t
where t.type='consume'
and exists (
    select 1
    from credit_grants cg
    where cg.user_id=t.user_id
    and cg.kind='welcome'
);
```

---

## Welcome Credit → Paid

```sql
select count(distinct cg.user_id)
from credit_grants cg
where cg.kind='welcome'
and exists (
    select 1
    from transactions t
    where t.user_id=cg.user_id
    and t.type='recharge'
);
```

---

## Total Reclaimed

```sql
select coalesce(sum(reclaimed_amount),0)
from credit_grants
where kind='welcome';
```

---

## Net Granted

```sql
select
    coalesce(sum(amount_usd),0)
    -
    coalesce(sum(reclaimed_amount),0)
from credit_grants
where kind='welcome';
```

---

## Utilization Rate

```sql
with granted as (
    select
        coalesce(sum(amount_usd),0) as total_granted
    from credit_grants
    where kind='welcome'
),
consumed as (
    select
        abs(coalesce(sum(t.amount),0)) as total_consumed
    from transactions t
    where t.type='consume'
    and exists (
        select 1
        from credit_grants cg
        where cg.user_id=t.user_id
        and cg.kind='welcome'
    )
)
select round(
    100.0 * total_consumed
    /
    nullif(total_granted,0),
    2
)
from granted, consumed;
```

---

# 9. Referral

## Referral Users Total

```sql
select count(*)
from profiles
where referred_by is not null;
```

---

## New Referral Users Yesterday

```sql
select count(*)
from profiles
where referred_by is not null
and created_at >= :yesterday_start
and created_at < :today_start;
```

---

## Referral Share

```sql
select round(
    100.0 *
    count(*) filter (
        where referred_by is not null
    )
    /
    nullif(count(*),0),
    2
)
from profiles;
```

---

# 10. Website Traffic (GA4)

Source:

Google Analytics Data API

Required Metrics:

- visitors_yesterday
    
- sessions_yesterday
    
- website_registrations_yesterday
    
- traffic_sources_top5
    
- landing_pages_top5
    

These metrics are retrieved via GA4 API and are not stored in PostgreSQL.

---

# Output Format

CloudCode should return a JSON object containing all metrics.

Example:

```json
{
  "total_users": 127,
  "new_users_yesterday": 6,
  "verified_users": 81,
  "activated_users": 42,
  "paying_users": 11,
  "revenue_yesterday": 20,
  "api_calls_yesterday": 623
}
```