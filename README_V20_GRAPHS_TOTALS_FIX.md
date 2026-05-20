# V20 Graphs + Totals Fix

Fixed:
- Graphs now render as visible SVG cards near the top of the dashboard.
- No more hidden canvas issue.
- Added chart cards:
  - Revenue by Route
  - Profit by Driver
  - Expenses Breakdown
  - Receivables by Client
  - Diesel by Truck
  - Invoice Status

Fixed / clarified payments:
- "Payments Recorded" now means the actual records inside the Payments table.
- "Invoice Paid" means paid amount on invoices.
- If they differ, dashboard shows warning.
- Added Reconcile Payments From Invoices button.

Why you saw N$800:
There is/was a payment record in the Payments table for N$800, but your invoice paid total is N$160,000.
V20 now shows the difference clearly and lets you reconcile.

Deploy:
Upload all files to GitHub repo root and redeploy Railway.
