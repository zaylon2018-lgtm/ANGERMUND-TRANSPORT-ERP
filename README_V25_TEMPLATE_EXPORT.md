# V25 Excel Template Export

Added:
- Exports Trips into your uploaded Driver Trip Report Excel format.
- Keeps your familiar Excel layout as the master template.
- Adds ERP Data sheet with clean database data.
- Filter export by driver, truck, date range.
- Upload/replace the template from the Trips tab.

Where:
Trips tab -> Excel Template Export -> Export Same Format.

Template included:
templates/trip-report-template.xlsx

Deploy:
Upload all files to GitHub repo root and redeploy Railway.

Important:
This uses ExcelJS, so package.json now includes exceljs dependency.
