// === NAVIGATION ===
const allPages=['home','services','contact'];

function gp(n){
  window.scrollTo(0,0);
  allPages.forEach(p=>{
    document.getElementById('p-'+p).classList.toggle('active',p===n);
    const ni=document.getElementById('ni-'+p);
    if(ni) ni.classList.toggle('on',p===n);
  });
}

function sm(m){
  document.getElementById('mb-b').className='mbtn'+(m==='b'?' s-him':'');
  document.getElementById('mb-g').className='mbtn'+(m==='g'?' s-her':'');
}

// === CLOCK ===
function updateTime(){
  const now=new Date();
  const h=String(now.getHours()).padStart(2,'0');
  const m=String(now.getMinutes()).padStart(2,'0');
  document.getElementById('nav-time').textContent=h+':'+m;
}
updateTime();
setInterval(updateTime,30000);

// === MIN DATE ===
const today=new Date().toISOString().split('T')[0];
const fd=document.getElementById('f-date');
if(fd) fd.min=today;

// === PWA INSTALL ===
let deferredPrompt;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  deferredPrompt=e;
  document.getElementById('install-banner').classList.add('show');
});
document.getElementById('install-btn').addEventListener('click',async()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  const{outcome}=await deferredPrompt.userChoice;
  deferredPrompt=null;
  document.getElementById('install-banner').classList.remove('show');
});
document.getElementById('install-close').addEventListener('click',()=>{
  document.getElementById('install-banner').classList.remove('show');
});

// === iOS INSTALL ===
const isIos=/iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone=window.matchMedia('(display-mode:standalone)').matches||navigator.standalone;
if(isIos&&!isStandalone&&!localStorage.getItem('kb_ios_dismiss')){
  setTimeout(()=>document.getElementById('ios-banner').classList.add('show'),2000);
}

// === SERVICE WORKER ===
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}

// === SERVICES DATA ===
const ADMIN_PIN='1234';
const SERVICES={
  him:[
    {id:'h1',name:'Чоловіча стрижка',price:280},
    {id:'h2',name:'Фейд',price:350},
    {id:'h3',name:'Андеркат',price:320},
    {id:'h4',name:'Корекція бороди',price:180},
    {id:'h5',name:'Стрижка + борода',price:380},
    {id:'h6',name:'Бритво гоління',price:250},
    {id:'h7',name:'Укладка + стайлінг',price:150},
    {id:'h8',name:'Дитяча стрижка',price:200},
    {id:'h9',name:'VIP пакет',price:600}
  ],
  her:[
    {id:'s1',name:'Жіноча стрижка',price:320},
    {id:'s2',name:'Каре',price:380},
    {id:'s3',name:'Кінчики',price:220},
    {id:'s4',name:'Гель-лак манікюр',price:450},
    {id:'s5',name:'Педикюр апаратний',price:550},
    {id:'s6',name:'Нарощування вій',price:550},
    {id:'s7',name:'Ламінування брів',price:350},
    {id:'s8',name:'Макіяж вечірній',price:700},
    {id:'s9',name:'Манікюр + Педикюр',price:800}
  ]
};

// === PRICE STORAGE ===
function getSavedPrices(){
  try{return JSON.parse(localStorage.getItem('kb_prices'))||{}}catch(e){return{}}
}
function getPrice(id,def){
  const saved=getSavedPrices();
  return saved[id]!==undefined?saved[id]:def;
}

// === LOGGING ===
function getLogs(){
  try{
    let logs=JSON.parse(localStorage.getItem('kb_logs'))||[];
    const threeMonths=Date.now()-90*24*60*60*1000;
    logs=logs.filter(l=>l.ts>threeMonths);
    localStorage.setItem('kb_logs',JSON.stringify(logs));
    return logs;
  }catch(e){return[]}
}
function addLog(action,detail){
  const logs=getLogs();
  logs.push({ts:Date.now(),action,detail,date:new Date().toLocaleString('uk-UA')});
  localStorage.setItem('kb_logs',JSON.stringify(logs));
}

// === APPLY PRICES TO UI ===
function applyPricesToUI(){
  const himServices=SERVICES.him;
  const herServices=SERVICES.her;
  document.querySelectorAll('#svc-him .detail-item').forEach((el,i)=>{
    if(himServices[i]){
      el.querySelector('.detail-price').textContent='від '+getPrice(himServices[i].id,himServices[i].price)+' ₴';
    }
  });
  document.querySelectorAll('#svc-her .detail-item').forEach((el,i)=>{
    if(herServices[i]){
      el.querySelector('.detail-price').textContent='від '+getPrice(herServices[i].id,herServices[i].price)+' ₴';
    }
  });
  if(typeof renderCalc==='function') renderCalc();
}

// === ADMIN ===
function renderAdminPrices(){
  ['him','her'].forEach(cat=>{
    const wrap=document.getElementById('adm-'+cat);
    wrap.innerHTML='';
    SERVICES[cat].forEach(s=>{
      const p=getPrice(s.id,s.price);
      const d=document.createElement('div');
      d.className='adm-item';
      d.innerHTML='<span class="adm-item-name">'+s.name+'</span><input class="adm-item-price" type="number" data-id="'+s.id+'" data-old="'+p+'" value="'+p+'" min="0" step="10"> <span style="font-size:0.7rem;color:var(--muted)">₴</span>';
      wrap.appendChild(d);
    });
  });
}

function renderLogs(){
  const logs=getLogs().reverse();
  const wrap=document.getElementById('adm-log');
  if(!logs.length){wrap.innerHTML='<div class="adm-log-empty">Поки немає записів</div>';return;}
  wrap.innerHTML=logs.map(l=>'<div class="adm-log-item"><span class="adm-log-date">'+l.date+'</span><br>'+l.action+': '+l.detail+'</div>').join('');
}

function adminLogin(){
  const pin=document.getElementById('admin-pin').value;
  if(pin===ADMIN_PIN){
    document.getElementById('admin-wrap').classList.add('admin-ok');
    document.getElementById('pin-err').style.display='none';
    renderAdminPrices();
    renderLogs();
    addLog('Вхід','Адміністратор увійшов');
  }else{
    document.getElementById('pin-err').style.display='block';
  }
}

function adminSave(){
  const saved=getSavedPrices();
  const inputs=document.querySelectorAll('.adm-item-price');
  const changes=[];
  inputs.forEach(inp=>{
    const id=inp.dataset.id;
    const oldVal=parseInt(inp.dataset.old);
    const newVal=parseInt(inp.value)||0;
    saved[id]=newVal;
    if(oldVal!==newVal){
      const name=inp.parentElement.querySelector('.adm-item-name').textContent;
      changes.push(name+': '+oldVal+'₴ → '+newVal+'₴');
    }
  });
  localStorage.setItem('kb_prices',JSON.stringify(saved));
  if(changes.length){
    changes.forEach(c=>addLog('Зміна ціни',c));
  }else{
    addLog('Збереження','Без змін');
  }
  applyPricesToUI();
  renderAdminPrices();
  renderLogs();
  const st=document.getElementById('adm-status');
  st.textContent='✓ Збережено'+(changes.length?' ('+changes.length+' змін)':'');
  st.classList.add('show');
  setTimeout(()=>st.classList.remove('show'),3000);
}

// === EXPORT ===
function adminExport(){
  const rows=[['Категорія','Послуга','Ціна (₴)']];
  SERVICES.him.forEach(s=>rows.push(['Для нього',s.name,getPrice(s.id,s.price)]));
  SERVICES.her.forEach(s=>rows.push(['Для неї',s.name,getPrice(s.id,s.price)]));
  downloadCSV('MOles_Prices_'+todayStr()+'.csv',rows);
  addLog('Експорт','Прайс-лист CSV');
  renderLogs();
}

function adminExportLog(){
  const logs=getLogs();
  const rows=[['Дата','Операція','Деталі']];
  logs.forEach(l=>rows.push([l.date,l.action,l.detail]));
  downloadCSV('MOles_Log_'+todayStr()+'.csv',rows);
  addLog('Експорт','Журнал операцій CSV');
  renderLogs();
}

function downloadCSV(filename,rows){
  const bom='﻿';
  const csv=bom+rows.map(r=>r.map(c=>'"'+(c+'').replace(/"/g,'""')+'"').join(';')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function todayStr(){return new Date().toISOString().split('T')[0]}

// === THEMES ===
const THEMES=['peach','rose','lavender','mint','dark'];
function setTheme(t){
  THEMES.forEach(th=>document.documentElement.classList.remove('theme-'+th));
  document.documentElement.classList.add('theme-'+t);
  localStorage.setItem('kb_theme',t);
  document.querySelectorAll('.theme-dot').forEach(d=>{
    d.classList.toggle('active',d.dataset.theme===t);
  });
  addLog('Зміна теми','Тема: '+t);
  renderLogs();
}
function loadTheme(){
  const t=localStorage.getItem('kb_theme')||'peach';
  THEMES.forEach(th=>document.documentElement.classList.remove('theme-'+th));
  if(t!=='peach') document.documentElement.classList.add('theme-'+t);
  document.querySelectorAll('.theme-dot').forEach(d=>{
    d.classList.toggle('active',d.dataset.theme===t);
  });
}
loadTheme();

// === URL HASH NAVIGATION ===
function checkHash(){
  const hash=window.location.hash.replace('#','');
  if(hash&&allPages.includes(hash)) gp(hash);
}
checkHash();
window.addEventListener('hashchange',checkHash);

// === CALCULATOR ===
let calcMode='him';
let calcSelected={};

function calcTab(mode){
  calcMode=mode;
  calcSelected={};
  document.getElementById('ct-him').classList.toggle('active',mode==='him');
  document.getElementById('ct-her').classList.toggle('active',mode==='her');
  renderCalc();
}

function renderCalc(){
  const list=document.getElementById('calc-list');
  const items=SERVICES[calcMode];
  list.innerHTML=items.map(s=>{
    const p=getPrice(s.id,s.price);
    const on=calcSelected[s.id]?'on':'';
    return '<div class="calc-item '+on+'" onclick="toggleCalc(\''+s.id+'\')"><div class="calc-check">✓</div><span class="calc-item-name">'+s.name+'</span><span class="calc-item-price">'+p+' ₴</span></div>';
  }).join('');
  updateCalcTotal();
}

function toggleCalc(id){
  calcSelected[id]=!calcSelected[id];
  renderCalc();
}

function updateCalcTotal(){
  const items=SERVICES[calcMode];
  let total=0;
  items.forEach(s=>{
    if(calcSelected[s.id]) total+=getPrice(s.id,s.price);
  });
  document.getElementById('calc-sum').textContent=total+' ₴';
}

renderCalc();

// === SERVICE TABS ===
function svcTab(mode){
  document.getElementById('st-him').classList.toggle('active',mode==='him');
  document.getElementById('st-her').classList.toggle('active',mode==='her');
  document.getElementById('svc-him').style.display=mode==='him'?'block':'none';
  document.getElementById('svc-her').style.display=mode==='her'?'block':'none';
}

applyPricesToUI();
