# V7 Integrations + Driver Time Saver

Added:
- QuickBooks connection URL foundation
- QuickBooks accounting CSV export
- Xero invoice CSV export
- Webhook support for Make/Zapier/WhatsApp automation
- Integration logs
- Driver Hub
- One-tap multi-document upload queue
- Process queue with AI
- Auto-create invoices/permits from scanned docs where safe
- Drivers can upload many docs quickly without typing all details

Railway variables for integrations:
QUICKBOOKS_CLIENT_ID
QUICKBOOKS_CLIENT_SECRET
QUICKBOOKS_REDIRECT_URI
QUICKBOOKS_REALM_ID
QUICKBOOKS_ACCESS_TOKEN
QUICKBOOKS_REFRESH_TOKEN
XERO_CLIENT_ID
XERO_CLIENT_SECRET
XERO_TENANT_ID
XERO_ACCESS_TOKEN
WEBHOOK_URL

Notes:
- CSV export works now for QuickBooks/Xero importing.
- Full live QuickBooks/Xero two-way sync needs OAuth token exchange and approved developer app credentials.
- OpenAI API credits are still required for scanning/AI.
- Driver Hub reduces driver time: upload docs once, process later, only manual fields need attention.

Deploy:
Upload all files to GitHub repo root, replacing old files, then redeploy Railway.
