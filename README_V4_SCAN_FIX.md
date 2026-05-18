# V4 Scan Fix

This fixes the diesel slip scanner behaviour.

What changed:
- The scanner now shows exact API errors instead of only slip_url.
- It accepts readable core fields when amount + litres are clear.
- It only asks manual entry for unreadable fields.
- Confidence threshold lowered for clear receipts.
- Diesel form now includes:
  price_per_litre, station, pump, attendant, manual_fields.
- OpenAI JSON mode added for cleaner extraction.

Important Railway checks:
1. Variable OPENAI_API_KEY must be set on the Railway WEB SERVICE.
2. Redeploy after adding OPENAI_API_KEY.
3. Variable AI_MODEL can be gpt-4o-mini.
4. If Railway logs show OpenAI billing/model errors, fix OpenAI billing or model.
5. If scanner returns api_error, read that message.

Deploy:
Upload all files to GitHub repo root, replacing old files, then redeploy Railway.
