# Founder Analytics System - Implementation Task

Goal:

Implement the Founder Daily Reporting System according to the specifications in /docs.

Requirements:

Read and follow:

- founder-metrics-definition-v1.md
    
- sql-queries-v1.md
    
- founder-report-template-v1.md
    
- daily-metrics-json-schema-v1.md
    
- executive-summary-spec-v1.md
    
- founder-metrics-csv-schema-v1.md
    

Deliverables:

1. Supabase Data Collector
    

- Connect to PostgreSQL
    
- Execute all SQL queries
    
- Return structured metrics
    

2. GA4 Data Collector
    

- Connect to Google Analytics Data API
    
- Retrieve:
    
    - Visitors Yesterday
        
    - Sessions Yesterday
        
    - Website Registrations Yesterday
        
    - Traffic Sources Top 5
        
    - Top Landing Pages Top 5
        

3. Metrics Generator
    

Generate:

daily_metrics.json

following daily-metrics-json-schema-v1.md

4. Historical Metrics Store
    

Maintain:

/reports/founder_metrics.csv

Rules:

- append one row per day
    
- never modify historical rows
    
- prevent duplicate dates
    

5. Executive Summary Generator
    

Generate:

executive_summary.txt

following executive-summary-spec-v1.md

6. Daily Report Generator
    

Generate:

daily_report.md

following founder-report-template-v1.md

7. Daily Job
    

Create a single command:

generate_founder_report

which:

- collects data
    
- generates metrics
    
- updates CSV
    
- creates report
    
- creates summary
    

Output Structure:

/reports/daily/YYYY-MM-DD/  
├── daily_report.md  
├── daily_metrics.json  
├── executive_summary.txt

/reports/  
├── founder_metrics.csv