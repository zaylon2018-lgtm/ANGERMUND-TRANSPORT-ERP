
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
 diesel:{title:'Diesel + Slip AI',fields:['date','truck','driver','litres','amount','km','supplier','slip_no','scan_status','scan_confidence']},
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
 users:{title:'Users',fields:['email','password','name','role']}
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
