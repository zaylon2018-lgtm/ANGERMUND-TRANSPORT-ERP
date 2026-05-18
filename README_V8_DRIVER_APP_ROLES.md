# V8 Driver App + Role Separation

Added:
- Separate Driver App page
- Driver users see only what they need
- Office/admin modules hidden for drivers on phone
- Driver quick upload for slips/PODs/photos
- Driver GPS check-in and hourly GPS button
- Driver can see own trips, diesel slips, upload queue and reminders
- Office/admin keeps full ERP, accounting, AI, integrations, payroll, reports, etc.
- Basic backend role permission checks added

Recommended users:
- owner/admin/manager/dispatcher/accountant: office dashboard
- driver: Driver App only
- mechanic: workshop modules

Deploy:
Upload all files to GitHub repo root, replacing old files, then redeploy Railway.

Create driver user:
Users -> Add
role = driver
