# V21 Connected Tabs + Excel Auto Sync

Added:
- AI tools are now connected inside their own tabs:
  - Trips: POD / delivery note AI
  - Diesel: diesel slip AI
  - Invoices: invoice AI
  - Permits: permit/license AI
  - Tyres: tyre invoice AI
  - Maintenance/Workshop: workshop/damage AI
  - Border Logs: border document AI

Added inside each relevant module:
- AI Scan button
- Excel Sync button
- Export Excel button
- Pay button where payments belong

Excel Sync:
- Upload Excel directly inside the matching tab.
- Existing records update if a matching key exists.
- New records insert automatically.
- Dashboard totals update after sync.

Update keys:
- Trips: trip_no
- Diesel: slip_no + truck
- Trucks: truck_no
- Drivers: name
- Invoices: invoice_no
- Payroll: date + employee
- Workers: date + name + site
- Tyres: serial_no
- Permits: item + owner
- Payments: reference + party

Deploy:
Upload all files to GitHub repo root and redeploy Railway.
