# V6 Smart AI + Hourly GPS

Added:
- Smart AI page
- Invoice scanner
- Permit/license scanner
- Tyre invoice scanner
- Workshop/damage photo AI
- Border document scanner
- POD/delivery note scanner
- AI assistant/chat for ERP data
- AI fraud check for diesel slips
- Auto GPS pin every hour while app/site is open
- GPS start/stop controls
- Better upload progress and document scan outputs

Important:
- Browser/PWA can only reliably auto-GPS while app/site is open.
- True closed-app background GPS needs APK via Capacitor.
- AI scanning needs OPENAI_API_KEY with available API credits.
- If API quota is exceeded, scanners will show the real error.

Deploy:
Upload all files to GitHub repo root, replacing old files, then redeploy Railway.
