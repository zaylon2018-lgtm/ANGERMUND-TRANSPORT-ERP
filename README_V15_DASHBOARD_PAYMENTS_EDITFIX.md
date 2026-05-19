# V15 Dashboard + Payments + Edit Fix

Fixed:
- Dashboard now includes invoices, paid amounts and receivables.
- Main revenue uses invoice total when invoices exist.
- Accounting and dashboard should now agree better.
- Edit request failed fixed by ignoring readonly fields like id and created_at.
- Invoice table now has payment status dropdown.
- Invoice table has Payment button to record payment amount.
- Payments also create payment records.

Deploy:
Upload all files to GitHub repo root and redeploy Railway.
