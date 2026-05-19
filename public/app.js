
let token=localStorage.getItem('token')||'', user=null, cache={}, opts={};
const money=n=>'N$ '+Number(n||0).toLocaleString('en-NA',{minimumFractionDigits:2,maximumFractionDigits:2});
async function api(path,opt={}){opt.headers={...(opt.headers||{}),'Content-Type':'application/json'};if(token)opt.headers.Authorization='Bearer '+token;if(opt.body&&typeof opt.body!=='string')opt.body=JSON.stringify(opt.body);let r=await fetch('/api'+path,opt),j=await r.json().catch(()=>({error:'Server error'}));if(!r.ok)throw new Error(j.error||'Request failed');return j}

const dropdowns={
 route:'route', client:'client', supplier:'supplier', status:'status', role:'role', type:'permit_type', border_post:'border_post', priority:'priority',
 truck:'trucks', trailer:'trucks', driver:'drivers', owner:'owners', employee:'workers_names', name:'workers_names'
};
const tables={
 trips:{title:'Trips',fields:['trip_no','date','route','from_place','to_place','client','load_desc','truck','trailer','driver','start_km','end_km','km','rate_km','diesel_cost','tolls','permits_cost','food_money','border_cost','repairs','other_cost','status']},
 trucks:{title:'Fleet / Trucks',fields:['truck_no','trailer_no','make_model','driver','status','current_km','next_service_km','license_expiry','roadworthy_expiry','insurance_expiry']},
 drivers:{title:'Drivers',fields:['name','phone','email','license_expiry','pdp_expiry','passport_expiry','status']},
 diesel:{title:'Diesel + Slip AI',fields:['date','truck','driver','litres','price_per_litre','amount','km','supplier','station','slip_no','pump','attendant','scan_status','scan_confidence','manual_fields']},
 permits:{title:'Permits',fields:['item','owner','type','expiry_date','cost','status']},
 payroll:{title:'Payroll',fields:['date','employee','role','basic_salary','days_worked','overtime_hours','advance','deductions']},
 workers:{title:'Site Workers',fields:['date','name','site','role','status','hours','overtime','rate','advance']},
 maintenance:{title:'Maintenance',fields:['date','truck','issue','cost','next_service_km','status']},
 tyres:{title:'Tyres',fields:['date','truck','position','brand','serial_no','cost','km_fitted','status']},
 workshop:{title:'Workshop Jobs',fields:['date','truck','job_no','description','mechanic','parts_cost','labour_cost','status']},
 fines:{title:'Fines / Damages',fields:['date','driver','truck','type','description','amount','responsible_party','status']},
 border:{title:'Border Logs',fields:['date','truck','driver','border_post','direction','arrival_time','release_time','fees','delay_reason']},
 gps:{title:'GPS Tracking',fields:['email','driver','truck','lat','lng','accuracy']},
 invoices:{title:'Invoices',fields:['date','client','invoice_no','route','amount','paid','status']},
 reminders:{title:'Reminders',fields:['title','module','related_name','due_date','priority','status','notes']},
 masters:{title:'Dropdown Lists',fields:['type','value']},
 accounts:{title:'Accounts',fields:['code','name','type','balance']},transactions:{title:'Transactions',fields:['date','type','account','description','reference','debit','credit']},vendors:{title:'Vendors',fields:['name','phone','email','vat_no']},customers:{title:'Customers',fields:['name','phone','email','vat_no']},payments:{title:'Payments',fields:['date','party','method','reference','amount','status','notes']},ai_documents:{title:'AI Documents',fields:['doc_type','supplier','invoice_no','date','truck','amount','vat','description','confidence','manual_fields','status']},ai_alerts:{title:'AI Alerts',fields:['alert_type','severity','title','message','status']},upload_queue:{title:'Upload Queue',fields:['driver','truck','doc_type','file_url','status','scan_status','created_records']},integration_logs:{title:'Integration Logs',fields:['integration','direction','status','message']},users:{title:'Users',fields:['email','password','name','role']}
};

async function doLogin(){try{let r=await api('/auth/login',{method:'POST',body:{email:email.value,password:password.value}});token=r.token;user=r.user;localStorage.setItem('token',token);loginBox.classList.add('hidden');appBox.classList.remove('hidden');userEmail.innerText=user.email;await loadAll()}catch(e){loginMsg.innerText=e.message}}
function logout(){localStorage.removeItem('token');location.reload()}
function toggleMenu(){side.classList.toggle('open')}
function show(id,btn){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.nav').forEach(n=>n.classList.remove('active'));if(btn)btn.classList.add('active');side.classList.remove('open')}
async function loadAll(){let d=await api('/dashboard');opts=await api('/options');renderDash(d);for(let t of Object.keys(tables)){cache[t]=(await api('/'+t)).rows}buildDynamicOptions();renderPages()}
function buildDynamicOptions(){opts.trucks=(cache.trucks||[]).map(x=>x.truck_no).filter(Boolean);opts.drivers=(cache.drivers||[]).map(x=>x.name).filter(Boolean);opts.owners=[...(opts.trucks||[]),...(opts.drivers||[])];opts.workers_names=(cache.workers||[]).map(x=>x.name).filter(Boolean)}
function tripCalc(t){let income=Number(t.km||0)*Number(t.rate_km||0);let cost=['diesel_cost','tolls','permits_cost','food_money','border_cost','repairs','other_cost'].reduce((a,k)=>a+Number(t[k]||0),0);return{income,cost,profit:income-cost}}
function pl(v){return `<span class="${Number(v)>=0?'profit':'loss'}">${money(v)}</span>`}
function renderDash(d){mRevenue.innerText=money(d.metrics.revenue);mExpenses.innerText=money(d.metrics.expenses);mProfit.innerText=money(d.metrics.profit);mKm.innerText=Number(d.metrics.km).toLocaleString();mDiesel.innerText=money(d.metrics.diesel);table(recentTrips,d.recent,['Route','Driver','Truck','KM','Rate/KM','Income','Cost','Profit'],r=>[r.route,r.driver,r.truck,r.km,money(r.rate_km),money(tripCalc(r).income),money(tripCalc(r).cost),pl(tripCalc(r).profit)]);alerts.innerHTML=(d.alerts||[]).map(a=>`<p>⚠️ ${a.message}</p>`).join('')||'<p>No urgent alerts</p>';gpsMini.innerHTML=(d.gps||[]).map(g=>`<p>${g.driver||g.email}: <a style="color:#5aa7ff" target="_blank" href="https://maps.google.com/?q=${g.lat},${g.lng}">Open Map</a></p>`).join('')||'<p>No GPS yet</p>';renderGroups(d.recent||[])}
function table(el,rows,heads,map){el.innerHTML='<thead><tr>'+heads.map(h=>`<th>${h}</th>`).join('')+'</tr></thead><tbody>'+(rows||[]).map((r,i)=>'<tr>'+map(r,i).map(c=>`<td>${c??''}</td>`).join('')+'</tr>').join('')+'</tbody>'}
function renderGroups(rows){function g(k){let o={};(cache.trips||rows).forEach(t=>{let x=t[k]||'Unknown';o[x]=(o[x]||0)+tripCalc(t).profit});return Object.entries(o).map(([k,v])=>`<div class="line"><span>${k}</span>${pl(v)}</div>`).join('')}profitDriver.innerHTML=g('driver');profitTruck.innerHTML=g('truck');profitRoute.innerHTML=g('route')}
function renderPages(){Object.entries(tables).forEach(([key,cfg])=>{let sec=document.getElementById(key);if(!sec)return;let scan=key==='diesel'?`<div class="drop"><b>AI slip scanning</b><br><input type="file" id="slipFile"><button class="btn orange" onclick="scanSlip()">Scan Slip</button><pre id="scanResult">If unclear, driver enters manually.</pre></div>`:'';sec.innerHTML=`<div class="head"><h1>${cfg.title}</h1><button class="btn" onclick="openModal('${key}')">+ Add</button></div>${scan}<div class="card"><div class="tableWrap"><table id="${key}Table"></table></div></div>`;let heads=[...cfg.fields.filter(f=>f!=='password'),'Actions'];table(document.getElementById(key+'Table'),cache[key]||[],heads,r=>[...cfg.fields.filter(f=>f!=='password').map(f=>fmt(key,f,r)),act(key,r)])});renderExports();makeWhatsApp(false)}
function fmt(t,f,r){if(t==='invoices'&&f==='invoice_no')return `<a style="color:#5aa7ff" target="_blank" href="/api/invoice/${r.id}/pdf">${r[f]||r.id}</a>`;if(t==='gps'&&f==='lat')return `${r[f]||''} <a style="color:#5aa7ff" target="_blank" href="https://maps.google.com/?q=${r.lat},${r.lng}">Map</a>`;return r[f]??''}
function act(t,r){return `<button class="btn gray" onclick='editRow("${t}",${JSON.stringify(r).replace(/'/g,"&#39;")})'>Edit</button> <button class="btn red" onclick="delRow('${t}',${r.id})">Del</button>`}
function fieldHtml(f,row){let val=row[f]??'';let type=f.includes('date')||f.includes('expiry')?'date':'text';let key=dropdowns[f];let list=opts[key]||[];if(list.length){return `<label>${f}<select name="${f}"><option value="">-- choose --</option>${list.map(x=>`<option ${x==val?'selected':''}>${x}</option>`).join('')}</select></label>`}return `<label>${f}<input name="${f}" value="${val}" ${type==='date'?'type="date"':''}></label>`}
function openModal(t,row={}){modal.classList.add('show');modalTitle.innerText=(row.id?'Edit ':'Add ')+tables[t].title;modalForm.innerHTML='<div class="formGrid">'+tables[t].fields.map(f=>fieldHtml(f,row)).join('')+'</div><br><button class="btn" type="submit">Save</button>';modalForm.onsubmit=async(e)=>{e.preventDefault();let obj={};tables[t].fields.forEach(f=>obj[f]=modalForm.elements[f].value);try{if(row.id)await api('/'+t+'/'+row.id,{method:'PUT',body:obj});else await api('/'+t,{method:'POST',body:obj});closeModal();await loadAll()}catch(err){alert(err.message)}}}
function editRow(t,r){openModal(t,r)}
async function delRow(t,id){if(confirm('Delete record?')){await api('/'+t+'/'+id,{method:'DELETE'});await loadAll()}}
function closeModal(){modal.classList.remove('show')}
async function sendGPS(){navigator.geolocation.getCurrentPosition(async p=>{await api('/gps',{method:'POST',body:{lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy}});await loadAll();alert('GPS saved')},e=>alert(e.message),{enableHighAccuracy:true})}
async function scanSlip(){let f=slipFile.files[0];if(!f)return alert('Choose slip photo');let fd=new FormData();fd.append('slip',f);let r=await fetch('/api/slips/scan',{method:'POST',headers:{Authorization:'Bearer '+token},body:fd});let j=await r.json();scanResult.innerText=JSON.stringify(j.scan,null,2);if(j.scan_status==='scanned')openModal('diesel',{amount:j.scan.amount||'',litres:j.scan.litres||'',supplier:j.scan.supplier||'',slip_no:j.scan.slip_no||'',scan_status:j.scan_status,scan_confidence:j.scan.confidence||0});else{alert('AI not confident. Driver must enter manually.');openModal('diesel',{scan_status:'manual_required',scan_confidence:j.scan?.confidence||0})}}
function renderExports(){exportBox.innerHTML=Object.keys(tables).filter(t=>t!=='users').map(t=>`<div class="line"><b>${tables[t].title}</b><span><a class="btn gray" href="/api/export/${t}/csv">CSV</a> <a class="btn gray" href="/api/export/${t}/xlsx">Excel</a> <a class="btn gray" href="/api/export/${t}/pdf">PDF</a> <a class="btn gray" href="/api/export/${t}/json">JSON</a></span></div>`).join('')}
function makeWhatsApp(showMsg=true){let trips=cache.trips||[];let rev=trips.reduce((a,t)=>a+tripCalc(t).income,0),cost=trips.reduce((a,t)=>a+tripCalc(t).cost,0),km=trips.reduce((a,t)=>a+Number(t.km||0),0);waText.value=`ANGERMUND TRANSPORT REPORT\nDate: ${new Date().toLocaleDateString()}\nTrips: ${trips.length}\nRevenue: ${money(rev)}\nCosts: ${money(cost)}\nProfit: ${money(rev-cost)}\nKM: ${km.toLocaleString()}`;if(showMsg)alert('WhatsApp report ready')}
function openWhatsApp(){window.open('https://wa.me/?text='+encodeURIComponent(waText.value),'_blank')}
if(token){api('/me').then(r=>{user=r.user;loginBox.classList.add('hidden');appBox.classList.remove('hidden');userEmail.innerText=user.email;loadAll()}).catch(()=>logout())}


// V3 quick mobile actions + swipe drawer
function openQuickAdd(){
  const choice = prompt("Quick add: trip, diesel, gps, invoice, reminder", "diesel");
  if(!choice) return;
  if(choice === "gps") return sendGPS();
  if(tables[choice]) openModal(choice);
}
let touchStartX = 0;
document.addEventListener("touchstart", e => { touchStartX = e.touches[0].clientX; }, {passive:true});
document.addEventListener("touchend", e => {
  const x = e.changedTouches[0].clientX;
  if(touchStartX < 40 && x > 120) side.classList.add("open");
  if(touchStartX > 180 && x < 80) side.classList.remove("open");
}, {passive:true});

// Replace scanSlip with progress and partial acceptance
async function scanSlip(){
  let f = slipFile.files[0];
  if(!f) return alert("Choose slip photo");
  scanResult.innerHTML = "Uploading and scanning...<div class='progressBar' id='upBar'></div>";
  let bar = document.getElementById("upBar");
  let fd = new FormData();
  fd.append("slip", f);
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/slips/scan");
  xhr.setRequestHeader("Authorization", "Bearer " + token);
  xhr.upload.onprogress = e => { if(e.lengthComputable && bar) bar.style.width = Math.round(e.loaded/e.total*100)+"%"; };
  xhr.onload = () => {
    let j = {};
    try { j = JSON.parse(xhr.responseText); } catch { alert("Scan failed"); return; }
    scanResult.innerText = JSON.stringify(j.scan, null, 2);
    const s = j.scan || {};
    const row = {
      date:s.date || "", truck:s.truck || "", driver:"",
      litres:s.litres || "", amount:s.amount || "", price_per_litre:s.price_per_litre || "",
      km:s.odometer || "", supplier:s.supplier || "", station:s.station || "",
      slip_no:s.slip_no || "", pump:s.pump || "", attendant:s.attendant || "",
      scan_status:j.scan_status || "manual_required", scan_confidence:s.confidence || 0,
      manual_fields:(s.manual_fields || []).join(", ")
    };
    openModal("diesel", row);
    if(j.scan_status !== "manual_required") alert("Core fields accepted. Only check missing fields.");
    else alert("Only unreadable core fields must be entered manually.");
  };
  xhr.onerror = () => alert("Upload failed");
  xhr.send(fd);
}


// V4 OCR scan fix: show exact API error and auto-fill readable fields only.
async function scanSlip(){
  let f = slipFile.files[0];
  if(!f) return alert("Choose slip photo first");

  scanResult.innerHTML = "Uploading and scanning...<div class='progressBar' id='upBar'></div>";
  let bar = document.getElementById("upBar");

  let fd = new FormData();
  fd.append("slip", f);

  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/slips/scan");
  xhr.setRequestHeader("Authorization", "Bearer " + token);

  xhr.upload.onprogress = e => {
    if(e.lengthComputable && bar) bar.style.width = Math.round(e.loaded/e.total*100) + "%";
  };

  xhr.onload = () => {
    let j = {};
    try { j = JSON.parse(xhr.responseText); } catch { alert("Scan failed: server did not return JSON"); return; }

    const s = j.scan || {};
    scanResult.innerText = JSON.stringify(j, null, 2);

    if(s.api_error){
      alert("AI scan error: " + s.api_error);
    }

    const row = {
      date:s.date || "",
      truck:s.truck || "",
      driver:"",
      litres:s.litres || "",
      price_per_litre:s.price_per_litre || "",
      amount:s.amount || "",
      km:s.odometer || "",
      supplier:s.supplier || "",
      station:s.station || "",
      slip_no:s.slip_no || "",
      pump:s.pump || "",
      attendant:s.attendant || "",
      scan_status:j.scan_status || "manual_required",
      scan_confidence:s.confidence || 0,
      manual_fields:Array.isArray(s.manual_fields) ? s.manual_fields.join(", ") : (s.manual_fields || "")
    };

    openModal("diesel", row);

    if(j.scan_status === "partial_auto"){
      alert("Slip read. Check missing fields only.");
    } else {
      alert("Core fields not clear or AI key/model issue. See scan result.");
    }
  };

  xhr.onerror = () => alert("Upload failed");
  xhr.send(fd);
}

async function renderAccounting(){
  const sec=document.getElementById('accounting'); if(!sec)return;
  let d={income:0,expense:0,profit:0,receivable:0,unpaid:[],recent:[]};
  try{d=await api('/accounting/summary')}catch(e){console.warn(e)}
  sec.innerHTML=`<div class="head"><h1>Accounting / Books</h1><button class="btn green" onclick="syncAccounting()">Sync From ERP</button></div>
  <div class="accountGrid"><div class="card metric"><small>INCOME</small><h2>${money(d.income)}</h2></div><div class="card metric"><small>EXPENSES</small><h2>${money(d.expense)}</h2></div><div class="card metric"><small>BOOK PROFIT</small><h2>${money(d.profit)}</h2></div><div class="card metric"><small>RECEIVABLES</small><h2>${money(d.receivable)}</h2></div></div>
  <div class="grid2"><div class="card"><h2>Recent Transactions</h2><div class="tableWrap"><table id="acctTrans"></table></div></div><div class="card"><h2>Unpaid Invoices</h2><div class="tableWrap"><table id="acctUnpaid"></table></div></div></div>
  <div class="card"><h2>QuickBooks-style tools</h2><button class="btn" onclick="openModal('invoices')">Create Invoice</button> <button class="btn" onclick="openModal('payments')">Record Payment</button> <button class="btn" onclick="openModal('vendors')">Add Supplier</button> <button class="btn" onclick="openModal('customers')">Add Customer</button> <button class="btn gray" onclick="openModal('accounts')">Chart of Accounts</button><p class="help">Built-in accounting now. Official QuickBooks/Xero sync can be added later using their API.</p></div>`;
  table(document.getElementById('acctTrans'),d.recent,['Date','Type','Account','Description','Debit','Credit'],r=>[r.date,r.type,r.account,r.description,money(r.debit),money(r.credit)]);
  table(document.getElementById('acctUnpaid'),d.unpaid,['Invoice','Client','Amount','Paid','Balance'],r=>[r.invoice_no,r.client,money(r.amount),money(r.paid),money(Number(r.amount||0)-Number(r.paid||0))]);
}
async function syncAccounting(){try{await api('/accounting/sync',{method:'POST',body:{}});alert('Accounting synced from trips, diesel, payroll, maintenance and invoices.');await renderAccounting()}catch(e){alert(e.message)}}
const oldShowAccounting=show; show=function(id,btn){oldShowAccounting(id,btn);if(id==='accounting')renderAccounting()};
document.addEventListener('click',e=>{if(innerWidth<1000&&side.classList.contains('open')&&!side.contains(e.target)&&!e.target.closest('.mobileTop')&&!e.target.closest('.bottomNav'))side.classList.remove('open')});


// V6 hourly GPS and Smart AI
let gpsTimer=null;
async function startHourlyGPS(){
  if(gpsTimer) clearInterval(gpsTimer);
  await sendGPS();
  gpsTimer=setInterval(()=>sendGPS(),60*60*1000);
  localStorage.setItem('hourlyGPS','on');
  alert('Hourly GPS started while app is open. For true closed-app background GPS, package as APK with Capacitor.');
}
function stopHourlyGPS(){
  if(gpsTimer) clearInterval(gpsTimer);
  gpsTimer=null;
  localStorage.setItem('hourlyGPS','off');
  alert('Hourly GPS stopped.');
}
async function scanDoc(docType){
  const inp=document.getElementById('aiFile_'+docType);
  if(!inp.files[0]) return alert('Choose file first');
  const out=document.getElementById('aiOut_'+docType);
  out.innerHTML='Uploading and scanning...<div class="progressBar" id="aiBar_'+docType+'"></div>';
  const fd=new FormData(); fd.append('file',inp.files[0]);
  const xhr=new XMLHttpRequest();
  xhr.open('POST','/api/ai/scan/'+docType);
  xhr.setRequestHeader('Authorization','Bearer '+token);
  xhr.upload.onprogress=e=>{if(e.lengthComputable){let b=document.getElementById('aiBar_'+docType); if(b)b.style.width=Math.round(e.loaded/e.total*100)+'%'}};
  xhr.onload=()=>{let j={};try{j=JSON.parse(xhr.responseText)}catch{} out.innerText=JSON.stringify(j,null,2); loadAll(); if(j.scan_status==='partial_auto')alert('Document scanned. Check missing fields only.'); else alert('Some core fields need manual entry or AI quota/key issue.');};
  xhr.onerror=()=>alert('Upload failed');
  xhr.send(fd);
}
async function runFraudCheck(){
  try{const r=await api('/ai/fraud-check',{method:'POST',body:{}});alert('Fraud check complete. Alerts created: '+r.alerts);await loadAll();renderSmartAI()}catch(e){alert(e.message)}
}
async function askAI(){
  const q=document.getElementById('aiQuestion').value;
  document.getElementById('aiAnswer').innerText='Thinking...';
  const r=await api('/ai/assistant',{method:'POST',body:{question:q}});
  document.getElementById('aiAnswer').innerText=r.answer;
}
function renderSmartAI(){
  const sec=document.getElementById('smartai'); if(!sec)return;
  sec.innerHTML=`<div class="head"><h1>Smart AI Tools</h1><button class="btn green" onclick="runFraudCheck()">Run Fraud Check</button></div>
  <div class="aiBox">
    ${aiScanCard('invoice','Invoice Scanner')}
    ${aiScanCard('permit','Permit / License Scanner')}
    ${aiScanCard('tyre','Tyre Invoice Scanner')}
    ${aiScanCard('workshop','Workshop / Damage Photo AI')}
    ${aiScanCard('border','Border Document Scanner')}
    ${aiScanCard('pod','Delivery Note / POD Scanner')}
  </div>
  <div class="card"><h2>AI Assistant</h2><textarea id="aiQuestion" placeholder="Ask: Which truck has highest diesel cost? Which route is losing money?"></textarea><br><button class="btn" onclick="askAI()">Ask AI</button><pre id="aiAnswer"></pre></div>
  <div class="card"><h2>GPS Auto Pin</h2><div class="gpsControls"><button class="btn green" onclick="startHourlyGPS()">Start 1 Hour GPS Pin</button><button class="btn red" onclick="stopHourlyGPS()">Stop GPS Auto Pin</button><button class="btn" onclick="sendGPS()">Send GPS Now</button></div><p class="help">Browser can send hourly GPS while the app/site is open. Closed-app background GPS needs APK/Capacitor.</p></div>`;
}
function aiScanCard(type,title){
  return `<div class="card"><h2>${title}</h2><input id="aiFile_${type}" type="file" accept="image/*,.pdf"><br><button class="btn orange" onclick="scanDoc('${type}')">Scan</button><pre id="aiOut_${type}" class="help"></pre></div>`;
}
const oldShowV6=show;
show=function(id,btn){oldShowV6(id,btn);if(id==='smartai')renderSmartAI();if(id==='gps')addGpsControls();}
function addGpsControls(){
  const sec=document.getElementById('gps'); if(!sec||sec.dataset.v6)return; sec.dataset.v6='1';
  const div=document.createElement('div'); div.className='card'; div.innerHTML='<h2>Auto GPS Pin</h2><button class="btn green" onclick="startHourlyGPS()">Start hourly GPS while app is open</button> <button class="btn red" onclick="stopHourlyGPS()">Stop hourly GPS</button><p class="help">For real background GPS with closed app, build APK with Capacitor.</p>';
  sec.prepend(div);
}
if(localStorage.getItem('hourlyGPS')==='on'){setTimeout(()=>startHourlyGPS(),3000)}


// V7 Integrations and Driver Hub
async function renderIntegrations(){
  const sec=document.getElementById('integrations'); if(!sec)return;
  let st={quickbooks:{},xero:{},webhook:{}};
  try{st=await api('/integrations/status')}catch(e){}
  sec.innerHTML=`<div class="head"><h1>Integrations</h1><button class="btn" onclick="loadAll()">Refresh</button></div>
  <div class="integrationGrid">
    <div class="card"><h2>QuickBooks</h2><p><span class="statusDot"></span>Configured: ${st.quickbooks?.configured?'Yes':'No'}<br>Connected: ${st.quickbooks?.connected?'Yes':'No'}</p><button class="btn" onclick="quickbooksConnect()">Connect URL</button> <button class="btn gray" onclick="downloadQB()">Export CSV</button></div>
    <div class="card"><h2>Xero</h2><p><span class="statusDot"></span>Configured: ${st.xero?.configured?'Yes':'No'}<br>Connected: ${st.xero?.connected?'Yes':'No'}</p><button class="btn gray" onclick="downloadXero()">Export Xero CSV</button></div>
    <div class="card"><h2>Make/Zapier Webhook</h2><p>Configured: ${st.webhook?.configured?'Yes':'No'}</p><button class="btn green" onclick="testWebhook()">Send Test</button></div>
  </div>
  <div class="card"><h2>How it works</h2><p class="help">This version has export/API foundations. Official QuickBooks/Xero live sync needs their developer keys and OAuth approval. CSV exports can import into accounting immediately.</p></div>`;
}
async function quickbooksConnect(){const r=await api('/quickbooks/connect-url'); if(r.url) window.open(r.url,'_blank'); else alert(r.error||'Not configured')}
function downloadQB(){window.open('/api/quickbooks/export','_blank')}
function downloadXero(){window.open('/api/xero/export','_blank')}
async function testWebhook(){const r=await api('/webhook/test',{method:'POST',body:{}});alert(JSON.stringify(r))}
function renderDriverHub(){
  const sec=document.getElementById('driverhub'); if(!sec)return;
  sec.innerHTML=`<div class="head"><h1>Driver Hub</h1><button class="btn green" onclick="processQueue()">Process Queue</button></div>
  <div class="driverGrid">
    <div class="card"><h2>One Tap Upload</h2><div class="bigDrop"><input id="driverFiles" type="file" multiple accept="image/*,.pdf"><br><br><select id="driverDocType"><option value="auto">Auto Detect</option><option value="diesel">Diesel</option><option value="invoice">Invoice</option><option value="permit">Permit</option><option value="tyre">Tyre</option><option value="workshop">Workshop/Damage</option><option value="pod">POD/Delivery Note</option></select><br><br><button class="btn" onclick="driverQuickUpload()">Upload Queue</button></div><pre id="driverOut"></pre></div>
    <div class="card"><h2>Driver Actions</h2><button class="btn green" onclick="sendGPS()">Send GPS Now</button><br><br><button class="btn" onclick="openModal('trips')">Add Trip</button><br><br><button class="btn" onclick="openModal('diesel')">Manual Diesel</button><p class="help">Driver uploads many docs once. Office/AI processes them later so driver does not waste time typing.</p></div>
    <div class="card"><h2>Automation</h2><button class="btn orange" onclick="autoSortDocs()">Auto-create records</button><p class="help">Creates invoices/permits from scanned AI documents where safe.</p></div>
  </div>
  <div class="card"><h2>Upload Queue</h2><div class="tableWrap"><table id="queueTable"></table></div></div>`;
  if(cache.upload_queue) table(document.getElementById('queueTable'),cache.upload_queue,['Driver','Truck','Type','Status','Created'],r=>[r.driver,r.truck,r.doc_type,r.status,r.created_records]);
}
async function driverQuickUpload(){
  const files=document.getElementById('driverFiles').files;
  if(!files.length)return alert('Choose documents first');
  const fd=new FormData(); [...files].forEach(f=>fd.append('files',f)); fd.append('doc_type',document.getElementById('driverDocType').value);
  driverOut.innerText='Uploading...';
  const r=await fetch('/api/driver/quick-upload',{method:'POST',headers:{Authorization:'Bearer '+token},body:fd});
  const j=await r.json(); driverOut.innerText=JSON.stringify(j,null,2); await loadAll(); renderDriverHub();
}
async function processQueue(){const r=await api('/driver/process-queue',{method:'POST',body:{limit:10}});alert('Processed '+(r.processed?.length||0)+' documents');await loadAll();renderDriverHub()}
async function autoSortDocs(){const r=await api('/ai/auto-sort',{method:'POST',body:{}});alert('Created records: '+r.created);await loadAll()}
const oldShowV7=show;
show=function(id,btn){oldShowV7(id,btn); if(id==='integrations')renderIntegrations(); if(id==='driverhub')renderDriverHub();}


// V8 role-based driver app
function currentRole(){ return String(user?.role || '').toLowerCase(); }
function isDriverRole(){ return currentRole()==='driver'; }
function isMechanicRole(){ return currentRole()==='mechanic'; }
function isOfficeRole(){ return ['owner','admin','manager','dispatcher','accountant'].includes(currentRole()); }

function applyRoleUI(){
  document.body.classList.toggle('driver-mode', isDriverRole());
  const officeModules=['accounting','smartai','integrations','users','payroll','workers','invoices','exports','customers','vendors','accounts','transactions','payments'];
  document.querySelectorAll('.nav').forEach(btn=>{
    const txt=btn.textContent.toLowerCase();
    const officeText=['accounting','smart ai','integrations','users','payroll','site workers','invoices','exports','whatsapp reports','dropdown lists'].some(x=>txt.includes(x));
    if(officeText) btn.classList.add('office-only');
    if(isDriverRole() && officeText) btn.style.display='none';
    if(isDriverRole() && txt.includes('driver app')) btn.style.display='block';
  });
  if(isDriverRole()){
    show('driverapp');
  }
}

async function renderDriverApp(){
  const sec=document.getElementById('driverapp'); if(!sec)return;
  let d={trips:[],diesel:[],queue:[],reminders:[],user:user||{}};
  try{ d=await api('/driver/dashboard'); }catch(e){ console.warn(e); }
  sec.innerHTML=`<div class="head"><h1>Driver App</h1><span class="roleBadge">${currentRole()||'user'}</span></div>
  <div class="driverHomeGrid">
    <div class="card driverOnlyCard"><h2>Quick Upload Docs</h2><p class="help">Upload diesel slips, PODs, permits or photos. Office/AI processes them later.</p><input id="driverFiles2" type="file" multiple accept="image/*,.pdf"><br><br><select id="driverDocType2"><option value="auto">Auto Detect</option><option value="diesel">Diesel Slip</option><option value="pod">POD / Delivery Note</option><option value="permit">Permit</option><option value="workshop">Damage/Workshop Photo</option></select><br><br><button class="btn" onclick="driverQuickUpload2()">Upload</button><pre id="driverOut2"></pre></div>
    <div class="card driverOnlyCard"><h2>GPS Check-in</h2><button class="btn green" onclick="sendGPS()">Send GPS Now</button><br><br><button class="btn" onclick="startHourlyGPS()">Start Hourly GPS</button><br><br><button class="btn red" onclick="stopHourlyGPS()">Stop GPS</button><p class="help">Hourly GPS works while app/browser is open. Closed background GPS needs APK.</p></div>
    <div class="card"><h2>My Trips</h2><div class="tableWrap"><table id="driverTripsTable"></table></div></div>
    <div class="card"><h2>My Diesel Slips</h2><div class="tableWrap"><table id="driverDieselTable"></table></div></div>
    <div class="card"><h2>Upload Queue</h2><div class="tableWrap"><table id="driverQueueTable"></table></div></div>
    <div class="card"><h2>Reminders</h2>${(d.reminders||[]).map(r=>`<p>🔔 ${r.title||''} ${r.due_date||''}</p>`).join('')||'<p>No reminders</p>'}</div>
  </div>`;
  table(document.getElementById('driverTripsTable'),d.trips,['Date','Route','Truck','KM','Status'],r=>[r.date,r.route,r.truck,r.km,r.status]);
  table(document.getElementById('driverDieselTable'),d.diesel,['Date','Truck','Litres','Amount','Status'],r=>[r.date,r.truck,r.litres,money(r.amount),r.scan_status]);
  table(document.getElementById('driverQueueTable'),d.queue,['Type','Status','Created'],r=>[r.doc_type,r.status,r.created_at]);
}
async function driverQuickUpload2(){
  const files=document.getElementById('driverFiles2').files;
  if(!files.length)return alert('Choose documents first');
  const fd=new FormData(); [...files].forEach(f=>fd.append('files',f)); fd.append('doc_type',document.getElementById('driverDocType2').value);
  driverOut2.innerText='Uploading...';
  const r=await fetch('/api/driver/quick-upload',{method:'POST',headers:{Authorization:'Bearer '+token},body:fd});
  const j=await r.json(); driverOut2.innerText=JSON.stringify(j,null,2); await renderDriverApp();
}

const oldShowV8=show;
show=function(id,btn){
  oldShowV8(id,btn);
  if(id==='driverapp')renderDriverApp();
};

const oldLoadAllV8=loadAll;
loadAll=async function(){
  await oldLoadAllV8();
  applyRoleUI();
};


// V9: Dropdown + manual entry
// Every dropdown now has "Other / Type manually".
// New manual values save to the record, and for master dropdowns save to Dropdown Lists for next time.

fieldHtml = function(f,row){
  let val = row[f] ?? '';
  let type = f.includes('date') || f.includes('expiry') ? 'date' : 'text';
  let key = dropdowns[f];
  let list = opts[key] || [];
  if(list.length){
    const inList = list.includes(String(val));
    return `<label>${f}
      <select name="${f}" onchange="toggleManualField(this,'${f}')">
        <option value="">-- choose --</option>
        ${list.map(x=>`<option ${x==val?'selected':''}>${x}</option>`).join('')}
        <option value="__manual__" ${val && !inList ? 'selected' : ''}>Other / Type manually</option>
      </select>
      <input class="manualInput" name="${f}__manual" value="${val && !inList ? val : ''}" placeholder="Type new ${f}" style="display:${val && !inList ? 'block' : 'none'}">
    </label>`;
  }
  return `<label>${f}<input name="${f}" value="${val}" ${type==='date'?'type="date"':''}></label>`;
};

function toggleManualField(sel, field){
  const input = sel.parentElement.querySelector(`[name="${field}__manual"]`);
  if(!input) return;
  input.style.display = sel.value === "__manual__" ? "block" : "none";
  if(sel.value === "__manual__") input.focus();
}

function valueFromModalField(form, f){
  const el = form.elements[f];
  if(!el) return "";
  if(el.value === "__manual__"){
    return form.elements[f+"__manual"]?.value || "";
  }
  return el.value;
}

async function saveDropdownValueIfNew(field, value){
  if(!value) return;
  const type = dropdowns[field];
  if(!type || ['trucks','drivers','owners','workers_names'].includes(type)) return;
  const existing = opts[type] || [];
  if(existing.includes(value)) return;
  try{
    await api('/masters',{method:'POST',body:{type,value}});
    opts[type] = [...existing, value];
  }catch(e){
    console.warn('Could not save dropdown value', field, value, e.message);
  }
}

openModal = function(t,row={}){
  modal.classList.add('show');
  modalTitle.innerText = (row.id ? 'Edit ' : 'Add ') + tables[t].title;
  modalForm.innerHTML = '<div class="formGrid">' + tables[t].fields.map(f=>fieldHtml(f,row)).join('') + '</div><br><button class="btn" type="submit">Save</button>';
  modalForm.onsubmit = async(e)=>{
    e.preventDefault();
    let obj = {};
    for(const f of tables[t].fields){
      obj[f] = valueFromModalField(modalForm,f);
      await saveDropdownValueIfNew(f,obj[f]);
    }
    try{
      if(row.id) await api('/'+t+'/'+row.id,{method:'PUT',body:obj});
      else await api('/'+t,{method:'POST',body:obj});
      closeModal();
      await loadAll();
    }catch(err){
      alert(err.message);
    }
  };
};


// V10: strict driver-only UI.
// Drivers cannot see profit dashboard, tabs, accounting, admin, reports or office modules.
const OFFICE_PAGES_V10 = [
  'dashboard','accounting','smartai','integrations','exports','users','payroll','workers',
  'invoices','trips','trucks','drivers','diesel','permits','maintenance','tyres','workshop',
  'fines','border','gps','whatsapp','masters'
];

function isStrictDriver(){
  return String(user?.role || '').toLowerCase() === 'driver';
}

function lockDriverUI(){
  if(!isStrictDriver()) return;
  document.body.classList.add('driver-mode');
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const d = document.getElementById('driverapp');
  if(d) d.classList.add('active');
  document.querySelectorAll('.nav').forEach(n=>n.style.display='none');
  document.querySelectorAll('.driver-nav').forEach(n=>n.style.display='block');
  renderDriverApp();
}

const previousShowV10 = show;
show = function(id, btn){
  if(isStrictDriver() && id !== 'driverapp'){
    id = 'driverapp';
    btn = document.querySelector('.driver-nav');
  }
  previousShowV10(id, btn);
  if(isStrictDriver()) lockDriverUI();
};

const previousLoadAllV10 = loadAll;
loadAll = async function(){
  await previousLoadAllV10();
  if(isStrictDriver()) lockDriverUI();
};

const previousDoLoginV10 = doLogin;
doLogin = async function(){
  await previousDoLoginV10();
  if(isStrictDriver()) lockDriverUI();
};

setTimeout(()=>{ if(isStrictDriver()) lockDriverUI(); },1000);


// V11 AI Trip Engine + Smart Features
async function generateTripsAI(){
  const r = await api('/ai/trip-generator',{method:'POST',body:{}});
  alert('AI generated '+(r.created?.length||0)+' trips');
  await loadAll();
}
async function generateDriverScores(){
  await api('/ai/driver-score',{method:'POST',body:{}});
  alert('Driver AI scores updated');
  await loadAll();
}
async function loadDispatchSuggestion(){
  const r = await api('/ai/dispatch-suggestion');
  alert(r.message || 'Suggestions loaded');
  console.log(r);
}

const prevRenderSmartAI = renderSmartAI;
renderSmartAI = function(){
  prevRenderSmartAI();
  const sec=document.getElementById('smartai');
  if(!sec) return;
  const extra=document.createElement('div');
  extra.className='card';
  extra.innerHTML=`
    <h2>AI Auto Trip Engine</h2>
    <button class="btn green" onclick="generateTripsAI()">Generate Trips From Uploaded Docs</button>
    <button class="btn" onclick="generateDriverScores()">Generate Driver Scores</button>
    <button class="btn orange" onclick="loadDispatchSuggestion()">AI Dispatch Suggestion</button>
    <p class="help">
      AI now links uploaded diesel slips, PODs, permits and invoices together to auto-create trips.
      Driver scoring and dispatch suggestions are also included.
    </p>
  `;
  sec.appendChild(extra);
};


// V12 Real PWA install logic
let deferredInstallPrompt = null;

function isStandaloneApp(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function markStandalone(){
  document.body.classList.toggle('standalone', isStandaloneApp());
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if(!localStorage.getItem('installDismissed') && !isStandaloneApp()){
    const box=document.getElementById('installPromptBox');
    if(box) box.classList.remove('hidden');
  }
});

async function installPWA(){
  if(!deferredInstallPrompt){
    alert('If Install button does not appear yet: open Chrome menu ⋮ and choose Install app / Add to Home Screen after the page finishes loading.');
    return;
  }
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  const box=document.getElementById('installPromptBox');
  if(box) box.classList.add('hidden');
  if(choice.outcome !== 'accepted'){
    alert('Install cancelled. You can still use Chrome menu ⋮ > Install app.');
  }
}

function dismissInstall(){
  localStorage.setItem('installDismissed','1');
  const box=document.getElementById('installPromptBox');
  if(box) box.classList.add('hidden');
}

async function enablePushPlaceholder(){
  if(!('Notification' in window)) return alert('Notifications not supported on this phone/browser.');
  const perm = await Notification.requestPermission();
  if(perm === 'granted'){
    new Notification('Angermund ERP', {body:'Notifications enabled on this device.', icon:'/icon-192.png'});
  } else {
    alert('Notifications were not allowed.');
  }
}

function handlePWAShortcuts(){
  const p = new URLSearchParams(location.search);
  const shortcut = p.get('shortcut');
  if(!shortcut) return;
  setTimeout(()=>{
    if(shortcut === 'driverhub') show('driverhub');
    if(shortcut === 'gps') show('gps');
    if(shortcut === 'diesel') show('diesel');
  },1500);
}

window.addEventListener('appinstalled', () => {
  localStorage.setItem('pwaInstalled','1');
  const box=document.getElementById('installPromptBox');
  if(box) box.classList.add('hidden');
  alert('Angermund ERP installed successfully.');
});

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').then(()=>console.log('PWA service worker ready')).catch(console.warn);
  navigator.serviceWorker.addEventListener('message', event => {
    if(event.data?.type === 'BACKGROUND_SYNC') console.log('Background sync event received');
  });
}

markStandalone();
handlePWAShortcuts();


// V13 standalone cleanup
window.addEventListener('load',()=>{
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if(standalone){
    document.body.classList.add('standalone');
  }
});

// V14 full-screen mobile + Excel import + stat charts
function barChart(id, labels, values){
  const c=document.getElementById(id); if(!c)return; const ctx=c.getContext('2d');
  const w=c.width=c.offsetWidth*2, h=c.height=440; ctx.clearRect(0,0,w,h); ctx.fillStyle='rgba(255,255,255,.08)'; ctx.fillRect(0,0,w,h);
  const max=Math.max(...values,1), bw=w/(Math.max(values.length,1)*1.7);
  values.forEach((v,i)=>{const x=24+i*bw*1.7,bh=(v/max)*(h-80);ctx.fillStyle='#2e8cff';ctx.fillRect(x,h-48-bh,bw,bh);ctx.fillStyle='white';ctx.font='22px Arial';ctx.fillText(String(labels[i]||'').slice(0,9),x,h-15);});
}
function lineChart(id, labels, values){
  const c=document.getElementById(id); if(!c)return; const ctx=c.getContext('2d');
  const w=c.width=c.offsetWidth*2, h=c.height=440; ctx.clearRect(0,0,w,h); ctx.fillStyle='rgba(255,255,255,.08)'; ctx.fillRect(0,0,w,h);
  const max=Math.max(...values,1); ctx.strokeStyle='#45ff67'; ctx.lineWidth=5; ctx.beginPath();
  values.forEach((v,i)=>{const x=28+i*((w-56)/Math.max(values.length-1,1)), y=h-45-(v/max)*(h-90); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);}); ctx.stroke();
}
function groupSum(rows,key,fn){const o={};(rows||[]).forEach(r=>{const k=r[key]||'Unknown';o[k]=(o[k]||0)+fn(r)});return o}
function drawDashboardCharts(){
  const trips=cache.trips||[], diesel=cache.diesel||[];
  const route=groupSum(trips,'route',t=>Number(t.km||0)*Number(t.rate_km||0));
  const driver=groupSum(trips,'driver',t=>tripCalc(t).profit);
  const dies=groupSum(diesel,'date',d=>Number(d.amount||0));
  const truck=groupSum(trips,'truck',t=>Number(t.km||0));
  barChart('routeChart',Object.keys(route),Object.values(route));
  barChart('driverChart',Object.keys(driver),Object.values(driver));
  lineChart('dieselChart',Object.keys(dies),Object.values(dies));
  barChart('truckChart',Object.keys(truck),Object.values(truck));
}
function addDashboardCharts(){
  const dash=document.getElementById('dashboard'); if(!dash||document.getElementById('chartSection'))return;
  const div=document.createElement('div'); div.id='chartSection'; div.className='chartGrid';
  div.innerHTML=`<div class="card chartBox"><h2>Revenue by Route</h2><canvas class="statChart" id="routeChart"></canvas></div><div class="card chartBox"><h2>Profit by Driver</h2><canvas class="statChart" id="driverChart"></canvas></div><div class="card chartBox"><h2>Diesel Spend Trend</h2><canvas class="statChart" id="dieselChart"></canvas></div><div class="card chartBox"><h2>Trip KM by Truck</h2><canvas class="statChart" id="truckChart"></canvas></div>`;
  dash.appendChild(div); drawDashboardCharts();
}
function renderImports(){
  const sec=document.getElementById('imports'); if(!sec)return;
  sec.innerHTML=`<div class="head"><h1>Excel Import</h1></div><div class="card importBox"><h2>Upload old Excel data</h2><p class="help">Choose module and upload Excel/CSV. First row must have headings like route, driver, truck, km, amount, date.</p><select id="importModule"><option value="trips">Trips</option><option value="diesel">Diesel</option><option value="trucks">Trucks</option><option value="drivers">Drivers</option><option value="invoices">Invoices</option><option value="payroll">Payroll</option><option value="workers">Site Workers</option><option value="maintenance">Maintenance</option><option value="tyres">Tyres</option><option value="permits">Permits</option></select><br><br><input type="file" id="excelFile" accept=".xlsx,.xls,.csv"><br><br><button class="btn green" onclick="uploadExcel()">Import Excel</button><pre id="importResult"></pre></div>`;
}
async function uploadExcel(){
  const f=document.getElementById('excelFile').files[0]; if(!f)return alert('Choose Excel file first');
  const fd=new FormData(); fd.append('file',f); importResult.innerText='Uploading...';
  const r=await fetch('/api/import/excel/'+document.getElementById('importModule').value,{method:'POST',headers:{Authorization:'Bearer '+token},body:fd});
  const j=await r.json(); importResult.innerText=JSON.stringify(j,null,2); await loadAll(); alert('Import done: '+(j.inserted||0)+' rows inserted');
}
const oldRenderDash14=renderDash; renderDash=function(d){oldRenderDash14(d); setTimeout(addDashboardCharts,100);}
const oldShow14=show; show=function(id,btn){oldShow14(id,btn); if(id==='imports')renderImports(); if(id==='dashboard')setTimeout(addDashboardCharts,100);}
const oldLoadAll14=loadAll; loadAll=async function(){await oldLoadAll14(); setTimeout(()=>{addDashboardCharts();drawDashboardCharts();},250);}


// V15: dashboard invoices + payment status + edit fix
function paymentStatusSelect(r){
  return `<select onchange="quickInvoiceStatus(${r.id},this.value)">
    ${['Unpaid','Part Paid','Paid','Overdue','Cancelled'].map(s=>`<option ${String(r.status||'')===s?'selected':''}>${s}</option>`).join('')}
  </select>`;
}
async function quickInvoiceStatus(id,status){
  try{
    await api('/invoices/'+id,{method:'PUT',body:{status}});
    await loadAll();
  }catch(e){alert(e.message)}
}
async function addInvoicePayment(id){
  const amount=prompt('Payment amount received?');
  if(!amount)return;
  const method=prompt('Payment method? EFT / Cash / Card','EFT')||'EFT';
  const reference=prompt('Reference / receipt no?','')||'';
  try{
    await api('/invoices/'+id+'/payment',{method:'POST',body:{amount,method,reference,status:'Part Paid'}});
    await loadAll();
    alert('Payment added');
  }catch(e){alert(e.message)}
}

// safer action buttons
act = function(t,r){
  let extra='';
  if(t==='invoices') extra=` <button class="btn green" onclick="addInvoicePayment(${r.id})">Payment</button>`;
  return `<button class="btn gray" onclick='editRow("${t}",${JSON.stringify(r).replace(/'/g,"&#39;")})'>Edit</button>${extra} <button class="btn red" onclick="delRow('${t}',${r.id})">Del</button>`;
};

// invoice status dropdown in table
const oldFmtV15 = fmt;
fmt = function(t,f,r){
  if(t==='invoices' && f==='status') return paymentStatusSelect(r);
  return oldFmtV15(t,f,r);
};

// dashboard must show invoices too
const oldRenderDashV15 = renderDash;
renderDash = function(d){
  oldRenderDashV15(d);
  if(!document.getElementById('invoiceMetricRow')){
    const dash=document.getElementById('dashboard');
    const row=document.createElement('div');
    row.id='invoiceMetricRow';
    row.className='metrics';
    row.innerHTML=`<div class="card metric"><small>INVOICE TOTAL</small><h2>${money(d.metrics.invoiceRevenue||0)}</h2></div>
    <div class="card metric"><small>INVOICE PAID</small><h2>${money(d.metrics.invoicePaid||0)}</h2></div>
    <div class="card metric"><small>RECEIVABLES</small><h2>${money(d.metrics.receivables||0)}</h2></div>
    <div class="card metric"><small>PAYMENTS RECORDED</small><h2>${money(d.metrics.payments||0)}</h2></div>`;
    dash.insertBefore(row,dash.children[1]||null);
  } else {
    invoiceMetricRow.innerHTML=`<div class="card metric"><small>INVOICE TOTAL</small><h2>${money(d.metrics.invoiceRevenue||0)}</h2></div>
    <div class="card metric"><small>INVOICE PAID</small><h2>${money(d.metrics.invoicePaid||0)}</h2></div>
    <div class="card metric"><small>RECEIVABLES</small><h2>${money(d.metrics.receivables||0)}</h2></div>
    <div class="card metric"><small>PAYMENTS RECORDED</small><h2>${money(d.metrics.payments||0)}</h2></div>`;
  }
};


// V16: Split smart AI into each module + Bank Windhoek Pay buttons
const BANK_WINDHOEK_URL = "https://ibank.bankwindhoek.com.na/retail/";

function openBankWindhoek(context="", amount="", reference=""){
  const msg = [
    "Opening Bank Windhoek Internet Banking.",
    context ? "Payment: "+context : "",
    amount ? "Amount: N$ "+amount : "",
    reference ? "Reference: "+reference : "",
    "Use your banking app/site to complete the payment securely."
  ].filter(Boolean).join("\n");
  alert(msg);
  window.open(BANK_WINDHOEK_URL, "_blank", "noopener,noreferrer");
}

function payButton(label, context, amountExpr, refExpr){
  return `<button class="btn payBtn" onclick="openBankWindhoek('${String(context||'').replace(/'/g,'')}', '${String(amountExpr||'').replace(/'/g,'')}', '${String(refExpr||'').replace(/'/g,'')}')">💳 Pay</button>`;
}

function inlineScanner(type,label){
  return `<div class="aiInlineBox"><h3>🤖 ${label}</h3>
    <input id="inlineFile_${type}" type="file" accept="image/*,.pdf">
    <button class="btn orange" onclick="scanInlineDoc('${type}')">Scan ${label}</button>
    <pre id="inlineOut_${type}" class="help"></pre>
  </div>`;
}

async function scanInlineDoc(type){
  const inp=document.getElementById('inlineFile_'+type);
  const out=document.getElementById('inlineOut_'+type);
  if(!inp || !inp.files[0]) return alert('Choose file first');
  const fd=new FormData(); fd.append('file', inp.files[0]);
  out.innerText='Uploading and scanning...';
  const r=await fetch('/api/ai/scan/'+type,{method:'POST',headers:{Authorization:'Bearer '+token},body:fd});
  const j=await r.json();
  out.innerText=JSON.stringify(j,null,2);
  if(j.scan_status==='partial_auto') alert('AI read the document. Check missing fields only.');
  else alert('Manual check required or AI quota/key issue.');
  await loadAll();
}

function attachModuleAI(){
  const map = {
    diesel: ['diesel','Diesel Slip AI Scanner'],
    invoices: ['invoice','Invoice Scanner'],
    permits: ['permit','Permit / License Scanner'],
    tyres: ['tyre','Tyre Invoice Scanner'],
    workshop: ['workshop','Workshop / Damage Photo AI'],
    border: ['border','Border Document Scanner'],
    trips: ['pod','POD / Delivery Note Scanner'],
    maintenance: ['workshop','Maintenance Photo AI']
  };
  for(const [page,[type,label]] of Object.entries(map)){
    const sec=document.getElementById(page);
    if(sec && !sec.querySelector('.aiInlineBox')){
      const box=document.createElement('div');
      box.innerHTML=inlineScanner(type,label);
      const card=sec.querySelector('.card') || sec.firstElementChild;
      if(card) sec.insertBefore(box, card);
      else sec.appendChild(box);
    }
  }
}

function addPayButtonsToPages(){
  // payroll
  const payroll=document.getElementById('payroll');
  if(payroll && !payroll.querySelector('.payPayroll')){
    const div=document.createElement('div');
    div.className='card payPayroll';
    div.innerHTML='<h2>Pay Payroll / Advances</h2><button class="btn payBtn" onclick="openBankWindhoek(\'Payroll / Advance payment\')">💳 Open Bank Windhoek Pay</button><p class="bankNote">This opens Bank Windhoek. Complete EFT/payment securely in the bank site.</p>';
    payroll.prepend(div);
  }
  // workers
  const workers=document.getElementById('workers');
  if(workers && !workers.querySelector('.payWorkers')){
    const div=document.createElement('div');
    div.className='card payWorkers';
    div.innerHTML='<h2>Pay Site Workers</h2><button class="btn payBtn" onclick="openBankWindhoek(\'Site worker payment\')">💳 Open Bank Windhoek Pay</button>';
    workers.prepend(div);
  }
  // trips food money
  const trips=document.getElementById('trips');
  if(trips && !trips.querySelector('.payFood')){
    const div=document.createElement('div');
    div.className='card payFood';
    div.innerHTML='<h2>Driver Food Money / Trip Advance</h2><button class="btn payBtn" onclick="openBankWindhoek(\'Driver food money / trip advance\')">💳 Pay Driver Food Money</button>';
    trips.prepend(div);
  }
  // invoices
  const invoices=document.getElementById('invoices');
  if(invoices && !invoices.querySelector('.payInvoice')){
    const div=document.createElement('div');
    div.className='card payInvoice';
    div.innerHTML='<h2>Supplier / Invoice Payments</h2><button class="btn payBtn" onclick="openBankWindhoek(\'Supplier or invoice payment\')">💳 Pay Invoice / Supplier</button>';
    invoices.prepend(div);
  }
  // permits
  const permits=document.getElementById('permits');
  if(permits && !permits.querySelector('.payPermits')){
    const div=document.createElement('div');
    div.className='card payPermits';
    div.innerHTML='<h2>Permit / License Payments</h2><button class="btn payBtn" onclick="openBankWindhoek(\'Permit or license payment\')">💳 Pay Permit</button>';
    permits.prepend(div);
  }
  // maintenance/workshop
  const maint=document.getElementById('maintenance');
  if(maint && !maint.querySelector('.payMaintenance')){
    const div=document.createElement('div');
    div.className='card payMaintenance';
    div.innerHTML='<h2>Workshop / Repairs Payments</h2><button class="btn payBtn" onclick="openBankWindhoek(\'Workshop or repair payment\')">💳 Pay Workshop</button>';
    maint.prepend(div);
  }
}

// Enhance invoice payment button to use Bank Windhoek too
const oldAddInvoicePaymentV16 = typeof addInvoicePayment === 'function' ? addInvoicePayment : null;
addInvoicePayment = async function(id){
  const amount=prompt('Payment amount received / to pay?');
  if(!amount)return;
  const method=prompt('Payment method? EFT / Cash / Card','EFT')||'EFT';
  const reference=prompt('Reference / receipt no?','')||'';
  if(confirm('Open Bank Windhoek now to make payment?')) openBankWindhoek('Invoice payment', amount, reference);
  try{
    await api('/invoices/'+id+'/payment',{method:'POST',body:{amount,method,reference,status:'Part Paid'}});
    await loadAll();
    alert('Payment recorded');
  }catch(e){alert(e.message)}
};

// Add smart AI explanation page that points to the split tabs
const oldRenderSmartAIV16 = typeof renderSmartAI === 'function' ? renderSmartAI : null;
renderSmartAI = function(){
  const sec=document.getElementById('smartai');
  if(!sec)return;
  sec.innerHTML=`<div class="head"><h1>Smart AI Centre</h1></div>
  <div class="card"><h2>AI features are now inside each module</h2>
    <p>Diesel AI is in Diesel tab. Invoice AI is in Invoices. Permit AI is in Permits. Tyre AI is in Tyres. Workshop/Damage AI is in Workshop and Maintenance. POD AI is in Trips. Border AI is in Border Logs.</p>
    <button class="btn" onclick="show('diesel')">Diesel AI</button>
    <button class="btn" onclick="show('invoices')">Invoice AI</button>
    <button class="btn" onclick="show('permits')">Permit AI</button>
    <button class="btn" onclick="show('tyres')">Tyre AI</button>
    <button class="btn" onclick="show('trips')">POD / Trip AI</button>
  </div>
  <div class="card"><h2>AI Assistant</h2><textarea id="aiQuestion" placeholder="Ask company question..."></textarea><br><button class="btn" onclick="askAI()">Ask AI</button><pre id="aiAnswer"></pre></div>`;
};

const oldShowV16 = show;
show = function(id,btn){
  oldShowV16(id,btn);
  setTimeout(()=>{attachModuleAI();addPayButtonsToPages();},100);
};

const oldLoadAllV16 = loadAll;
loadAll = async function(){
  await oldLoadAllV16();
  setTimeout(()=>{attachModuleAI();addPayButtonsToPages();},200);
};

setTimeout(()=>{attachModuleAI();addPayButtonsToPages();},1000);


// V17 People Hub: per-driver / per-worker consolidated files
let selectedPerson=null, selectedPersonType='driver', selectedProfileTab='summary';

function getAllPeople(){
  const names=new Set();
  (cache.drivers||[]).forEach(d=>d.name&&names.add(d.name));
  (cache.trips||[]).forEach(t=>t.driver&&names.add(t.driver));
  (cache.diesel||[]).forEach(d=>d.driver&&names.add(d.driver));
  (cache.payroll||[]).forEach(p=>p.employee&&names.add(p.employee));
  (cache.workers||[]).forEach(w=>w.name&&names.add(w.name));
  return [...names].sort();
}

function renderPeopleHub(){
  const sec=document.getElementById('peoplehub'); if(!sec)return;
  const people=getAllPeople();
  if(!selectedPerson && people.length) selectedPerson=people[0];
  sec.innerHTML=`<div class="head"><h1>People Hub</h1><button class="btn" onclick="openModal('drivers')">+ Add Driver</button></div>
  <div class="profileGrid">
    <div class="card personList">
      <h2>Drivers / Workers</h2>
      <input placeholder="Search person..." oninput="filterPeople(this.value)" style="width:100%;padding:10px;border-radius:10px">
      <div id="peopleList">${people.map(n=>`<button class="personBtn ${n===selectedPerson?'active':''}" onclick="selectPerson('${String(n).replace(/'/g,'')}')">👤 ${n}</button>`).join('')}</div>
    </div>
    <div class="card" id="personProfile">Select a person</div>
  </div>`;
  if(selectedPerson) loadPersonProfile(selectedPerson);
}

function filterPeople(q){
  q=String(q||'').toLowerCase();
  document.querySelectorAll('.personBtn').forEach(b=>{b.style.display=b.innerText.toLowerCase().includes(q)?'block':'none'});
}

async function selectPerson(name){
  selectedPerson=name;
  selectedProfileTab='summary';
  renderPeopleHub();
}

async function loadPersonProfile(name){
  const box=document.getElementById('personProfile'); if(!box)return;
  box.innerHTML='Loading...';
  let d;
  try{d=await api('/people/profile/driver/'+encodeURIComponent(name));}catch(e){box.innerHTML=e.message;return;}
  window.currentPersonProfile=d;
  drawPersonProfile(d);
}

function personProfileTabs(){
  const tabs=['summary','trips','diesel','payroll','fines','gps','uploads'];
  return `<div class="profileTabs">${tabs.map(t=>`<button class="${selectedProfileTab===t?'active':''}" onclick="selectedProfileTab='${t}';drawPersonProfile(window.currentPersonProfile)">${t.toUpperCase()}</button>`).join('')}</div>`;
}

function drawPersonProfile(d){
  const box=document.getElementById('personProfile'); if(!box)return;
  let html=`<h2>${d.name}</h2>${personProfileTabs()}`;
  if(selectedProfileTab==='summary'){
    html+=`<div class="profileSummary">
      <div class="card metric"><small>TRIPS</small><h2>${d.summary.trips}</h2></div>
      <div class="card metric"><small>TOTAL KM</small><h2>${Number(d.summary.km||0).toLocaleString()}</h2></div>
      <div class="card metric"><small>REVENUE</small><h2>${money(d.summary.revenue)}</h2></div>
      <div class="card metric"><small>DIESEL</small><h2>${money(d.summary.dieselCost)}</h2></div>
      <div class="card metric"><small>PAYROLL</small><h2>${money(d.summary.payrollTotal)}</h2></div>
      <div class="card metric"><small>FINES/DAMAGES</small><h2>${money(d.summary.finesTotal)}</h2></div>
      <div class="card metric"><small>UPLOADS</small><h2>${d.summary.uploads}</h2></div>
    </div>`;
  }
  if(selectedProfileTab==='trips') html+=profileTable(d.trips,['date','route','truck','km','rate_km','status']);
  if(selectedProfileTab==='diesel') html+=profileTable(d.diesel,['date','truck','litres','amount','supplier','slip_no']);
  if(selectedProfileTab==='payroll') html+=profileTable(d.payroll,['date','employee','basic_salary','advance','deductions','role']);
  if(selectedProfileTab==='fines') html+=profileTable(d.fines,['date','type','description','amount','status']);
  if(selectedProfileTab==='gps') html+=`<div class="tableWrap"><table><tr><th>Date</th><th>Truck</th><th>Map</th></tr>${(d.gps||[]).map(g=>`<tr><td>${g.created_at||''}</td><td>${g.truck||''}</td><td><a style="color:#5aa7ff" target="_blank" href="https://maps.google.com/?q=${g.lat},${g.lng}">Open Map</a></td></tr>`).join('')}</table></div>`;
  if(selectedProfileTab==='uploads') html+=profileTable(d.uploads,['created_at','doc_type','status','scan_status','created_records']);
  box.innerHTML=html;
}

function profileTable(rows,cols){
  return `<div class="tableWrap"><table><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr>${(rows||[]).map(r=>`<tr>${cols.map(c=>`<td>${c.includes('amount')||c.includes('salary')||c.includes('advance')||c.includes('deductions')?money(r[c]):(r[c]??'')}</td>`).join('')}</tr>`).join('')}</table></div>`;
}

// Keep old tabs, but People Hub reduces need to open each one.
// Office can still open detailed modules when required.
const oldShowV17=show;
show=function(id,btn){
  oldShowV17(id,btn);
  if(id==='peoplehub')renderPeopleHub();
};

const oldLoadAllV17=loadAll;
loadAll=async function(){
  await oldLoadAllV17();
  if(document.getElementById('peoplehub')?.classList.contains('active')) renderPeopleHub();
};


// V18: device time, proper roles, WhatsApp slip intake
const V18_TIME_FIELDS = ['trips','diesel','payroll','workers','payments','invoices'];
for(const t of V18_TIME_FIELDS){
  if(tables[t] && !tables[t].fields.includes('device_time')) tables[t].fields.splice(1,0,'device_time');
}
if(tables.users && !dropdowns.role) dropdowns.role='role';

function localDeviceTime(){
  const d=new Date();
  const pad=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Improve time display on all tables
const oldFmtV18 = typeof fmt === 'function' ? fmt : null;
fmt = function(t,f,r){
  if(f==='device_time') return r[f] || '';
  if(f==='created_at') return r[f] ? new Date(r[f]).toLocaleString() : '';
  return oldFmtV18 ? oldFmtV18(t,f,r) : (r[f]??'');
};

// Override modal to auto-add current device time and lowercase roles
const oldOpenModalV18 = openModal;
openModal = function(t,row={}){
  if(!row.id && tables[t]?.fields?.includes('device_time') && !row.device_time) row.device_time=localDeviceTime();
  oldOpenModalV18(t,row);
  if(t==='users'){
    const roleEl=modalForm.elements['role'];
    if(roleEl && roleEl.tagName==='SELECT'){
      const needed=['owner','admin','manager','dispatcher','accountant','office','driver','mechanic','labourer'];
      const have=[...roleEl.options].map(o=>o.value||o.text);
      needed.forEach(r=>{if(!have.includes(r)){const o=document.createElement('option');o.value=r;o.textContent=r;roleEl.appendChild(o);}});
    }
  }
};

// Ensure submitted role is lowercase and device time is present
const oldValueFromModalFieldV18 = typeof valueFromModalField === 'function' ? valueFromModalField : null;
valueFromModalField = function(form,f){
  let v = oldValueFromModalFieldV18 ? oldValueFromModalFieldV18(form,f) : (form.elements[f]?.value || '');
  if(f==='role') v=String(v||'').toLowerCase();
  if(f==='device_time' && !v) v=localDeviceTime();
  return v;
};

function renderWhatsAppSetup(){
  const sec=document.getElementById('whatsapp'); if(!sec)return;
  const old=sec.innerHTML;
  if(sec.querySelector('#waSetup')) return;
  const div=document.createElement('div');
  div.id='waSetup';
  div.className='card';
  div.innerHTML=`<h2>WhatsApp Slip / Receipt Intake</h2>
  <p>Drivers can send slips/photos to WhatsApp. Use WhatsApp Business, Twilio, Make.com or Zapier to POST the media to your ERP webhook.</p>
  <pre>/api/whatsapp/inbound?token=YOUR_TOKEN</pre>
  <p class="help">Railway variable needed: WHATSAPP_WEBHOOK_TOKEN. Payload fields: media_url, driver, truck, doc_type, text. Uploaded items go to Driver Hub upload queue, then AI processes them.</p>
  <button class="btn" onclick="copyWebhookInfo()">Copy Setup Text</button>`;
  sec.prepend(div);
}
function copyWebhookInfo(){
  const txt=`WhatsApp to ERP setup:
POST to: ${location.origin}/api/whatsapp/inbound?token=YOUR_TOKEN
Railway variable: WHATSAPP_WEBHOOK_TOKEN
Fields: media_url, driver, truck, doc_type, text
Use Make.com, Zapier, Twilio WhatsApp or Meta WhatsApp Cloud API.`;
  navigator.clipboard?.writeText(txt);
  alert('Setup copied');
}

const oldShowV18=show;
show=function(id,btn){
  oldShowV18(id,btn);
  if(id==='whatsapp') setTimeout(renderWhatsAppSetup,100);
};


// V19: all alerts linked + proper dashboard graphs
let lastDashboardData=null;

function drawGraph(canvasId, dataObj, type='bar'){
  const c=document.getElementById(canvasId); if(!c)return;
  const ctx=c.getContext('2d');
  const rect=c.getBoundingClientRect();
  const w=c.width=Math.max(600, rect.width*2);
  const h=c.height=480;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(0,0,w,h);
  const labels=Object.keys(dataObj||{}).slice(0,10);
  const vals=labels.map(k=>Number(dataObj[k]||0));
  const max=Math.max(...vals.map(v=>Math.abs(v)),1);
  ctx.strokeStyle='rgba(255,255,255,.15)';
  ctx.lineWidth=1;
  for(let i=0;i<5;i++){let y=40+i*(h-90)/4;ctx.beginPath();ctx.moveTo(25,y);ctx.lineTo(w-20,y);ctx.stroke();}
  if(type==='line'){
    ctx.strokeStyle='#45ff67';ctx.lineWidth=5;ctx.beginPath();
    vals.forEach((v,i)=>{let x=40+i*((w-80)/Math.max(vals.length-1,1));let y=h-55-(v/max)*(h-110); if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});
    ctx.stroke();
  } else {
    const bw=(w-80)/(Math.max(vals.length,1)*1.5);
    vals.forEach((v,i)=>{
      const x=45+i*bw*1.5;
      const bh=(Math.abs(v)/max)*(h-120);
      ctx.fillStyle=v<0?'#ff4e4e':'#2e8cff';
      ctx.fillRect(x,h-55-bh,bw,bh);
      ctx.fillStyle='white';ctx.font='22px Arial';
      ctx.fillText(String(labels[i]).slice(0,10),x,h-18);
      ctx.font='20px Arial';
      ctx.fillText(Number(v).toLocaleString(),x, h-62-bh);
    });
  }
}

function renderBetterAlerts(alertRows){
  const box=document.getElementById('alerts');
  if(!box)return;
  if(!alertRows || !alertRows.length){box.innerHTML='<p>No urgent alerts</p>';return;}
  box.className='alertList';
  box.innerHTML=alertRows.map(a=>`<div class="alertItem ${a.severity||''}"><b>${a.severity||'Info'}</b> — ${a.message||''}</div>`).join('');
}

function ensureGraphDashboard(){
  const dash=document.getElementById('dashboard'); if(!dash)return;
  if(!document.getElementById('v19GraphGrid')){
    const div=document.createElement('div');
    div.id='v19GraphGrid';
    div.className='graphGrid';
    div.innerHTML=`
      <div class="card graphCard"><h2>Revenue by Route</h2><canvas class="graphCanvas" id="gRevenueRoute"></canvas></div>
      <div class="card graphCard"><h2>Profit by Driver</h2><canvas class="graphCanvas" id="gProfitDriver"></canvas></div>
      <div class="card graphCard"><h2>Diesel by Truck</h2><canvas class="graphCanvas" id="gDieselTruck"></canvas></div>
      <div class="card graphCard"><h2>Expenses Breakdown</h2><canvas class="graphCanvas" id="gExpenses"></canvas></div>
      <div class="card graphCard"><h2>Invoice Status</h2><canvas class="graphCanvas" id="gInvoiceStatus"></canvas></div>
      <div class="card graphCard"><h2>Receivables by Client</h2><canvas class="graphCanvas" id="gReceivables"></canvas></div>
    `;
    dash.appendChild(div);
  }
}

function drawBetterGraphs(d){
  if(!d || !d.charts)return;
  ensureGraphDashboard();
  setTimeout(()=>{
    drawGraph('gRevenueRoute',d.charts.revenueByRoute,'bar');
    drawGraph('gProfitDriver',d.charts.profitByDriver,'bar');
    drawGraph('gDieselTruck',d.charts.dieselByTruck,'bar');
    drawGraph('gExpenses',d.charts.expensesBreakdown,'bar');
    drawGraph('gInvoiceStatus',d.charts.invoiceStatus,'bar');
    drawGraph('gReceivables',d.charts.receivablesByClient,'bar');
  },150);
}

const oldRenderDashV19 = renderDash;
renderDash = function(d){
  lastDashboardData=d;
  oldRenderDashV19(d);
  renderBetterAlerts(d.alerts);
  ensureGraphDashboard();
  drawBetterGraphs(d);
};

const oldShowV19 = show;
show = function(id,btn){
  oldShowV19(id,btn);
  if(id==='dashboard' && lastDashboardData){
    setTimeout(()=>{renderBetterAlerts(lastDashboardData.alerts); drawBetterGraphs(lastDashboardData);},200);
  }
};
