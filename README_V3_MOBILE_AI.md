# Angermund Transport ERP V3 Mobile + AI

What changed:
- Mobile drawer improved
- Floating bottom navigation
- Swipe-to-open menu
- Bigger touch buttons
- Quick-add button
- Cleaner stacked mobile dashboard
- PWA install support
- Upload progress bar
- Slip AI now accepts readable core fields and only asks manual entry for unclear fields
- Diesel fields expanded: price/litre, station, pump, attendant, manual_fields
- Offline app shell cache

Deploy:
1. Upload all files to GitHub repo root, replacing old files.
2. Railway redeploy after Railway deployments resume.
3. Ensure PostgreSQL is linked and DATABASE_URL exists.
4. Keep OPENAI_API_KEY for slip scanning.

Install on phone:
Chrome → open Railway site → 3 dots → Add to Home Screen / Install App.

For true APK + push notifications + background GPS:
Use Capacitor after this web app is stable.
