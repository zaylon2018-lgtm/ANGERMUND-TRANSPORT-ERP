# Angermund Transport Railway ERP V2

This version adds the requested modules and links them through dropdown lists so you do not need to type long truck, driver, route, client, permit or status names every time.

## Added / included

- Side menu
- Diesel tracking
- Tyre tracking
- Workshop jobs
- Invoice PDFs
- WhatsApp reports
- GPS tracking
- Payroll
- Permits
- Multi-admin roles
- Installable mobile app (PWA-style)
- Reminder dropdown / reminder module
- Master dropdown lists:
  - routes
  - clients
  - suppliers
  - statuses
  - roles
  - permit types
  - border posts
  - priority
  - truck list from fleet
  - driver list from drivers

## Railway deploy

1. Upload all files to GitHub repo root.
2. Railway -> Deploy from GitHub.
3. Add PostgreSQL service.
4. Link `DATABASE_URL` to the web service.
5. Add Variables:
   JWT_SECRET=any-long-secret
   ADMIN_EMAIL=admin@angermundtransport.com
   ADMIN_PASSWORD=admin123
   OPENAI_API_KEY=optional
   AI_MODEL=gpt-4o-mini
6. Redeploy when Railway deploys are back online.

## Login

Default:
admin@angermundtransport.com
admin123

## AI slip scanning

The system will not guess. If the amount, litres, supplier, date or slip number is unclear, it returns manual_required and the driver must enter it manually.
