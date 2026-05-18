# Angermund Transport Railway ERP

## Deploy on Railway
1. Create a new GitHub repo.
2. Upload all files from this ZIP to the repo root.
3. Railway -> New Project -> Deploy from GitHub repo.
4. Add PostgreSQL: Railway project -> New -> Database -> PostgreSQL.
5. In your web service Variables, add:
   JWT_SECRET = any long private text
   ADMIN_EMAIL = admin@angermundtransport.com
   ADMIN_PASSWORD = admin123
   OPENAI_API_KEY = optional, only for AI slip scanning
   AI_MODEL = gpt-4o-mini
6. Make sure DATABASE_URL is available to the web service. Railway normally injects it when the PostgreSQL service is linked.
7. Deploy and open the Railway domain.
8. Login with ADMIN_EMAIL and ADMIN_PASSWORD.

## Included
Frontend + backend, PostgreSQL tables, login, users, trips, rate/km, profit/loss, fleet, drivers, diesel, AI slip scanning with manual fallback, permits, payroll, workers, maintenance, tyres, workshop, fines/damages, border logs, GPS tracking, invoices, PDF invoices, exports to CSV/Excel/PDF/JSON, WhatsApp report link, mobile-friendly installable layout.

## Slip scanning rule
The AI endpoint is instructed to never guess. If amount/litres/supplier/date is unclear or confidence is below 85%, it marks the slip as manual_required and the driver must enter the data manually.
