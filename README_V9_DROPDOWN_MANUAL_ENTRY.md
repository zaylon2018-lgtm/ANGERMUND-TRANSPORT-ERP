# V9 Dropdown + Manual Entry Fix

Changed:
- Dropdown fields now include: Other / Type manually
- When selected, a manual text box appears
- New manual value is saved into the record
- If it belongs to Dropdown Lists, it is also saved into masters so it appears next time

Examples:
- New route not in list? Choose Other / Type manually
- New client? Type it once, next time it appears in the dropdown
- New supplier/status/role/permit type/border post also saves

Deploy:
Upload all files to GitHub repo root, replacing old files, then redeploy Railway.
