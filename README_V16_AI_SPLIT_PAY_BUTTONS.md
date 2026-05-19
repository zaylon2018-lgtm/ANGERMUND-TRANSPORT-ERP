# V16 AI Split Into Tabs + Bank Windhoek Pay Buttons

Changed:
- Smart AI features moved into their related tabs:
  - Diesel AI -> Diesel tab
  - Invoice AI -> Invoices tab
  - Permit AI -> Permits tab
  - Tyre AI -> Tyres tab
  - Workshop/Damage AI -> Workshop/Maintenance tabs
  - POD/Delivery Note AI -> Trips tab
  - Border Document AI -> Border Logs tab

Added:
- Pay buttons on payment-related tabs:
  - Trips: Driver food money / trip advance
  - Payroll: Payroll / advances
  - Site Workers
  - Invoices / suppliers
  - Permits
  - Maintenance / workshop
- Pay button opens Bank Windhoek Internet Banking in Chrome.
- Payment recording still stays inside ERP.

Important:
The ERP does not make the bank transfer automatically. It opens Bank Windhoek for secure payment. You complete the EFT inside your bank.

Deploy:
Upload all files to GitHub repo root and redeploy Railway.
