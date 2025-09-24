// ValTax Assist — main client script
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// Navigation
$$('.nav-link').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  $$('.nav-link').forEach(x => x.classList.remove('active'));
  a.classList.add('active');
  const page = a.dataset.page;
  showPage(page);
}));
function showPage(id){
  $$('.page').forEach(p => p.style.display = 'none');
  const el = document.getElementById(id);
  if(el) el.style.display = 'block';
  window.scrollTo(0,0);
}

// Install prompt (PWA)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; $('#installBtn').style.display = 'inline-block'; });
$('#installBtn').addEventListener('click', async () => { if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; $('#installBtn').style.display = 'none'; });

// Storage helpers
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch(e){ return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// Data
let obligations = load('vt_obligations', []); // user adds obligations
let personal = load('vt_personal_deadlines', []);
let tasks = load('vt_tasks', []);
let bookmarks = load('vt_bookmarks', []);

// Render upcoming deadlines (dashboard)
function renderUpcoming(){
  const el = $('#upcomingDeadlines'); el.innerHTML = '';
  if(!obligations.length) { el.textContent = 'No deadlines yet.'; return; }
  obligations.slice(0,6).forEach(o => {
    const div = document.createElement('div'); div.className = 'list-item';
    div.innerHTML = `<div><strong>${o.name}</strong><div class="small muted">${o.form||''} • ${o.deadline||''}</div></div><div><button class="linkbtn" data-open="calendar">View</button></div>`;
    el.appendChild(div);
  });
}

// Calendar render & mark filed fix
function renderCalendar(){
  const el = $('#calendarList'); el.innerHTML = '';
  obligations.forEach(o => {
    const div = document.createElement('div'); div.className = 'list-item';
    const now = new Date(); const due = o.deadline ? new Date(o.deadline) : null;
    let status = '';
    if(o.filed) status = `<span style="color:#059669;font-weight:700">Filed</span>`;
    else if(due && due < now) status = `<span style="color:#ef4444;font-weight:700">Overdue</span>`;
    else if(due && ((due-now)/(1000*60*60*24) <= 3)) status = `<span style="color:#f59e0b;font-weight:700">Due Soon</span>`;
    div.innerHTML = `<div><strong>${o.name}</strong><div class="small muted">${o.form||''} • ${o.deadline||''}</div></div><div>${status} <button class="linkbtn" data-id="${o.id}" data-action="markFiled">Mark Filed</button></div>`;
    el.appendChild(div);
  });
  if(personal.length){
    el.appendChild(document.createElement('hr'));
    personal.forEach(p => {
      const d = document.createElement('div'); d.className='list-item';
      d.innerHTML = `<div><strong>${p.title}</strong><div class="small muted">${p.date}</div></div><div><button class="linkbtn" data-id="${p.id}" data-action="delPersonal">Delete</button></div>`;
      el.appendChild(d);
    });
  }
}

// add obligation (prompt)
$('#addObligationBtn').addEventListener('click', ()=> {
  const name = prompt('Obligation name (e.g., VAT (2550M))'); if(!name) return;
  const form = prompt('Form code (optional)') || '';
  const date = prompt('Deadline date (YYYY-MM-DD)'); if(!date) return;
  const id = Date.now().toString(36);
  obligations.push({id, name, form, deadline: date, filed: false});
  save('vt_obligations', obligations); renderCalendar(); renderUpcoming();
});
$('#addPersonalBtn').addEventListener('click', ()=> {
  const title = prompt('Personal deadline title'); if(!title) return;
  const date = prompt('Deadline date (YYYY-MM-DD)'); if(!date) return;
  personal.push({id:Date.now(), title, date}); save('vt_personal_deadlines', personal); renderCalendar();
});

// event delegation for calendar actions
document.addEventListener('click', e => {
  const t = e.target;
  if(t.dataset.action === 'markFiled'){
    const id = t.dataset.id;
    obligations = obligations.map(o => o.id === id ? {...o, filed:true} : o);
    save('vt_obligations', obligations); renderCalendar(); renderUpcoming();
  }
  if(t.dataset.action === 'delPersonal'){
    const id = Number(t.dataset.id);
    personal = personal.filter(p => p.id !== id); save('vt_personal_deadlines', personal); renderCalendar();
  }
  if(t.dataset.open === 'calendar') showPage('calendar');
});

// =================== GUIDES ===================
const guides = {
  orus: `
    <h2>ORUS (Online Registration & Update System)</h2>
    <h3>Purpose</h3>
    <p>Used for taxpayer registration, record updates, RDO transfers, and TIN ID printing.</p>
    
    <h3>Requirements</h3>
    <ul>
      <li>Taxpayer Identification Number (TIN)</li>
      <li>Valid email address</li>
      <li>Scanned documents (JPG/PDF, under 4MB each): ID, Proof of Address, SEC/DTI Cert (if applicable)</li>
    </ul>
    
    <h3>Step-by-Step</h3>
    <ol>
      <li>Go to <a href="https://orus.bir.gov.ph" target="_blank">orus.bir.gov.ph</a>.</li>
      <li>Click <b>Enroll to ORUS</b> if you’re a first-time user.</li>
      <li>Fill in TIN, name, email, mobile number (for corporations: Date of Incorporation & SEC Reg No.).</li>
      <li>Check your email for an activation link.</li>
      <li>Click activation → set your password.</li>
      <li>Login with TIN & password.</li>
      <li>Select service: Registration, Update, or TIN ID Printing.</li>
      <li>Upload required documents → click <b>Submit</b>.</li>
      <li>Save Transaction Reference Number (TRN) + download Acknowledgement Receipt.</li>
    </ol>

    <h3>Troubleshooting</h3>
    <ul>
      <li><b>No activation email?</b> Check Spam folder → Resend link.</li>
      <li><b>Upload fails?</b> File must be under 4MB, rename shorter, retry at night (8–11PM).</li>
      <li><b>Forgot password?</b> Use <b>Forgot Password</b> → reset link sent via email.</li>
    </ul>
  `,

  efps: `
    <h2>eFPS (Electronic Filing & Payment System)</h2>
    <h3>Purpose</h3>
    <p>Used by enrolled taxpayers for online filing and payment of returns.</p>
    
    <h3>Requirements</h3>
    <ul>
      <li>Approved eFPS enrollment</li>
      <li>TIN and eFPS Username</li>
      <li>Bank account with Authorized Agent Bank (AAB)</li>
    </ul>

    <h3>Step-by-Step</h3>
    <ol>
      <li>Go to <a href="https://efps.bir.gov.ph" target="_blank">efps.bir.gov.ph</a>.</li>
      <li>Login with TIN, Username, Password.</li>
      <li>Select <b>File Return</b>.</li>
      <li>Choose correct BIR Form (e.g., 2550M, 1701, etc.).</li>
      <li>Enter details → click <b>Validate</b>.</li>
      <li>Click <b>Submit</b> → copy Acknowledgement Reference Number (ARN).</li>
      <li>Go to <b>Payment Module</b>.</li>
      <li>Select bank → redirected to bank portal → confirm payment.</li>
      <li>Save Filing Reference Number (FRN) as proof.</li>
    </ol>

    <h3>Troubleshooting</h3>
    <ul>
      <li><b>Login fails?</b> Clear browser cache/cookies, try Chrome/Edge, reset password.</li>
      <li><b>Payment not processed?</b> Call your bank hotline with ARN.</li>
      <li><b>Website slow?</b> File late evening or early morning.</li>
    </ul>
  `,

  ebirforms: `
    <h2>eBIRForms (Electronic BIR Forms Package)</h2>
    <h3>Purpose</h3>
    <p>Offline form filling with optional online submission.</p>
    
    <h3>Requirements</h3>
    <ul>
      <li>Windows computer</li>
      <li>eBIRForms Package v7.9 installed</li>
      <li>Valid email address</li>
    </ul>

    <h3>Step-by-Step</h3>
    <ol>
      <li>Download latest installer from <a href="https://www.bir.gov.ph" target="_blank">bir.gov.ph</a>.</li>
      <li>Run installer as Administrator.</li>
      <li>Launch program → go to <b>Profile</b> → enter taxpayer details.</li>
      <li>Select desired form (e.g., 1701, 2551Q, 2550M).</li>
      <li>Fill in return details carefully.</li>
      <li>Click <b>Validate</b> → correct errors.</li>
      <li>Click <b>Save</b> → then <b>Submit/Final Copy</b> (needs internet).</li>
      <li>Check email inbox for BIR confirmation.</li>
    </ol>

    <h3>Troubleshooting</h3>
    <ul>
      <li><b>Installer fails?</b> Install .NET Framework 4.8 + run as Admin.</li>
      <li><b>No confirmation email?</b> Recheck Spam/Junk folder → resubmit if none received.</li>
      <li><b>Validation error?</b> Look for red-highlighted mandatory fields.</li>
    </ul>
  `,

  eafs: `
    <h2>eAFS (Electronic Audited Financial Statement System)</h2>
    <h3>Purpose</h3>
    <p>Electronic submission of Audited Financial Statements (AFS) and attachments.</p>
    
    <h3>Requirements</h3>
    <ul>
      <li>Scanned PDF files: AFS, Audit Report, Certificate of Filing</li>
      <li>File naming format: <code>TIN_AFS.pdf</code>, <code>TIN_AuditReport.pdf</code></li>
      <li>File size: under 10MB each</li>
    </ul>

    <h3>Step-by-Step</h3>
    <ol>
      <li>Go to <a href="https://eafs.bir.gov.ph" target="_blank">eafs.bir.gov.ph</a>.</li>
      <li>Login with TIN + registered email.</li>
      <li>Click <b>Submit AFS</b>.</li>
      <li>Upload files one by one in the correct category.</li>
      <li>Wait for system confirmation per file.</li>
      <li>Click <b>Submit Final</b> → download reference acknowledgement.</li>
    </ol>

    <h3>Troubleshooting</h3>
    <ul>
      <li><b>File rejected?</b> Rename properly → follow naming convention.</li>
      <li><b>File too large?</b> Compress PDF with Adobe/online tools.</li>
      <li><b>Upload timeout?</b> Use stable internet or retry late evening.</li>
    </ul>
  `
};

// render guides list
function renderGuidesList(){
  const el = document.getElementById('guidesList'); el.innerHTML = '';
  for(const key in GUIDES){
    const g = GUIDES[key];
    const row = document.createElement('div'); row.className='list-item';
    row.innerHTML = `<div><strong>${g.title}</strong><div class="small muted">Open handbook</div></div><div><button class="linkbtn openGuideBtn" data-key="${key}">Open</button></div>`;
    el.appendChild(row);
  }
}
document.addEventListener('click', e => {
  const t = e.target;
  if(t.classList.contains('openGuideBtn')){
    const key = t.dataset.key; openGuide(key); showPage('guides');
  }
});

// open guide detail
function openGuide(key){
  const data = GUIDES[key]; if(!data) return;
  const gd = document.getElementById('guideDetail'); gd.innerHTML = '';
  const wrap = document.createElement('div'); wrap.className='card'; wrap.innerHTML = `<div class="card-header"><h4>${data.title}</h4></div><div class="card-body">${data.html}</div>`;
  gd.appendChild(wrap);
  const bm = document.createElement('div'); bm.className='card'; bm.innerHTML = `<div class="card-body"><button id="bookmarkGuide" class="linkbtn">Bookmark this guide</button></div>`;
  gd.appendChild(bm);
  document.getElementById('bookmarkGuide').addEventListener('click', ()=>{ bookmarks.push({key:key,title:data.title}); save('vt_bookmarks',bookmarks); renderBookmarks(); alert('Bookmarked'); });
  gd.scrollIntoView({behavior:'smooth'});
}

// Troubleshooting data & render
const TROUBLE = [
  {service:'ORUS', issues:[
    {title:'Cannot login / Account issues', steps:['Verify TIN/password','Use Forgot Password','Contact RDO if locked']},
    {title:'Activation email not received', steps:['Check spam','Request resend or contact RDO']}
  ]},
  {service:'eFPS', issues:[
    {title:'Payment failed', steps:['Check bank ARN/reference','Contact bank support','Save screenshots']},
    {title:'Form submission error', steps:['Validate data','Try off-peak hours']}
  ]},
  {service:'eBIRForms', issues:[
    {title:'Installer/runtime errors', steps:['Run as admin','Install .NET','Disable blocking antivirus temporarily']},
    {title:'Validation errors', steps:['Read validation message and fix fields','Save copies often']}
  ]},
  {service:'eAFS', issues:[
    {title:'Upload timeout or rejection', steps:['Compress PDF','Use Chrome','Split uploads']}
  ]}
];

function renderTroubleshoot(){
  const el = document.getElementById('troubleshootContent'); el.innerHTML = '';
  TROUBLE.forEach(svc => {
    const div = document.createElement('div'); div.className='card';
    let inner = `<div class="card-header"><h4>${svc.service}</h4></div><div class="card-body">`;
    svc.issues.forEach(i => { inner += `<details style="margin-top:8px"><summary>${i.title}</summary><div class="small muted"><ol>${i.steps.map(s => '<li>'+s+'</li>').join('')}</ol></div></details>`; });
    inner += '</div>'; div.innerHTML = inner; el.appendChild(div);
  });
}

// Bookmarks render
function renderBookmarks(){
  const el = document.getElementById('bookmarks'); el.innerHTML = '';
  if(!bookmarks.length){ el.innerHTML = '<div class="small muted">No bookmarks</div>'; return; }
  bookmarks.forEach(b => {
    const a = document.createElement('a'); a.href='#'; a.textContent = b.title; a.style.display='block';
    a.addEventListener('click', e => { e.preventDefault(); openGuide(b.key); showPage('guides'); });
    el.appendChild(a);
  });
}

// Tasks (progress tracker)
function renderTasks(){
  const area = document.getElementById('taskArea'); area.innerHTML = '';
  if(!tasks.length){ area.innerHTML = '<div class="small muted">No tasks added.</div>'; return; }
  tasks.forEach((t,i) => {
    const d = document.createElement('div'); d.className='list-item';
    d.innerHTML = `<div><strong>${t.name}</strong><div class="small muted">${t.due} • ${t.priority}</div></div><div><select data-i="${i}" class="statusSel"><option ${t.status==='Pending'?'selected':''}>Pending</option><option ${t.status==='In Progress'?'selected':''}>In Progress</option><option ${t.status==='Completed'?'selected':''}>Completed</option></select> <button class="linkbtn" data-i="${i}" data-action="delTask">Delete</button></div>`;
    area.appendChild(d);
  });
  document.querySelectorAll('.statusSel').forEach(s => s.addEventListener('change', e=>{ const i = Number(e.target.dataset.i); tasks[i].status = e.target.value; if(e.target.value==='Completed') tasks[i].completed = new Date().toISOString(); save('vt_tasks',tasks); renderTasks(); }));
  document.querySelectorAll('[data-action="delTask"]').forEach(b => b.addEventListener('click', e=>{ const i = Number(e.target.dataset.i); tasks.splice(i,1); save('vt_tasks',tasks); renderTasks(); }));
}
document.getElementById('addTaskBtn').addEventListener('click', ()=> {
  const name = $('#taskName').value.trim(); const due = $('#taskDue').value; const pr = $('#taskPriority').value;
  if(!name || !due) return alert('Enter task name and due date');
  tasks.push({name,due,priority:pr,status:'Pending',created:new Date().toISOString()}); save('vt_tasks',tasks); $('#taskName').value=''; $('#taskDue').value=''; renderTasks(); });

// Export CSV (and XLSX if SheetJS available)
$('#exportCSV').addEventListener('click', ()=> {
  const rows = [['Task Name','Deadline','Status','Priority','Completed']].concat(tasks.map(t=>[t.name,t.due,t.status,t.priority,t.completed||'']));
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = `ValTax_Progress_${new Date().toISOString().slice(0,10)}.csv`; a.click();
});
$('#exportExcel').addEventListener('click', ()=> {
  if(window.XLSX){ const ws = XLSX.utils.json_to_sheet(tasks.map(t=>({Task:t.name,Deadline:t.due,Status:t.status,Priority:t.priority,Completed:t.completed||''}))); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Task List'); const wbout = XLSX.write(wb,{bookType:'xlsx',type:'array'}); const blob = new Blob([wbout],{type:'application/octet-stream'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`ValTax_Progress_${new Date().toISOString().slice(0,10)}.xlsx`; a.click(); } else { $('#exportCSV').click(); alert('CSV exported as fallback. To generate full .xlsx with charts, add SheetJS (optional).'); } });

// Global search simple behavior
$('#globalSearch').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase(); if(!q) return;
  // find guides containing text
  const results = [];
  for(const k in GUIDES){
    const g = GUIDES[k];
    if((g.title + ' ' + g.html).toLowerCase().includes(q)) results.push({type:'guide',key:k,title:g.title});
  }
  // show quick temporary card on dashboard
  if(results.length){
    const target = document.getElementById('upcomingDeadlines');
    const temp = document.createElement('div'); temp.className='card'; temp.innerHTML = `<h4>Search Results</h4>${results.map(r=>`<div class="list-item"><div><strong>${r.title}</strong><div class="small muted">Guide</div></div><div><button class="linkbtn" data-key="${r.key}" data-action="openGuideSearch">Open</button></div></div>`).join('')}`;
    target.innerHTML = ''; target.appendChild(temp);
  }
});

document.addEventListener('click', e => {
  const t = e.target;
  if(t.dataset.action === 'openGuideSearch'){ openGuide(t.dataset.key); showPage('guides'); }
});

// render initial UI
renderGuidesList(); renderTroubleshoot(); renderCalendar(); renderUpcoming(); renderBookmarks(); renderTasks();

// service worker registration (optional offline)
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
}

// save state on unload
window.addEventListener('beforeunload', ()=>{ save('vt_obligations', obligations); save('vt_personal_deadlines', personal); save('vt_tasks', tasks); save('vt_bookmarks', bookmarks); });
