
import 'dotenv/config';
import express from 'express';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename=fileURLToPath(import.meta.url), __dirname=path.dirname(__filename);
const app=express(), PORT=process.env.PORT||3000, SECRET=process.env.JWT_SECRET||'change-me';
app.use(express.json({limit:'25mb'}));
app.use('/uploads',express.static(path.join(__dirname,'uploads')));
app.use(express.static(path.join(__dirname,'public')));
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false});
const upload=multer({dest:path.join(__dirname,'uploads'),limits:{fileSize:8*1024*1024}});

const tableMap={trips:'trips',trucks:'trucks',drivers:'drivers',diesel:'diesel',permits:'permits',payroll:'payroll',workers:'workers',maintenance:'maintenance',tyres:'tyres',workshop:'workshop_jobs',fines:'fines_damages',border:'border_logs',gps:'gps_points',invoices:'invoices',users:'users',reminders:'reminders',masters:'masters',accounts:'accounts',transactions:'account_transactions',vendors:'vendors',customers:'customers',payments:'payments',ai_documents:'ai_documents',ai_alerts:'ai_alerts',upload_queue:'upload_queue',integration_logs:'integration_logs'};

const schema=`
create table if not exists users(id serial primary key,email text unique not null,password_hash text not null,name text,role text default 'admin',created_at timestamptz default now());
create table if not exists masters(id serial primary key,type text not null,value text not null,created_at timestamptz default now(),unique(type,value));
create table if not exists reminders(id serial primary key,title text not null,module text,related_name text,due_date date,priority text default 'Normal',status text default 'Open',notes text,created_at timestamptz default now());
create table if not exists trips(id serial primary key,trip_no text,date date default current_date,route text,from_place text,to_place text,client text,load_desc text,truck text,trailer text,driver text,start_km numeric default 0,end_km numeric default 0,km numeric default 0,rate_km numeric default 0,diesel_cost numeric default 0,tolls numeric default 0,permits_cost numeric default 0,food_money numeric default 0,border_cost numeric default 0,repairs numeric default 0,other_cost numeric default 0,status text default 'Completed',created_at timestamptz default now());
create table if not exists trucks(id serial primary key,truck_no text,trailer_no text,make_model text,driver text,status text default 'Available',current_km numeric default 0,next_service_km numeric default 0,license_expiry date,roadworthy_expiry date,insurance_expiry date,created_at timestamptz default now());
create table if not exists drivers(id serial primary key,name text,phone text,email text,license_expiry date,pdp_expiry date,passport_expiry date,status text default 'Active',created_at timestamptz default now());
create table if not exists diesel(id serial primary key,date date default current_date,truck text,driver text,litres numeric default 0,amount numeric default 0,km numeric default 0,supplier text,slip_no text,slip_url text,scan_status text default 'manual',scan_confidence numeric default 0,created_at timestamptz default now());
create table if not exists permits(id serial primary key,item text,owner text,type text,expiry_date date,cost numeric default 0,status text default 'Valid',created_at timestamptz default now());
create table if not exists payroll(id serial primary key,date date default current_date,employee text,role text,basic_salary numeric default 0,days_worked numeric default 0,overtime_hours numeric default 0,advance numeric default 0,deductions numeric default 0,created_at timestamptz default now());
create table if not exists workers(id serial primary key,date date default current_date,name text,site text,role text,status text,hours numeric default 0,overtime numeric default 0,rate numeric default 0,advance numeric default 0,created_at timestamptz default now());
create table if not exists maintenance(id serial primary key,date date default current_date,truck text,issue text,cost numeric default 0,next_service_km numeric default 0,status text default 'Open',created_at timestamptz default now());
create table if not exists tyres(id serial primary key,date date default current_date,truck text,position text,brand text,serial_no text,cost numeric default 0,km_fitted numeric default 0,status text default 'Fitted',created_at timestamptz default now());
create table if not exists workshop_jobs(id serial primary key,date date default current_date,truck text,job_no text,description text,mechanic text,parts_cost numeric default 0,labour_cost numeric default 0,status text default 'Open',created_at timestamptz default now());
create table if not exists fines_damages(id serial primary key,date date default current_date,driver text,truck text,type text,description text,amount numeric default 0,responsible_party text,status text default 'Open',created_at timestamptz default now());
create table if not exists border_logs(id serial primary key,date date default current_date,truck text,driver text,border_post text,direction text,arrival_time text,release_time text,fees numeric default 0,delay_reason text,created_at timestamptz default now());
create table if not exists gps_points(id serial primary key,email text,driver text,truck text,lat numeric,lng numeric,accuracy numeric,created_at timestamptz default now());



create table if not exists upload_queue(
  id serial primary key,
  driver text,
  truck text,
  doc_type text,
  file_url text,
  status text default 'Queued',
  scan_status text,
  result_json jsonb default '{}'::jsonb,
  created_records text,
  created_at timestamptz default now()
);
create table if not exists integration_logs(
  id serial primary key,
  integration text,
  direction text,
  status text,
  message text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists ai_documents(
  id serial primary key,
  doc_type text,
  file_url text,
  supplier text,
  invoice_no text,
  date date,
  truck text,
  amount numeric default 0,
  vat numeric default 0,
  description text,
  confidence numeric default 0,
  manual_fields text,
  scan_json jsonb default '{}'::jsonb,
  status text default 'Scanned',
  created_at timestamptz default now()
);
create table if not exists ai_alerts(
  id serial primary key,
  alert_type text,
  severity text default 'Normal',
  title text,
  message text,
  status text default 'Open',
  created_at timestamptz default now()
);

create table if not exists accounts(id serial primary key,code text,name text,type text default 'Expense',balance numeric default 0,created_at timestamptz default now());
create table if not exists vendors(id serial primary key,name text,phone text,email text,vat_no text,created_at timestamptz default now());
create table if not exists customers(id serial primary key,name text,phone text,email text,vat_no text,created_at timestamptz default now());
create table if not exists account_transactions(id serial primary key,date date default current_date,type text,account text,description text,reference text,debit numeric default 0,credit numeric default 0,source_module text,source_id integer,created_at timestamptz default now());
create table if not exists payments(id serial primary key,date date default current_date,party text,method text,reference text,amount numeric default 0,status text default 'Paid',notes text,created_at timestamptz default now());

create table if not exists invoices(id serial primary key,date date default current_date,client text,invoice_no text,route text,amount numeric default 0,paid numeric default 0,status text default 'Unpaid',created_at timestamptz default now());
`;

const seed=[['route','Windhoek - Cape Town'],['route','Windhoek - Gauteng'],['route','Walvis Bay - Cape Town'],['client','NBL'],['client','RCC'],['supplier','Engen'],['supplier','Shell'],['status','Active'],['status','Open'],['status','Closed'],['status','Completed'],['status','In Progress'],['status','Valid'],['role','Driver'],['role','Labourer'],['role','Operator'],['permit_type','Cross Border Permit'],['permit_type','Roadworthy'],['permit_type','License Disk'],['permit_type','Insurance'],['border_post','Ariamsvlei'],['border_post','Noordoewer'],['border_post','Trans-Kalahari'],['priority','Low'],['priority','Normal'],['priority','High'],['priority','Urgent']];
async function init(){await pool.query(schema);
await pool.query("alter table diesel add column if not exists price_per_litre numeric default 0");
await pool.query("alter table diesel add column if not exists station text");
await pool.query("alter table diesel add column if not exists pump text");
await pool.query("alter table diesel add column if not exists attendant text");
await pool.query("alter table diesel add column if not exists manual_fields text");
let email=process.env.ADMIN_EMAIL||'admin@angermundtransport.com',pass=process.env.ADMIN_PASSWORD||'admin123';let r=await pool.query('select id from users where email=$1',[email]);if(!r.rowCount)await pool.query('insert into users(email,password_hash,name,role) values($1,$2,$3,$4)',[email,await bcrypt.hash(pass,10),'Admin','admin']);for(const [t,v] of seed)await pool.query('insert into masters(type,value) values($1,$2) on conflict do nothing',[t,v]);}
init().catch(console.error);

function auth(req,res,next){try{req.user=jwt.verify((req.headers.authorization||'').replace('Bearer ',''),SECRET);next()}catch{res.status(401).json({error:'Not logged in'})}}
function admin(req,res,next){if(!['admin','manager'].includes(req.user.role))return res.status(403).json({error:'No permission'});next()}
function safe(u){let {password_hash,...x}=u;return x}
function tripCalc(t){let income=Number(t.km||0)*Number(t.rate_km||0);let cost=['diesel_cost','tolls','permits_cost','food_money','border_cost','repairs','other_cost'].reduce((a,k)=>a+Number(t[k]||0),0);return{income,cost,profit:income-cost}}


function csvEscape(v){ return '"' + String(v ?? '').replace(/"/g,'""') + '"'; }
async function logIntegration(integration,direction,status,message,payload={}){
  try{ await pool.query("insert into integration_logs(integration,direction,status,message,payload) values($1,$2,$3,$4,$5)",[integration,direction,status,message,payload]); }catch(e){ console.error(e); }
}
async function postWebhook(event,payload){
  if(!process.env.WEBHOOK_URL) return {skipped:true};
  try{
    const resp=await fetch(process.env.WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,payload})});
    return {ok:resp.ok,status:resp.status};
  }catch(e){ return {ok:false,error:e.message}; }
}

app.post('/api/auth/login',async(req,res)=>{let{email,password}=req.body;let r=await pool.query('select * from users where lower(email)=lower($1)',[email]);if(!r.rowCount||!await bcrypt.compare(password||'',r.rows[0].password_hash))return res.status(401).json({error:'Invalid login'});let user=safe(r.rows[0]);res.json({user,token:jwt.sign(user,SECRET,{expiresIn:'7d'})})});
app.get('/api/me',auth,(req,res)=>res.json({user:req.user}));
app.get('/api/options',auth,async(req,res)=>{let rows=(await pool.query('select type,value from masters order by type,value')).rows,out={};rows.forEach(r=>(out[r.type] ||= []).push(r.value));res.json(out)});
app.get('/api/dashboard',auth,async(req,res)=>{let trips=(await pool.query('select * from trips order by created_at desc')).rows;let diesel=(await pool.query('select coalesce(sum(amount),0) v from diesel')).rows[0].v;let expenses=Number(diesel),revenue=0,km=0;trips.forEach(t=>{let c=tripCalc(t);revenue+=c.income;expenses+=c.cost;km+=Number(t.km||0)});let alerts=(await pool.query("select item||' - '||owner||' expires on '||expiry_date message from permits where expiry_date <= current_date + interval '45 days' union all select title||' due on '||due_date from reminders where status <> 'Closed' and due_date <= current_date + interval '14 days' limit 40")).rows;let gps=(await pool.query('select * from gps_points order by created_at desc limit 10')).rows;res.json({metrics:{revenue,expenses,profit:revenue-expenses,km,diesel:Number(diesel)},recent:trips.slice(0,8),alerts,gps})});
app.get('/api/:table',auth,async(req,res)=>{let t=tableMap[req.params.table];if(!t)return res.status(404).json({error:'Unknown table'});let rows=(await pool.query(`select ${t==='users'?'id,email,name,role,created_at':'*'} from ${t} order by created_at desc limit 1000`)).rows;res.json({rows})});
app.post('/api/users',auth,admin,async(req,res)=>{let{email,password,name,role}=req.body;let r=await pool.query('insert into users(email,password_hash,name,role) values($1,$2,$3,$4) returning id,email,name,role,created_at',[email,await bcrypt.hash(password||'password123',10),name,role||'driver']);res.json({row:r.rows[0]})});
app.post('/api/gps',auth,async(req,res)=>{let{lat,lng,accuracy,driver,truck}=req.body;let r=await pool.query('insert into gps_points(email,driver,truck,lat,lng,accuracy) values($1,$2,$3,$4,$5,$6) returning *',[req.user.email,driver||req.user.name||req.user.email,truck||'',lat,lng,accuracy||0]);res.json({row:r.rows[0]})});
app.post('/api/:table',auth,async(req,res)=>{let t=tableMap[req.params.table];if(!t||t==='users')return res.status(404).json({error:'Unknown table'});let obj=req.body||{};if(t==='trips')obj.km=Number(obj.km||0)||Math.max(0,Number(obj.end_km||0)-Number(obj.start_km||0));let keys=Object.keys(obj).filter(k=>obj[k]!==''&&obj[k]!==undefined);if(!keys.length)return res.status(400).json({error:'No data'});let vals=keys.map(k=>obj[k]);let r=await pool.query(`insert into ${t}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,vals);res.json({row:r.rows[0]})});
app.put('/api/:table/:id',auth,async(req,res)=>{let t=tableMap[req.params.table];if(!t||t==='users')return res.status(404).json({error:'Unknown table'});let keys=Object.keys(req.body||{});let vals=keys.map(k=>req.body[k]);let r=await pool.query(`update ${t} set ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')} where id=$${keys.length+1} returning *`,[...vals,req.params.id]);res.json({row:r.rows[0]})});
app.delete('/api/:table/:id',auth,admin,async(req,res)=>{let t=tableMap[req.params.table];if(!t||t==='users')return res.status(404).json({error:'Unknown table'});await pool.query(`delete from ${t} where id=$1`,[req.params.id]);res.json({ok:true})});


async function scanAI(file){
  if(!process.env.OPENAI_API_KEY){
    return {
      manual_required:true,
      confidence:0,
      api_error:"OPENAI_API_KEY is not set in Railway Variables",
      reason:"AI key not configured. Driver must enter manually."
    };
  }

  const b64=fs.readFileSync(file).toString('base64');
  const prompt = `You are a fuel slip OCR reader for a transport company.
Extract all readable fields from the receipt image.

Return ONLY valid JSON. No markdown.

JSON format:
{
  "supplier": string|null,
  "station": string|null,
  "date": "YYYY-MM-DD"|null,
  "time": string|null,
  "truck": string|null,
  "odometer": number|null,
  "product": string|null,
  "litres": number|null,
  "price_per_litre": number|null,
  "amount": number|null,
  "pump": string|null,
  "attendant": string|null,
  "slip_no": string|null,
  "confidence": number,
  "manual_fields": string[],
  "manual_required": boolean,
  "reason": string
}

Rules:
- Do NOT reject the full slip if only some fields are unclear.
- If amount and litres are readable, manual_required must be false.
- If a field is unclear, set only that field to null and include that field name in manual_fields.
- Never guess unreadable numbers.
- For Namibian receipts, amount may be shown as TOTAL, Amount in NAD, N$, NAD, or CREDIT CARD.
- Litres may appear as L, litres, DIESEL line, SFSDiesel L.
- If date shows 27/04/2026, return 2026-04-27.
- If product says DIESEL-50PP or SFSDiesel, product is diesel.`;

  let resp;
  try{
    resp=await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.OPENAI_API_KEY},
      body:JSON.stringify({
        model:process.env.AI_MODEL||'gpt-4o-mini',
        temperature:0,
        response_format:{type:"json_object"},
        messages:[{role:'user',content:[
          {type:'text',text:prompt},
          {type:'image_url',image_url:{url:`data:image/jpeg;base64,${b64}`}}
        ]}]
      })
    });
  }catch(e){
    return {manual_required:true,confidence:0,api_error:e.message,reason:"Could not reach OpenAI. Driver must enter manually."};
  }

  const data=await resp.json().catch(()=>({}));
  if(!resp.ok || data.error){
    return {
      manual_required:true,
      confidence:0,
      api_error:data.error?.message || JSON.stringify(data),
      reason:"OpenAI returned an error. Check Railway OPENAI_API_KEY, billing, model name and redeploy."
    };
  }

  const txt=data.choices?.[0]?.message?.content || '{}';
  try{
    const parsed=JSON.parse(txt);
    parsed.confidence = Number(parsed.confidence || 0);
    parsed.manual_fields = Array.isArray(parsed.manual_fields) ? parsed.manual_fields : [];
    if(parsed.amount != null && parsed.litres != null && parsed.confidence >= 0.45){
      parsed.manual_required = false;
    }
    return parsed;
  }catch(e){
    return {manual_required:true,confidence:0,raw:txt,api_error:e.message,reason:"AI returned invalid JSON. Driver must enter manually."};
  }
}

app.post('/api/slips/scan',auth,upload.single('slip'),async(req,res)=>{
  if(!req.file)return res.status(400).json({error:'No file'});
  try{
    const scan=await scanAI(req.file.path);
    scan.slip_url='/uploads/'+req.file.filename;

    const hasCore = scan.amount!=null && scan.litres!=null;
    const ok = hasCore && Number(scan.confidence||0) >= 0.45;

    res.json({
      scan_status: ok ? 'partial_auto' : 'manual_required',
      scan,
      message: ok
        ? 'Core diesel fields accepted. Only missing fields need manual entry.'
        : 'Driver must enter unreadable core fields manually. See api_error/reason.'
    });
  }catch(e){
    res.json({
      scan_status:'manual_required',
      scan:{confidence:0,reason:e.message,slip_url:'/uploads/'+req.file.filename},
      message:'Driver must enter manually.'
    });
  }
});


app.get('/api/accounting/summary',auth,async(req,res)=>{
  const income=(await pool.query("select coalesce(sum(credit),0) v from account_transactions where type='Income'")).rows[0].v;
  const expense=(await pool.query("select coalesce(sum(debit),0) v from account_transactions where type='Expense'")).rows[0].v;
  const receivable=(await pool.query("select coalesce(sum(amount-paid),0) v from invoices")).rows[0].v;
  const unpaid=(await pool.query("select * from invoices where coalesce(amount,0)>coalesce(paid,0) order by date desc limit 20")).rows;
  const recent=(await pool.query("select * from account_transactions order by created_at desc limit 30")).rows;
  res.json({income:Number(income||0),expense:Number(expense||0),profit:Number(income||0)-Number(expense||0),receivable:Number(receivable||0),unpaid,recent});
});
app.post('/api/accounting/sync',auth,async(req,res)=>{
  await pool.query("delete from account_transactions where source_module in ('trips','diesel','maintenance','payroll','invoices')");
  const trips=(await pool.query("select * from trips")).rows;
  for(const t of trips){
    const income=Number(t.km||0)*Number(t.rate_km||0);
    const cost=Number(t.diesel_cost||0)+Number(t.tolls||0)+Number(t.permits_cost||0)+Number(t.food_money||0)+Number(t.border_cost||0)+Number(t.repairs||0)+Number(t.other_cost||0);
    if(income) await pool.query("insert into account_transactions(type,account,description,reference,credit,source_module,source_id) values('Income','Transport Income',$1,$2,$3,'trips',$4)",[t.route||'Trip income',t.trip_no||String(t.id),income,t.id]);
    if(cost) await pool.query("insert into account_transactions(type,account,description,reference,debit,source_module,source_id) values('Expense','Trip Expenses',$1,$2,$3,'trips',$4)",[t.route||'Trip expenses',t.trip_no||String(t.id),cost,t.id]);
  }
  const diesel=(await pool.query("select * from diesel")).rows;
  for(const d of diesel){ if(Number(d.amount||0)) await pool.query("insert into account_transactions(type,account,description,reference,debit,source_module,source_id) values('Expense','Diesel Expense',$1,$2,$3,'diesel',$4)",[d.supplier||'Diesel',d.slip_no||String(d.id),d.amount,d.id]); }
  const maint=(await pool.query("select * from maintenance")).rows;
  for(const m of maint){ if(Number(m.cost||0)) await pool.query("insert into account_transactions(type,account,description,reference,debit,source_module,source_id) values('Expense','Repairs & Maintenance',$1,$2,$3,'maintenance',$4)",[m.issue||'Maintenance',m.truck||String(m.id),m.cost,m.id]); }
  const pay=(await pool.query("select * from payroll")).rows;
  for(const p of pay){ const amt=Number(p.basic_salary||0)+Number(p.overtime_hours||0)*50-Number(p.deductions||0)+Number(p.advance||0); if(amt) await pool.query("insert into account_transactions(type,account,description,reference,debit,source_module,source_id) values('Expense','Payroll Expense',$1,$2,$3,'payroll',$4)",[p.employee||'Payroll',p.date||String(p.id),amt,p.id]); }
  const inv=(await pool.query("select * from invoices")).rows;
  for(const i of inv){ if(Number(i.amount||0)) await pool.query("insert into account_transactions(type,account,description,reference,credit,source_module,source_id) values('Income','Accounts Receivable',$1,$2,$3,'invoices',$4)",[i.client||'Invoice',i.invoice_no||String(i.id),i.amount,i.id]); }
  res.json({ok:true});
});


async function scanDocumentAI(file, docType){
  if(!process.env.OPENAI_API_KEY){
    return {manual_required:true,confidence:0,api_error:"OPENAI_API_KEY is not set",reason:"AI key missing."};
  }
  const b64=fs.readFileSync(file).toString('base64');
  const prompt=`You are an AI document scanner for a Namibian transport ERP.
Document type: ${docType}.
Extract readable fields. Return ONLY JSON:
{
 "doc_type": "${docType}",
 "supplier": string|null,
 "invoice_no": string|null,
 "date": "YYYY-MM-DD"|null,
 "truck": string|null,
 "amount": number|null,
 "vat": number|null,
 "description": string|null,
 "confidence": number,
 "manual_fields": string[],
 "manual_required": boolean,
 "reason": string
}
Rules:
- Never guess unreadable amounts or invoice numbers.
- If amount is readable, fill it even if other fields are missing.
- Only put unclear fields in manual_fields.
- For permit/license docs, put expiry date in date and permit number in invoice_no.
- For tyre invoices, include tyre serial/brand/size in description.
- For workshop/damage photos, describe visible damage and set amount null if no amount is visible.`;
  try{
    const resp=await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.OPENAI_API_KEY},
      body:JSON.stringify({
        model:process.env.AI_MODEL||'gpt-4o-mini',
        temperature:0,
        response_format:{type:"json_object"},
        messages:[{role:'user',content:[
          {type:'text',text:prompt},
          {type:'image_url',image_url:{url:`data:image/jpeg;base64,${b64}`}}
        ]}]
      })
    });
    const data=await resp.json().catch(()=>({}));
    if(!resp.ok || data.error){
      return {manual_required:true,confidence:0,api_error:data.error?.message||JSON.stringify(data),reason:"OpenAI error."};
    }
    const txt=data.choices?.[0]?.message?.content||'{}';
    const parsed=JSON.parse(txt);
    parsed.confidence=Number(parsed.confidence||0);
    parsed.manual_fields=Array.isArray(parsed.manual_fields)?parsed.manual_fields:[];
    return parsed;
  }catch(e){
    return {manual_required:true,confidence:0,api_error:e.message,reason:"AI scanner failed."};
  }
}

app.post('/api/ai/scan/:docType',auth,upload.single('file'),async(req,res)=>{
  if(!req.file)return res.status(400).json({error:'No file uploaded'});
  const docType=req.params.docType;
  const scan=await scanDocumentAI(req.file.path, docType);
  const fileUrl='/uploads/'+req.file.filename;
  const ok=Number(scan.confidence||0)>=0.45 && (scan.amount!=null || scan.invoice_no || scan.description);
  const r=await pool.query(
    "insert into ai_documents(doc_type,file_url,supplier,invoice_no,date,truck,amount,vat,description,confidence,manual_fields,scan_json,status) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning *",
    [docType,fileUrl,scan.supplier||'',scan.invoice_no||'',scan.date||null,scan.truck||'',scan.amount||0,scan.vat||0,scan.description||'',scan.confidence||0,(scan.manual_fields||[]).join(', '),scan,ok?'Scanned':'Manual Required']
  );
  res.json({scan_status:ok?'partial_auto':'manual_required',scan:{...scan,file_url:fileUrl},row:r.rows[0]});
});

app.post('/api/ai/fraud-check',auth,async(req,res)=>{
  await pool.query("delete from ai_alerts where alert_type='fraud'");
  const diesel=(await pool.query("select * from diesel order by date desc, created_at desc")).rows;
  const alerts=[];
  const seen=new Set();
  for(const d of diesel){
    const key=[d.slip_no,d.amount,d.litres,d.truck].join('|');
    if(d.slip_no && seen.has(key)){
      alerts.push(['fraud','High','Duplicate diesel slip','Possible duplicate slip '+d.slip_no+' for '+(d.truck||'unknown truck')]);
    }
    seen.add(key);
    if(Number(d.litres||0)>800) alerts.push(['fraud','High','Large diesel litres','Slip has '+d.litres+' litres for '+(d.truck||'unknown truck')]);
    if(Number(d.amount||0)>25000) alerts.push(['fraud','Normal','Large diesel amount','Slip amount '+d.amount+' for '+(d.truck||'unknown truck')]);
  }
  for(const a of alerts){
    await pool.query("insert into ai_alerts(alert_type,severity,title,message) values($1,$2,$3,$4)",a);
  }
  res.json({alerts:alerts.length});
});

app.post('/api/ai/assistant',auth,async(req,res)=>{
  const question=(req.body?.question||'').slice(0,1000);
  const trips=(await pool.query("select route,driver,truck,km,rate_km,diesel_cost,tolls,permits_cost,food_money,border_cost,repairs,other_cost,status,date from trips order by created_at desc limit 50")).rows;
  const diesel=(await pool.query("select truck,driver,litres,amount,km,supplier,date from diesel order by created_at desc limit 50")).rows;
  const invoices=(await pool.query("select client,invoice_no,amount,paid,status,date from invoices order by created_at desc limit 30")).rows;
  if(!process.env.OPENAI_API_KEY){
    return res.json({answer:"AI key not configured. Add OPENAI_API_KEY in Railway variables."});
  }
  try{
    const resp=await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.OPENAI_API_KEY},
      body:JSON.stringify({
        model:process.env.AI_MODEL||'gpt-4o-mini',
        temperature:0.2,
        messages:[
          {role:'system',content:'You are an assistant for Angermund Transport ERP. Give practical, short business advice from the provided ERP data. Use Namibian dollars.'},
          {role:'user',content:JSON.stringify({question,trips,diesel,invoices})}
        ]
      })
    });
    const data=await resp.json();
    res.json({answer:data.choices?.[0]?.message?.content||data.error?.message||'No answer'});
  }catch(e){res.json({answer:e.message})}
});


app.get('/api/integrations/status',auth,async(req,res)=>{
  res.json({
    quickbooks:{
      configured:!!(process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_CLIENT_SECRET),
      connected:!!(process.env.QUICKBOOKS_ACCESS_TOKEN || process.env.QUICKBOOKS_REFRESH_TOKEN || process.env.QUICKBOOKS_REALM_ID),
      realm_id:process.env.QUICKBOOKS_REALM_ID ? 'set' : 'missing'
    },
    xero:{
      configured:!!(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET),
      connected:!!(process.env.XERO_ACCESS_TOKEN && process.env.XERO_TENANT_ID)
    },
    webhook:{configured:!!process.env.WEBHOOK_URL}
  });
});

app.get('/api/quickbooks/connect-url',auth,admin,async(req,res)=>{
  if(!process.env.QUICKBOOKS_CLIENT_ID || !process.env.QUICKBOOKS_REDIRECT_URI){
    return res.json({error:'Set QUICKBOOKS_CLIENT_ID and QUICKBOOKS_REDIRECT_URI in Railway first.'});
  }
  const state=Math.random().toString(36).slice(2);
  const scope=encodeURIComponent('com.intuit.quickbooks.accounting openid profile email');
  const url=`https://appcenter.intuit.com/connect/oauth2?client_id=${process.env.QUICKBOOKS_CLIENT_ID}&scope=${scope}&redirect_uri=${encodeURIComponent(process.env.QUICKBOOKS_REDIRECT_URI)}&response_type=code&access_type=offline&state=${state}`;
  res.json({url});
});

app.get('/api/quickbooks/callback',async(req,res)=>{
  await logIntegration('quickbooks','oauth','callback','Received QuickBooks callback',{query:req.query});
  res.send('QuickBooks callback received. Copy the code/realmId from the URL into Railway variables or finish token exchange in the next version.');
});

app.post('/api/quickbooks/export',auth,admin,async(req,res)=>{
  const rows=(await pool.query("select * from account_transactions order by date, id")).rows;
  const csv=['Date,Type,Account,Description,Reference,Debit,Credit'].concat(rows.map(r=>[
    r.date,r.type,r.account,r.description,r.reference,r.debit,r.credit
  ].map(csvEscape).join(','))).join('\\n');
  await logIntegration('quickbooks','export','ready','QuickBooks CSV export generated',{rows:rows.length});
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition','attachment; filename=quickbooks-accounting-export.csv');
  res.send(csv);
});

app.post('/api/xero/export',auth,admin,async(req,res)=>{
  const inv=(await pool.query("select * from invoices order by date desc")).rows;
  const csv=['ContactName,InvoiceNumber,InvoiceDate,DueDate,Description,Quantity,UnitAmount,AccountCode,TaxType'].concat(inv.map(i=>[
    i.client,i.invoice_no,i.date,i.date,i.route||'Transport service',1,i.amount,'200','No VAT'
  ].map(csvEscape).join(','))).join('\\n');
  await logIntegration('xero','export','ready','Xero invoice CSV export generated',{rows:inv.length});
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition','attachment; filename=xero-invoice-export.csv');
  res.send(csv);
});

app.post('/api/webhook/test',auth,admin,async(req,res)=>{
  const result=await postWebhook('test',{message:'Angermund ERP webhook test',user:req.user.email});
  await logIntegration('webhook','out','test','Webhook test sent',result);
  res.json(result);
});

app.post('/api/driver/quick-upload',auth,upload.array('files',10),async(req,res)=>{
  const driver=req.body.driver || req.user.name || req.user.email;
  const truck=req.body.truck || '';
  const docType=req.body.doc_type || 'auto';
  const created=[];
  for(const file of req.files||[]){
    const fileUrl='/uploads/'+file.filename;
    const q=await pool.query("insert into upload_queue(driver,truck,doc_type,file_url,status) values($1,$2,$3,$4,'Queued') returning *",[driver,truck,docType,fileUrl]);
    created.push(q.rows[0]);
  }
  res.json({queued:created.length,rows:created});
});

app.post('/api/driver/process-queue',auth,async(req,res)=>{
  const limit=Number(req.body?.limit||10);
  const rows=(await pool.query("select * from upload_queue where status in ('Queued','Manual Required') order by created_at asc limit $1",[limit])).rows;
  const processed=[];
  for(const q of rows){
    const fullPath=path.join(__dirname,q.file_url.replace('/uploads/','uploads/'));
    if(!fs.existsSync(fullPath)){ await pool.query("update upload_queue set status='File Missing' where id=$1",[q.id]); continue; }
    const scan=await scanDocumentAI(fullPath,q.doc_type||'auto');
    const hasUseful=scan.amount!=null || scan.invoice_no || scan.description;
    let status=hasUseful?'Scanned':'Manual Required';
    let created_records='';
    if(hasUseful){
      await pool.query(
        "insert into ai_documents(doc_type,file_url,supplier,invoice_no,date,truck,amount,vat,description,confidence,manual_fields,scan_json,status) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
        [q.doc_type,q.file_url,scan.supplier||'',scan.invoice_no||'',scan.date||null,scan.truck||q.truck||'',scan.amount||0,scan.vat||0,scan.description||'',scan.confidence||0,(scan.manual_fields||[]).join(', '),scan,status]
      );
      created_records='ai_documents';
    }
    await pool.query("update upload_queue set status=$1, scan_status=$2, result_json=$3, created_records=$4 where id=$5",[status,status,scan,created_records,q.id]);
    processed.push({id:q.id,status,scan});
  }
  res.json({processed});
});

app.post('/api/ai/auto-sort',auth,async(req,res)=>{
  const docs=(await pool.query("select * from ai_documents where status in ('Scanned','Manual Required') order by created_at desc limit 50")).rows;
  let made=0;
  for(const d of docs){
    if(d.doc_type==='invoice' && Number(d.amount||0)>0 && d.invoice_no){
      const exists=await pool.query("select id from invoices where invoice_no=$1",[d.invoice_no]);
      if(!exists.rowCount){
        await pool.query("insert into invoices(client,invoice_no,date,amount,status,route) values($1,$2,$3,$4,'Unpaid',$5)",[d.supplier||'Unknown',d.invoice_no,d.date||null,d.amount,d.description||'AI invoice']);
        made++;
      }
    }
    if(d.doc_type==='permit' && d.date && d.invoice_no){
      const exists=await pool.query("select id from permits where item=$1 and owner=$2",[d.invoice_no,d.truck||d.supplier||'']);
      if(!exists.rowCount){
        await pool.query("insert into permits(item,owner,type,expiry_date,cost,status) values($1,$2,'AI scanned permit',$3,$4,'Valid')",[d.invoice_no,d.truck||d.supplier||'',d.date,d.amount||0]);
        made++;
      }
    }
  }
  res.json({created:made});
});

app.get('/api/export/:table/:format',auth,async(req,res)=>{let t=tableMap[req.params.table];if(!t)return res.status(404).send('Unknown');let rows=(await pool.query(`select * from ${t} order by created_at desc`)).rows;let f=req.params.format;if(f==='json')return res.json(rows);if(f==='xlsx'){let wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),req.params.table);res.setHeader('Content-Disposition',`attachment; filename=${req.params.table}.xlsx`);return res.send(XLSX.write(wb,{type:'buffer',bookType:'xlsx'}))}if(f==='csv'){res.setHeader('Content-Type','text/csv');res.setHeader('Content-Disposition',`attachment; filename=${req.params.table}.csv`);let h=Object.keys(rows[0]||{});return res.send([h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\\n'))}let doc=new PDFDocument({margin:30});res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename=${req.params.table}.pdf`);doc.pipe(res);doc.fontSize(18).text('Angermund Transport - '+req.params.table.toUpperCase());rows.slice(0,200).forEach((r,i)=>doc.fontSize(8).text((i+1)+'. '+JSON.stringify(r)));doc.end()});
app.get('/api/invoice/:id/pdf',auth,async(req,res)=>{let r=await pool.query('select * from invoices where id=$1',[req.params.id]);if(!r.rowCount)return res.status(404).send('Not found');let i=r.rows[0],doc=new PDFDocument({margin:50});res.setHeader('Content-Type','application/pdf');doc.pipe(res);doc.fontSize(22).text('ANGERMUND TRANSPORT',{align:'center'});doc.moveDown().fontSize(15).text('Invoice: '+(i.invoice_no||i.id));doc.text('Client: '+(i.client||''));doc.text('Route: '+(i.route||''));doc.text('Amount: N$ '+Number(i.amount||0).toFixed(2));doc.text('Paid: N$ '+Number(i.paid||0).toFixed(2));doc.text('Balance: N$ '+(Number(i.amount||0)-Number(i.paid||0)).toFixed(2));doc.end()});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log('ERP v2 running '+PORT));
