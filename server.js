
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

const tableMap={trips:'trips',trucks:'trucks',drivers:'drivers',diesel:'diesel',permits:'permits',payroll:'payroll',workers:'workers',maintenance:'maintenance',tyres:'tyres',workshop:'workshop_jobs',fines:'fines_damages',border:'border_logs',gps:'gps_points',invoices:'invoices',users:'users',reminders:'reminders',masters:'masters'};

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

app.get('/api/export/:table/:format',auth,async(req,res)=>{let t=tableMap[req.params.table];if(!t)return res.status(404).send('Unknown');let rows=(await pool.query(`select * from ${t} order by created_at desc`)).rows;let f=req.params.format;if(f==='json')return res.json(rows);if(f==='xlsx'){let wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),req.params.table);res.setHeader('Content-Disposition',`attachment; filename=${req.params.table}.xlsx`);return res.send(XLSX.write(wb,{type:'buffer',bookType:'xlsx'}))}if(f==='csv'){res.setHeader('Content-Type','text/csv');res.setHeader('Content-Disposition',`attachment; filename=${req.params.table}.csv`);let h=Object.keys(rows[0]||{});return res.send([h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\\n'))}let doc=new PDFDocument({margin:30});res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename=${req.params.table}.pdf`);doc.pipe(res);doc.fontSize(18).text('Angermund Transport - '+req.params.table.toUpperCase());rows.slice(0,200).forEach((r,i)=>doc.fontSize(8).text((i+1)+'. '+JSON.stringify(r)));doc.end()});
app.get('/api/invoice/:id/pdf',auth,async(req,res)=>{let r=await pool.query('select * from invoices where id=$1',[req.params.id]);if(!r.rowCount)return res.status(404).send('Not found');let i=r.rows[0],doc=new PDFDocument({margin:50});res.setHeader('Content-Type','application/pdf');doc.pipe(res);doc.fontSize(22).text('ANGERMUND TRANSPORT',{align:'center'});doc.moveDown().fontSize(15).text('Invoice: '+(i.invoice_no||i.id));doc.text('Client: '+(i.client||''));doc.text('Route: '+(i.route||''));doc.text('Amount: N$ '+Number(i.amount||0).toFixed(2));doc.text('Paid: N$ '+Number(i.paid||0).toFixed(2));doc.text('Balance: N$ '+(Number(i.amount||0)-Number(i.paid||0)).toFixed(2));doc.end()});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log('ERP v2 running '+PORT));
