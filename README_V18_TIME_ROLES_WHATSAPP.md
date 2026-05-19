# V18 Device Time + Roles + WhatsApp Intake

Added:
- Device/local time field on Trips, Diesel, Payroll, Workers, Payments, Invoices.
- Time auto-fills from the phone/computer when creating records.
- Created_at timestamps display with date + time.
- User roles improved:
  owner, admin, manager, dispatcher, accountant, office, driver, mechanic, labourer.
- User role values are saved lowercase so permissions work correctly.
- WhatsApp receipt/slip intake webhook:
  POST /api/whatsapp/inbound?token=YOUR_TOKEN

WhatsApp flow:
1. Driver sends slip/photo to WhatsApp Business number.
2. Twilio / Meta WhatsApp Cloud API / Make / Zapier receives it.
3. Automation posts media_url + driver + truck + doc_type to ERP webhook.
4. ERP saves it into Upload Queue.
5. Office/AI processes queue and creates records.

Railway variables:
WHATSAPP_WEBHOOK_TOKEN=any-secret-token

Deploy:
Upload all files to GitHub repo root and redeploy Railway.
