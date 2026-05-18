# V12 Real PWA Install

This version fixes Android install behaviour so it installs as a proper app instead of only a Chrome shortcut.

Added:
- Real manifest.json with app id, scope, standalone mode
- Proper icons: 72/96/128/144/152/192/384/512
- Maskable icon for Android
- Apple touch icon
- Theme color and mobile meta tags
- Service worker
- Offline shell cache
- Install prompt box
- App shortcuts:
  - Driver Upload
  - Send GPS
  - Diesel Slip
- Push notification placeholder
- PWA status endpoint

Important:
1. Upload all files to GitHub.
2. Redeploy Railway.
3. On phone, open the Railway domain in Chrome.
4. Wait until page loads fully.
5. Tap the in-app Install button OR Chrome ⋮ > Install app.
6. If Android still shows Chrome badge, remove the old shortcuts from home screen first, then install again.

Why old icons showed Chrome:
- previous versions had no full icon set / manifest metadata.
- Android treated it as a browser shortcut.
