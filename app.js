
const SUPABASE_URL = "https://fafedftoyztptdiubjmx.supabase.co";
const SUPABASE_KEY = "import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://fafedftoyztptdiubjmx.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)";

let supabaseClient;

async function connectSupabase() {
  const { createClient } = await import(
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
  );

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data, error } = await supabaseClient
    .from("system_info")
    .select("app_version, database_version")
    .limit(1);

  if (error) {
    console.error("Supabase connection error:", error);
    return;
  }

  console.log("Supabase connected:", data);
}

connectSupabase();

const products = {"pizzeria": {"slug": "pizzeria", "title": "Aprire una Pizzeria nel 2026", "category": "Ristorazione", "emoji": "🍕", "color": "orange", "summary": "Costi profitto rischi ed errori da conoscere prima di partire", "risk": 78, "riskLabel": "Rischio alto", "riskColor": "red", "opportunity": 4.1, "investment": "Alto", "investmentValue": 180000, "profit": "Medio", "payback": "3 - 7 anni", "difficulty": "Alta", "trend": "In crescita moderata"}, "mcdonalds": {"slug": "mcdonalds", "title": "Aprire un McDonald’s nel 2026", "category": "Franchising", "emoji": "🍔", "color": "blue", "summary": "Investimento costi ricavi selezione e rischi del franchising", "risk": 64, "riskLabel": "Rischio medio alto", "riskColor": "orange", "opportunity": 4.4, "investment": "Molto alto", "investmentValue": 1200000, "profit": "Alto", "payback": "5 - 7 anni", "difficulty": "Molto alta", "trend": "Stabile"}, "autolavaggio": {"slug": "autolavaggio", "title": "Aprire un Autolavaggio nel 2026", "category": "Servizi", "emoji": "🚗", "color": "green", "summary": "Costi attrezzature margini posizione e rischi operativi", "risk": 46, "riskLabel": "Rischio medio", "riskColor": "yellow", "opportunity": 4.3, "investment": "Medio", "investmentValue": 150000, "profit": "Medio alto", "payback": "3 - 5 anni", "difficulty": "Media", "trend": "In crescita"}, "bar": {"slug": "bar", "title": "Aprire un Bar nel 2026", "category": "Ristorazione", "emoji": "☕", "color": "pink", "summary": "Investimento costi giornalieri margini e punti critici", "risk": 71, "riskLabel": "Rischio alto", "riskColor": "red", "opportunity": 3.8, "investment": "Medio", "investmentValue": 90000, "profit": "Medio", "payback": "3 - 6 anni", "difficulty": "Media alta", "trend": "Competitivo"}}

function getUnlocked(){try{return JSON.parse(localStorage.getItem("bizscanUnlocked")||"[]")}catch{return[]}}
function saveUnlocked(v){localStorage.setItem("bizscanUnlocked",JSON.stringify([...new Set(v)]))}
function getFavs(){try{return JSON.parse(localStorage.getItem("bizscanFavs")||"[]")}catch{return[]}}
function saveFavs(v){localStorage.setItem("bizscanFavs",JSON.stringify([...new Set(v)]))}
function getCompare(){try{return JSON.parse(localStorage.getItem("bizscanCompare")||"[]")}catch{return[]}}
function saveCompare(v){localStorage.setItem("bizscanCompare",JSON.stringify(v.slice(0,2)))}

function toggleFav(slug){
  let f=getFavs()
  f=f.includes(slug)?f.filter(x=>x!==slug):[...f,slug]
  saveFavs(f)
  renderCards()
}

function toggleCompare(slug){
  let c=getCompare()
  if(c.includes(slug))c=c.filter(x=>x!==slug)
  else if(c.length<2)c=[...c,slug]
  saveCompare(c)
  updateCompareBar()
  renderCards()
}

function updateCompareBar(){
  const bar=document.getElementById("compareBar")
  if(!bar)return
  const c=getCompare()
  bar.classList.toggle("show",c.length>0)
  document.getElementById("compareCount").textContent=`${c.length} su 2 scelte`
  document.getElementById("compareBtn").disabled=c.length!==2
}

function openCompare(){
  const c=getCompare()
  if(c.length!==2)return
  const a=products[c[0]],b=products[c[1]]
  document.getElementById("modalContent").innerHTML=`
    <h2>Confronto rapido</h2>
    <div class="compare-grid">
      <div class="compare-cell"><small>Attività</small><strong>${a.title}</strong></div>
      <div class="compare-cell"><small>Attività</small><strong>${b.title}</strong></div>
      <div class="compare-cell"><small>Rischio</small><strong>${a.risk} su 100</strong></div>
      <div class="compare-cell"><small>Rischio</small><strong>${b.risk} su 100</strong></div>
      <div class="compare-cell"><small>Opportunità</small><strong>${a.opportunity} su 5</strong></div>
      <div class="compare-cell"><small>Opportunità</small><strong>${b.opportunity} su 5</strong></div>
      <div class="compare-cell"><small>Investimento</small><strong>${a.investment}</strong></div>
      <div class="compare-cell"><small>Investimento</small><strong>${b.investment}</strong></div>
      <div class="compare-cell"><small>Rientro</small><strong>${a.payback}</strong></div>
      <div class="compare-cell"><small>Rientro</small><strong>${b.payback}</strong></div>
    </div>
    <button class="btn blue full" style="margin-top:12px" onclick="closeModal()">Chiudi confronto</button>
  `
  document.getElementById("modal").classList.add("show")
}

function renderCards(){
  const host=document.getElementById("cardsHost")
  if(!host)return
  const q=(document.getElementById("liveSearch")?.value||"").toLowerCase()
  const risk=document.getElementById("riskFilter")?.value||"all"
  const sort=document.getElementById("sortFilter")?.value||"recommended"
  const favs=getFavs(),compare=getCompare()
  let arr=Object.values(products).filter(p=>{
    const text=`${p.title} ${p.category} ${p.summary}`.toLowerCase()
    const qok=!q||text.includes(q)
    const rok=risk==="all"||(risk==="low"&&p.risk<50)||(risk==="medium"&&p.risk>=50&&p.risk<70)||(risk==="high"&&p.risk>=70)
    return qok&&rok
  })
  if(sort==="risk")arr.sort((a,b)=>a.risk-b.risk)
  if(sort==="opportunity")arr.sort((a,b)=>b.opportunity-a.opportunity)
  if(sort==="investment")arr.sort((a,b)=>a.investmentValue-b.investmentValue)
  host.innerHTML=arr.map(p=>`
    <article class="card">
      <a class="cover ${p.color}" href="${p.slug}.html"><span style="font-size:34px">${p.emoji}</span><strong>${p.category}</strong></a>
      <div class="card-body">
        <h3><a href="${p.slug}.html">${p.title}</a></h3>
        <p>${p.summary}</p>
        <div class="risk-row">
          <div class="risk-meter"><span class="risk-dot ${p.riskColor}"></span><span class="risk-text">${p.riskLabel}</span></div>
          <span class="score">★ ${p.opportunity}</span>
        </div>
        <div class="badges"><span class="badge">${p.investment}</span><span class="badge">${p.payback}</span><span class="badge">${p.trend}</span></div>
        <div class="card-actions">
          <span class="price">1,99 €</span>
          <div class="small-actions">
            <button class="mini ${favs.includes(p.slug)?"active":""}" onclick="toggleFav('${p.slug}')">♡</button>
            <button class="mini ${compare.includes(p.slug)?"active":""}" onclick="toggleCompare('${p.slug}')">⇄</button>
            <a class="btn primary" href="${p.slug}.html">Apri</a>
          </div>
        </div>
      </div>
    </article>
  `).join("")||`<div class="notice">Nessun risultato con questi filtri</div>`
  updateCompareBar()
}

function unlockProduct(slug){const v=getUnlocked();v.push(slug);saveUnlocked(v);closeModal();updateProductPage(slug)}
function unlockAll(){saveUnlocked(Object.keys(products));closeModal();location.href="library.html"}
function updateProductPage(slug){
  const unlocked=getUnlocked().includes(slug)
  const locked=document.getElementById("lockedActions"),buy=document.getElementById("buyAction")
  if(locked)locked.classList.toggle("locked",!unlocked)
  if(buy)buy.style.display=unlocked?"none":"inline-flex"
  const status=document.getElementById("unlockStatus")
  if(status)status.textContent=unlocked?"Analisi già sbloccata":"Modalità demo attiva"
}
function openBuy(slug){
  const p=products[slug]
  document.getElementById("modalContent").innerHTML=`<h2>${p.title}</h2><p>Questa è una simulazione completa senza pagamento reale</p><div class="notice">Dopo Stripe qui apparirà il checkout reale</div><button class="btn primary full" onclick="unlockProduct('${slug}')">Sblocca demo 1,99 €</button>`
  document.getElementById("modal").classList.add("show")
}
function openPlan(type){
  const html={
    single:`<h2>1 analisi</h2><p>Scegli una delle analisi disponibili</p><a class="btn primary full" href="search.html">Scegli analisi</a>`,
    bundle:`<h2>Pacchetto 5</h2><p>Nella demo vengono sbloccate tutte le analisi disponibili</p><button class="btn blue full" onclick="unlockAll()">Attiva pacchetto demo 4,99 €</button>`,
    plus:`<h2>BizScan Plus</h2><p>Nella demo vengono sbloccate tutte le analisi e la libreria completa</p><button class="btn purple full" onclick="unlockAll()">Attiva Plus demo 9,99 € al mese</button>`,
    menu:`<h2>Menu BizScan</h2><div class="actions"><a class="btn dark full" href="index.html">Home</a><a class="btn dark full" href="search.html">Tutte le analisi</a><a class="btn dark full" href="pricing.html">Prezzi</a><a class="btn dark full" href="library.html">Libreria</a></div>`
  }[type]
  document.getElementById("modalContent").innerHTML=html
  document.getElementById("modal").classList.add("show")
}
function closeModal(){document.getElementById("modal").classList.remove("show")}
function searchBusiness(){
  const q=(document.getElementById("searchInput")?.value||"").toLowerCase().trim()
  if(q.includes("pizza"))location.href="pizzeria.html"
  else if(q.includes("mcd"))location.href="mcdonalds.html"
  else if(q.includes("lavaggio")||q.includes("auto"))location.href="autolavaggio.html"
  else if(q.includes("bar"))location.href="bar.html"
  else location.href="search.html?q="+encodeURIComponent(q)
}
function renderLibrary(){
  const host=document.getElementById("libraryList")
  if(!host)return
  const unlocked=getUnlocked()
  if(!unlocked.length){host.innerHTML=`<div class="notice">Nessuna analisi sbloccata</div><a class="btn primary full" href="search.html">Scopri le analisi</a>`;return}
  host.innerHTML=unlocked.map(slug=>{const p=products[slug];return `<div class="library-item"><div class="library-icon">${p.emoji}</div><div class="library-info"><h3>${p.title}</h3><small>${p.riskLabel} · ★ ${p.opportunity}</small></div><a class="btn dark" href="pdfs/${slug}.pdf" target="_blank">Apri</a><a class="btn primary" href="pdfs/${slug}.pdf" download>Scarica</a></div>`}).join("")
}
document.addEventListener("DOMContentLoaded",()=>{
  const slug=document.body.dataset.product
  if(slug)updateProductPage(slug)
  renderLibrary()
  renderCards()
  const q=new URLSearchParams(location.search).get("q")
  if(q&&document.getElementById("liveSearch")){document.getElementById("liveSearch").value=q;renderCards()}
})
