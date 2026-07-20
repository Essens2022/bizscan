let PACKAGES=[
 {key:'single',name:'Analisi Singola',price:1.99,analyses:1,pdfCredits:0,badge:'',indicatorCount:0,compare:'Base',features:['1 analisi interattiva','Indicatori essenziali','Accesso permanente','Report PDF acquistabile separatamente']},
 {key:'starter',name:'Starter',price:4.99,analyses:3,pdfCredits:0,badge:'',indicatorCount:0,compare:'Base',features:['3 analisi interattive','Indicatori essenziali','Libreria personale','Report PDF acquistabili separatamente']},
 {key:'smart',name:'Smart',price:6.99,analyses:5,pdfCredits:1,badge:'SCELTA INTELLIGENTE',indicatorCount:1,compare:'Base',features:['5 analisi interattive','Break-even sbloccato','Confronto tra analisi','1 credito report PDF']},
 {key:'pro',name:'Pro',price:9.99,analyses:8,pdfCredits:2,badge:'PIÙ SCELTO',indicatorCount:3,compare:'Dettagliato',features:['8 analisi interattive','Break-even','Scenari finanziari','Distribuzione dei costi','2 crediti report PDF']},
 {key:'advanced',name:'Advanced',price:14.99,analyses:12,pdfCredits:3,badge:'CONSIGLIATO',indicatorCount:6,compare:'Avanzato',features:['12 analisi interattive','Tutto Pro','Cash-flow e capitale circolante','Benchmark e test di stress','3 crediti report PDF']},
 {key:'business',name:'Business',price:18.99,analyses:16,pdfCredits:5,badge:'MIGLIOR VALORE',indicatorCount:10,compare:'Professionale',features:['16 analisi interattive','10 indicatori avanzati','Filtri e confronti professionali','Checklist investimento','5 crediti report PDF']},
 {key:'max',name:'BizScan Max',price:23.99,analyses:20,pdfCredits:7,badge:'ESPERIENZA COMPLETA',indicatorCount:12,compare:'Completo',features:['20 analisi interattive','Tutti i 12 indicatori','Tutti i grafici e filtri','Confronti completi','7 crediti report PDF']}
]
const UNIT_PRICES={analysis:1.99,indicator:2.99,pdf:3.99,comparison:1.99}
const COMPARISON_UNITS={Base:0,Dettagliato:1,Avanzato:2,Professionale:3,Completo:4}
function packageValue(p){
 const analysisValue=p.analyses*UNIT_PRICES.analysis
 const indicatorValue=p.indicatorCount*UNIT_PRICES.indicator
 const pdfValue=p.pdfCredits*UNIT_PRICES.pdf
 const comparisonValue=(COMPARISON_UNITS[p.compare]||0)*UNIT_PRICES.comparison
 const total=analysisValue+indicatorValue+pdfValue+comparisonValue
 return {analysisValue,indicatorValue,pdfValue,comparisonValue,total,saving:Math.max(0,total-p.price),resources:p.analyses+p.indicatorCount+p.pdfCredits+(COMPARISON_UNITS[p.compare]||0)}
};
let analyses=[],favorites=[],compare=[],access={authenticated:false,credits:0};
let homeFilter='recommended';
let catalogFilter='all';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const euro=n=>Number(n).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
function riskClass(p){return Number(p.risk)<45?'risk-low':Number(p.risk)<70?'risk-mid':'risk-high'}
function mediaFor(p){return p.coverUrl||p.wideCover||''}
function num(v){const m=String(v??'').replace(',','.').match(/[\d.]+/);return m?parseFloat(m[0]):null}
function metricBars(p){
 const d=(p&&p.display&&p.display.bars)||{};
 const roiN=num(p&&p.roi),payTxt=String((p&&p.payback)||'').toLowerCase(),payN=num(payTxt);
 const profitMap={'basso':32,'medio':55,'medio alto':72,'alto':88};
 const profit=d.profit??profitMap[String((p&&p.profit)||'').toLowerCase().trim()]??60;
 const roi=d.roi??(roiN!=null?Math.max(8,Math.min(96,Math.round(roiN*2.4))):60);
 const months=payN!=null?(payTxt.includes('ann')?payN*12:payN):null;
 const payback=d.payback??(months!=null?Math.max(10,Math.min(95,Math.round(100-months*1.6))):50);
 return {profit,roi,payback};
}
function image(p,wide=false){const src=wide?(p.wideCover||p.coverUrl):p.coverUrl;return src?`<img src="${esc(src)}" alt="${esc(p.title)}" loading="lazy" decoding="async">`:`<div class="visual-placeholder">${p.categoryEmoji||p.emoji||'📊'}</div>`}
function applyDbPlans(rows){
 const oneTime=(rows||[]).filter(r=>r&&r.billing_interval==='one_time'&&r.type!=='free');
 if(!oneTime.length)return;
 PACKAGES=oneTime.map(r=>{
  const d=PACKAGES.find(p=>p.key===r.type)||{};
  return {key:r.type,name:r.title||d.name||r.type,price:Number(r.price)||d.price||0,
   analyses:Number(r.analysis_limit??d.analyses??0),pdfCredits:Number(r.pdf_credits??d.pdfCredits??0),
   badge:d.badge||'',indicatorCount:d.indicatorCount||0,compare:d.compare||'Base',
   features:d.features||[String(r.description||'')].filter(Boolean)};
 });
}
async function load(){
 compare=JSON.parse(localStorage.getItem('bizscan_compare')||'[]');
 const [ra,rs,rp]=await Promise.allSettled([BizScanData.fetchPublishedAnalyses(),BizScanData.accessSummary(),BizScanData.fetchPlans()]);
 if(ra.status==='fulfilled'){analyses=ra.value}else{console.warn('Supabase non disponibile',ra.reason);analyses=[]}
 if(rs.status==='fulfilled'){access=rs.value}else{access={authenticated:false,credits:0}}
 if(rp.status==='fulfilled'){applyDbPlans(rp.value)}
 // I preferiti sono dati personali dell'account: l'unica fonte di verità è il server.
 // Un ospite non autenticato non ha una lista di preferiti locale che poi "eredita" al login.
 if(access.authenticated){
  localStorage.removeItem('bizscan_favorites');
  try{favorites=await BizScanData.fetchFavorites()}catch(e){console.warn('fetchFavorites',e);favorites=[]}
 }else{
  favorites=[];
  localStorage.removeItem('bizscan_favorites');
 }
 updateShell();
}
function updateShell(){
 const c=$('.top-actions .chip');
 const n=access.credits??access.available_credits??0;
 const pdfN=access.available_pdf_credits??0;
 const plan=(access.plan&&access.plan!=='free')?String(access.plan).charAt(0).toUpperCase()+String(access.plan).slice(1):'';
 if(c)c.textContent=`Crediti: ${n} · PDF: ${pdfN}`;
 const nameEl=$('#shellProfileName'),statusEl=$('#shellProfileStatus');
 if(nameEl){
  if(access.authenticated){
   BizScanData.currentUser().then(u=>{
    if(!u)return;
    const fn=u.user_metadata?.first_name,ln=u.user_metadata?.last_name;
    nameEl.textContent=(fn&&ln)?`${fn} ${ln}`:(u.email||'Account BizScan');
   }).catch(()=>{});
   if(statusEl)statusEl.textContent=`${n} crediti analisi · ${pdfN} crediti PDF${plan?' · Piano '+plan:''}`;
  }else{
   nameEl.textContent='Accedi | Registrati';
   if(statusEl)statusEl.textContent='Tocca per entrare nel tuo account';
  }
 }
}
function toast(t){let e=$('#toast');if(!e){e=document.createElement('div');e.id='toast';e.className='toast';document.body.append(e)}e.textContent=t;e.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>e.classList.remove('show'),1700)}
function modal(title,body,actions=''){const m=$('#globalModal'),c=$('#globalModalContent');if(!m||!c)return;c.innerHTML=`<div class="modal-head"><h2>${esc(title)}</h2><button onclick="closeModal()">×</button></div>${body}${actions}`;m.classList.add('show')}
window.closeModal=()=>$('#globalModal')?.classList.remove('show');
window.toggleFavorite=async slug=>{
 if(!access.authenticated){toast('Accedi per salvare nei preferiti');setTimeout(()=>{location.href='account.html?next='+encodeURIComponent(location.pathname+location.search)},650);return}
 const p=analyses.find(x=>x.slug===slug);if(!p?.id)return;
 const enabling=!favorites.includes(slug);
 try{await BizScanData.setFavorite(p.id,enabling)}catch(e){console.warn(e);toast('Errore, riprova');return}
 favorites=enabling?[...favorites,slug]:favorites.filter(x=>x!==slug);
 toast(enabling?'Aggiunta ai preferiti':'Rimossa dai preferiti');
 document.querySelectorAll(`[data-fav-slug="${slug}"]`).forEach(btn=>{
  btn.classList.toggle('active',enabling);
  if(btn.classList.contains('btn')){btn.innerHTML=enabling?'♥ Salvato':'♡ Salva'}
  else{btn.textContent=enabling?'♥':'♡'}
 });
 if($('#libraryContent'))renderLibrary();
};
window.toggleCompare=slug=>{
 const wasSelected=compare.includes(slug);
 compare=wasSelected?compare.filter(x=>x!==slug):compare.length<2?[...compare,slug]:[compare[1],slug];
 localStorage.setItem('bizscan_compare',JSON.stringify(compare));
 document.querySelectorAll('[data-compare-slug]').forEach(btn=>{
  const on=compare.includes(btn.dataset.compareSlug);
  btn.classList.toggle('active',on);
  if(btn.classList.contains('btn')){btn.innerHTML=on?'✓ In confronto':'⇄ Confronta'}
  else{btn.textContent=on?'✓':'⇄'}
 });
 if(compare.length===2){location.href='compare.html';return}
 toast(wasSelected?'Rimossa dal confronto':'Aggiunta al confronto');
 if($('#compareContent'))renderCompare();
};
function categories(){const m={};analyses.forEach(p=>{const k=p.category||'Altro';m[k]=(m[k]||0)+1});return Object.entries(m)}
function scoreRing(value,size='normal'){return `<div class="score-ring ${size}" style="--v:${Number(value)||0}"><div><b>${Number(value)||0}</b><small>/100</small></div></div>`}
function card(p){const url=`analysis.html?slug=${encodeURIComponent(p.slug)}`;return `<article class="business-card"><div class="business-cover business-cover-link" role="link" tabindex="0" aria-label="Apri ${esc(p.title)}" onclick="location.href='${url}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();location.href='${url}'}">${image(p)}<div class="card-tools"><button aria-label="Confronta" onclick="event.preventDefault();event.stopPropagation();toggleCompare('${p.slug}')" data-compare-slug="${p.slug}">${compare.includes(p.slug)?'✓':'⇄'}</button><button aria-label="Salva" data-fav-slug="${p.slug}" onclick="event.preventDefault();event.stopPropagation();toggleFavorite('${p.slug}')">${favorites.includes(p.slug)?'♥':'♡'}</button></div></div><a href="${url}" class="business-body"><div class="business-title-row"><div><h3>${esc(p.title)}</h3><div class="category">${esc(p.category||'Business')}</div></div><span class="card-open-arrow">→</span></div><div class="card-metrics">${scoreRing(p.score,'small')}<div class="metric-list"><span><em>Investimento</em><b>${esc(p.investment||'—')}</b></span><span><em>Profitto annuo</em><b>${esc(p.profit||'—')}</b></span><span><em>Rischio</em><b class="${riskClass(p)}">${esc((p.riskLabel||'—').replace('Rischio ',''))}</b></span></div></div></a></article>`}
function categoryIcons(i){return ['☕','🧰','🛍','▣','♨','⚙','▤','⌂'][i]||'◇'}
function sparkline(vals,color='purple'){const w=250,h=85,pad=8,max=Math.max(...vals),min=Math.min(...vals),pts=vals.map((v,i)=>`${pad+i*(w-pad*2)/(vals.length-1)},${h-pad-(v-min)/(max-min||1)*(h-pad*2)}`).join(' ');return `<svg viewBox="0 0 ${w} ${h}" class="sparkline ${color}" role="img"><polyline points="${pts}" fill="none" vector-effect="non-scaling-stroke"/></svg>`}
function platformStats(){
 const published=analyses.length;
 const activeCategories=categories().length;
 const pdfReports=analyses.filter(p=>Array.isArray(p.attachments)&&p.attachments.some(a=>a.type==='pdf')).length;
 const verifiedSources=analyses.reduce((total,p)=>{
  if(Array.isArray(p.sources)) return total+p.sources.length;
  const n=Number(p.sourceCount||p.sourcesCount||0);
  return total+(Number.isFinite(n)?n:0)
 },0);
 return {published,activeCategories,pdfReports,verifiedSources}
}
function numericMax(value){
 const nums=String(value||'').replace(/\./g,'').match(/\d+(?:[.,]\d+)?/g)||[]
 return nums.length?Math.max(...nums.map(x=>Number(x.replace(',','.')))):0
}
function paybackMonths(value){
 const txt=String(value||'').toLowerCase();const nums=txt.match(/\d+(?:[.,]\d+)?/g)||[];if(!nums.length)return 999
 const min=Math.min(...nums.map(x=>Number(x.replace(',','.'))));return txt.includes('ann')?min*12:min
}
function filterHomeAnalyses(items,filter){
 const arr=[...items]
 if(filter==='low-risk') return arr.filter(p=>Number(p.risk)<50).sort((a,b)=>(a.risk||99)-(b.risk||99))
 if(filter==='fast-return') return arr.sort((a,b)=>paybackMonths(a.payback)-paybackMonths(b.payback))
 if(filter==='high-profit') return arr.sort((a,b)=>numericMax(b.profit)-numericMax(a.profit))
 if(filter==='online') return arr.filter(p=>String(p.category||'').toLowerCase().includes('online')||String(p.title||'').toLowerCase().includes('online')||String(p.title||'').toLowerCase().includes('e-commerce'))
 return arr.sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0))
}
window.setHomeFilter=filter=>{homeFilter=filter;renderHome();document.querySelector('.home18-filters')?.scrollIntoView({block:'nearest'})}
function renderHome(){
 const host=$('#homeContent');if(!host)return
 const allFeatured=analyses.slice(0,12)
 const featured=filterHomeAnalyses(allFeatured,homeFilter).slice(0,6)
 const lead=featured[0]||allFeatured[0]||null
 const second=featured[1]||lead
 const hasData=Boolean(lead)
 const mb=metricBars(lead||{})
 const cats=categories().slice(0,8)
 const metric=(label,value)=>`<div class="home18-metric"><small>${label}</small><b>${esc(value||'—')}</b></div>`
 host.innerHTML=`<div class="home18">
  <section class="home18-hero">
   <span class="home18-kicker">ANALIZZA PRIMA DI INVESTIRE</span>
   <h1>Trova l’attività giusta <span>prima di rischiare capitale</span></h1>
   <p>Confronta investimento rischio profitto e tempi di recupero in un’unica piattaforma</p>
   <div class="home18-search"><input id="homeSearch" placeholder="Cerca pizzeria franchising attività online"><button onclick="runSearch()" aria-label="Cerca">⌕</button></div>
   <div class="home18-trust"><span>Fonti verificabili</span><span>Dati confrontabili</span><span>Pagamento unico</span></div>
  </section>

  <section class="home18-section">
   <div class="home18-head"><div><small>ESPLORA</small><h2>Opportunità in evidenza</h2></div><a href="search.html">Vedi tutte</a></div>
   <div class="home18-filters" role="tablist" aria-label="Filtra opportunità"><button class="${homeFilter==='recommended'?'active':''}" type="button" onclick="setHomeFilter('recommended')">Consigliate</button><button class="${homeFilter==='low-risk'?'active':''}" type="button" onclick="setHomeFilter('low-risk')">Basso rischio</button><button class="${homeFilter==='fast-return'?'active':''}" type="button" onclick="setHomeFilter('fast-return')">Rientro rapido</button><button class="${homeFilter==='high-profit'?'active':''}" type="button" onclick="setHomeFilter('high-profit')">Profitto alto</button><button class="${homeFilter==='online'?'active':''}" type="button" onclick="setHomeFilter('online')">Online</button></div>
   <div class="home18-carousel" id="homeFeaturedCarousel">${featured.length?featured.map(card).join(''):'<div class="home18-filter-empty">Nessuna analisi disponibile per questo filtro</div>'}</div>
  </section>

  <section class="home18-section">
   <div class="home18-head"><div><small>PIATTAFORMA</small><h2>Strumenti di analisi</h2></div><a href="search.html?tools=1">Apri tutti gli strumenti</a></div>
   <div class="home18-dashboard">
    <article class="home18-score-card">
     <div class="home18-score-top">${scoreRing(82,'large')}<div><small>BIZSCAN SCORE</small><h3>Punteggio su 100</h3><p>Rischio, investimento, profitto e rientro in un unico numero</p></div></div>
     <div class="home18-bars">
      <div><span>Rischio</span><i><b class="risk" style="width:52%"></b></i><strong>52</strong></div>
      <div><span>Profitto</span><i><b class="profit" style="width:74%"></b></i><strong>74</strong></div>
      <div><span>ROI</span><i><b class="roi" style="width:63%"></b></i><strong>63</strong></div>
      <div><span>Rientro</span><i><b class="payback" style="width:44%"></b></i><strong>44</strong></div>
     </div>
    </article>
    <article class="home18-chart-card"><small>SCENARI DI PROFITTO</small><div class="home18-bars-chart"><i style="height:34%"></i><i style="height:48%"></i><i style="height:57%"></i><i style="height:72%"></i><i style="height:88%"></i><i style="height:78%"></i></div><div class="home18-chart-labels"><span>Prudente</span><span>Realistico</span><span>Ottimistico</span></div></article>
   </div>
  </section>

  ${hasData?`<section class="home18-section">
   <div class="home18-head"><div><small>CONFRONTO</small><h2>Metti a confronto due business</h2></div><a href="compare.html">Apri confronto</a></div>
   <div class="home18-compare">${[lead,second].map(p=>`<article><h3>${esc(p.title)}</h3><div><span>Score</span><b>${Number(p.score)||0}/100</b></div><div><span>Rischio</span><b>${esc((p.riskLabel||'—').replace('Rischio ',''))}</b></div><div><span>Rientro</span><b>${esc(p.payback||'—')}</b></div><div><span>Vantaggio</span><b class="home18-winner">${esc(p.verdictLabel||'Da valutare')}</b></div></article>`).join('')}</div>
  </section>`:`<section class="home18-section">
   <div class="home18-head"><div><small>CONFRONTO</small><h2>Metti a confronto due business</h2></div></div>
   <div class="home18-filter-empty">Nessuna analisi disponibile al momento. Riprova tra poco.</div>
  </section>`}

  <section class="home18-locked">
   <div class="home18-locked-content"><small>PREMIUM</small><h2>Dati che cambiano la decisione</h2><div class="home18-blur-chart"><i style="height:42%"></i><i style="height:69%"></i><i style="height:55%"></i><i style="height:86%"></i><i style="height:64%"></i></div></div>
   <a href="pricing.html">Scopri i dati premium con BizScan Plus</a>
  </section>

  <section class="home18-how">
   <div class="home18-how-copy"><small>COME FUNZIONA</small><h2>Dalla curiosità a una decisione più consapevole</h2><p>Un percorso semplice che riduce il rumore e porta subito ai numeri che contano</p><a href="pricing.html">Vedi i pacchetti</a></div>
   <div class="home18-steps"><article><b>01</b><div><h3>Scegli l’attività</h3><p>Cerca per nome o settore e apri la scheda che ti interessa</p></div></article><article><b>02</b><div><h3>Leggi i numeri chiave</h3><p>Valuta costi margini rischio ROI e tempo di recupero</p></div></article><article><b>03</b><div><h3>Confronta e decidi</h3><p>Metti due opportunità una accanto all’altra e scarica il dossier completo</p></div></article></div>
  </section>

  <section class="home18-section">
   <div class="home18-head"><div><small>ESPLORA PER SETTORE</small><h2>Categorie</h2></div><a href="search.html">Tutte le categorie</a></div>
   <div class="home18-categories">${cats.map(([n,c],i)=>`<a href="search.html?q=${encodeURIComponent(n)}"><i>${categoryIcons(i)}</i><span><b>${esc(n)}</b><small>${c} analisi</small></span><em>→</em></a>`).join('')}</div>
  </section>

  <section class="home18-faq">
   <small>DOMANDE FREQUENTI</small><h2>Tutto quello che serve sapere</h2><p>Risposte chiare prima di acquistare o aprire un’analisi</p>
   <div class="home18-faq-list"><details open><summary>Che cosa include un’analisi BizScan?<span>+</span></summary><p>Una panoramica strutturata di investimento iniziale costi ricavi profitto potenziale rischio ROI tempo di recupero e indicatori disponibili per il livello acquistato</p></details><details><summary>Devo pagare un abbonamento?<span>+</span></summary><p>No I pacchetti prevedono un pagamento unico e le analisi sbloccate restano disponibili nel tuo account</p></details><details><summary>Qual è la differenza tra analisi interattiva e report PDF?<span>+</span></summary><p>L’analisi interattiva serve per esplorare dati e confronti Il PDF è il dossier completo da conservare e consultare offline</p></details><details><summary>Posso confrontare due attività?<span>+</span></summary><p>Sì Puoi confrontare punteggio investimento profitto ROI recupero e rischio</p></details><details><summary>I dati sostituiscono una consulenza professionale?<span>+</span></summary><p>No BizScan è uno strumento informativo Prima di investire verifica dati locali contratti fiscalità autorizzazioni e condizioni specifiche con professionisti qualificati</p></details></div>
  </section>
 </div>`
}
window.runSearch=()=>{const q=$('#homeSearch')?.value||'';location.href='search.html?q='+encodeURIComponent(q)};
function findCurrent(){const slug=new URLSearchParams(location.search).get('slug');return analyses.find(x=>x.slug===slug)||analyses[0]||null}
function scenarioChart(){const groups=[[280,430,650],[18,45,80],[8,20,33]],max=650;return `<div class="scenario-chart">${groups.map((g,gi)=>`<div class="chart-group">${g.map((v,i)=>`<i class="s${i}" style="height:${Math.max(12,v/max*100)}%"></i>`).join('')}<small>${['Fatturato','Utile netto','ROI'][gi]}</small></div>`).join('')}</div>`}
function costLegend(){return `<div class="cost-layout"><div class="cost-donut"><div><small>Totale</small><b>200.000 €</b></div></div><div class="cost-list"><span><i class="c1"></i>Attrezzature <b>38% · 76.000 €</b></span><span><i class="c2"></i>Ristrutturazione <b>22% · 44.000 €</b></span><span><i class="c3"></i>Arredi <b>15% · 30.000 €</b></span><span><i class="c4"></i>Licenze e permessi <b>10% · 20.000 €</b></span><span><i class="c5"></i>Marketing iniziale <b>8% · 16.000 €</b></span><span><i class="c6"></i>Altro <b>7% · 14.000 €</b></span></div></div>`}
function renderAnalysis(){const host=$('#analysisContent');if(!host)return;const p=findCurrent();if(!p){host.innerHTML='<div class="empty"><h1>Analisi non disponibile</h1><p>Non è stato possibile trovare questa analisi. Potrebbe non esistere più oppure i dati non sono ancora disponibili.</p><a class="btn gold" href="search.html">Esplora le analisi</a></div>';return};host.innerHTML=`<div class="analysis-layout"><main class="analysis-main"><div class="analysis-head"><div><h1>${esc(p.title)} <span>★</span></h1><div class="meta"><em>${esc(p.category)}</em><em>Attività locale</em><span>◷ Analisi aggiornata periodicamente</span></div></div><div class="head-actions"><button class="btn ghost${compare.includes(p.slug)?' active':''}" data-compare-slug="${p.slug}" onclick="toggleCompare('${p.slug}')">${compare.includes(p.slug)?'✓ In confronto':'⇄ Confronta'}</button><button class="btn ghost${favorites.includes(p.slug)?' active':''}" data-fav-slug="${p.slug}" onclick="toggleFavorite('${p.slug}')">${favorites.includes(p.slug)?'♥ Salvato':'♡ Salva'}</button></div></div><section class="panel analysis-overview"><div class="analysis-hero"><div class="analysis-summary">${scoreRing(p.score,'large')}<div class="verdict"><small>${esc((p.verdictLabel||'Buona opportunità').toUpperCase())}</small><p>${esc(p.summary)}</p></div></div><div class="hero-image">${image({...p,coverUrl:p.wideCover||p.coverUrl},true)}</div></div><div class="kpi-grid"><div class="kpi"><small>Investimento iniziale</small><b>${esc(p.investment)}</b></div><div class="kpi"><small>Profitto netto/anno</small><b>${esc(p.profit)}</b></div><div class="kpi"><small>ROI medio annuo</small><b>${esc(p.roi||'—')}</b></div><div class="kpi"><small>Tempo di recupero</small><b>${esc(p.payback)}</b></div><div class="kpi"><small>Rischio</small><b class="${riskClass(p)}">● ${esc((p.riskLabel||'—').replace('Rischio ',''))}</b></div></div></section><nav class="tabs" aria-label="Sezioni analisi"><button class="active" data-tab="overview">Panoramica</button><button data-tab="finance">Analisi finanziaria</button><button data-tab="costs">Costi e ricavi</button><button data-tab="market">Mercato</button><button data-tab="risks">Rischi</button><button data-tab="operations">Operatività</button></nav><div id="analysisTabContent">${analysisOverview(p)}</div></main><aside class="panel report-card"><h3>Rapporto completo</h3><div class="report-cover">${image({...p,coverUrl:p.wideCover||p.coverUrl},true)}<div><small>REPORT BIZSCAN</small><strong>${esc(p.title).toUpperCase()}</strong><span>Costi · Profitti · Rischi</span></div></div><small>PDF · Documento completo</small><div class="report-access-note" id="reportAccessNote">Verifica accesso al rapporto…</div><button class="btn gold full" id="downloadReportBtn" onclick="downloadReport('${p.slug}')">Verifica e apri il rapporto</button></aside></div>`;bindTabs();refreshReportAccess(p.slug)}
function analysisOverview(p){
 const d=(p&&p.display)||{};
 const gate=(key,html)=>{
  if(key==='indicators')return html;
  return toolUnlocked(key)?html:`<section class="panel locked-section"><h3>${({scenario:'Scenari di profitto (annuo)',benchmark:'Confronto con la media categoria',distribuzione_costi:'Distribuzione costi iniziali'})[key]}</h3>${lockedCta(key)}</section>`;
 };
 const sc=d.scenario||{},bm=d.benchmark||{},ind=d.indicators||{};
 const DS={prudente:{fatturato:'280K €',utile:'18K €',roi:'8%',recupero:'42 mesi'},realistico:{fatturato:'430K €',utile:'45K €',roi:'20%',recupero:'26 mesi'},ottimistico:{fatturato:'650K €',utile:'80K €',roi:'33%',recupero:'16 mesi'}};
 const S=(k,f)=>esc((sc[k]&&sc[k][f])??DS[k][f]);
 const DB={roi:{a:'20%',m:'18%',mk:'+11%'},margine:{a:'15%',m:'12%',mk:'+25%'},recupero:{a:'24 mesi',m:'30 mesi',mk:'+20%'},rischio:{a:'Medio',m:'Medio-Alto',mk:''}};
 const B=(k,f)=>esc((bm[k]&&bm[k][f])??DB[k][f]);
 const MK=k=>(bm[k]?'':(DB[k].mk?` <mark>${DB[k].mk}</mark>`:''));
 const LV=v=>{const s=String(v||'').toLowerCase();return s.includes('alta')||s.includes('alto')?'risk-low':(s.includes('bass')?'risk-high':'risk-mid')};
 const I=(k,def)=>esc(ind[k]??def);
 const hasCustom=Boolean(d.scenario||d.benchmark||d.indicators);
 const scenarioHtml=`<section class="panel chart-card"><h3>Scenari di profitto (annuo)</h3><div class="scenario-head"><span></span><b>Prudente</b><b>Realistico</b><b>Ottimistico</b><span>Fatturato</span><b>${S('prudente','fatturato')}</b><b>${S('realistico','fatturato')}</b><b>${S('ottimistico','fatturato')}</b><span>Utile netto</span><b>${S('prudente','utile')}</b><b>${S('realistico','utile')}</b><b>${S('ottimistico','utile')}</b><span>ROI</span><b>${S('prudente','roi')}</b><b>${S('realistico','roi')}</b><b>${S('ottimistico','roi')}</b><span>Recupero investimento</span><b>${S('prudente','recupero')}</b><b>${S('realistico','recupero')}</b><b>${S('ottimistico','recupero')}</b></div>${scenarioChart()}</section>`;
 const benchmarkHtml=`<section class="panel benchmark"><h3>Confronto con la media categoria</h3><div class="benchmark-table"><span></span><b>Attività</b><b>Media</b><span>ROI medio</span><b>${B('roi','a')}</b><b>${B('roi','m')}${MK('roi')}</b><span>Margine netto</span><b>${B('margine','a')}</b><b>${B('margine','m')}${MK('margine')}</b><span>Tempo recupero</span><b>${B('recupero','a')}</b><b>${B('recupero','m')}${MK('recupero')}</b><span>Rischio</span><b>${B('rischio','a')}</b><b>${B('rischio','m')}</b></div></section>`;
 const indicatorsHtml=`<section class="panel key-indicators"><h3>Indicatori chiave</h3><div class="indicator-row"><div><i class="green">♢</i><small>Domanda</small><b class="${LV(ind.domanda??'Alta')}">${I('domanda','Alta')}</b></div><div><i>▣</i><small>Concorrenza</small><b class="${LV(ind.concorrenza??'Media')}">${I('concorrenza','Media')}</b></div><div><i>⌁</i><small>Scalabilità</small><b class="${LV(ind.scalabilita??'Media')}">${I('scalabilita','Media')}</b></div><div><i>⌂</i><small>Gestione</small><b class="${LV(ind.gestione??'Media')}">${I('gestione','Media')}</b></div></div></section>`;
 return `${hasCustom?'':'<div class="tools-note">I valori mostrati in questa panoramica sono esempi dimostrativi e non riflettono ancora i dati specifici di questa attività</div>'}<div class="dash-grid">${gate('scenario',scenarioHtml)}${gate('distribuzione_costi',`<section class="panel chart-card"><h3>Distribuzione costi iniziali</h3>${costLegend()}</section>`)}${gate('benchmark',benchmarkHtml)}${gate('indicators',indicatorsHtml)}</div>`}
const TOOL_MIN_PLAN={scenario:'Smart',benchmark:'Smart',break_even:'Smart',distribuzione_costi:'Smart',cash_flow:'Pro',costi_fissi_variabili:'Pro',personale:'Advanced',fornitori:'Advanced',concorrenza_locale:'Business',stagionalita:'Business',matrice_rischi:'Max',strategie_crescita:'Max'};
function toolUnlocked(key){const p=findCurrent();return Array.isArray(p?.unlocked_tool_keys)&&p.unlocked_tool_keys.includes(key)}
function toolBlock(key,title,fallback,realHtml){
 const has=toolUnlocked(key);
 const body=has?(realHtml||`<p>${esc(fallback)}</p>`):`<p>${esc(fallback)}</p>${lockedCta(key)}`;
 return `<section class="panel tab-panel"><h3>${esc(title)}</h3>${body}</section>`;
}
const TOOL_MIN_PLAN_LABEL={scenario:'Starter',break_even:'Starter',benchmark:'Smart',distribuzione_costi:'Smart',cash_flow:'Pro',costi_fissi_variabili:'Pro',personale:'Advanced',fornitori:'Advanced',concorrenza_locale:'Business',stagionalita:'Business',matrice_rischi:'Max',strategie_crescita:'Max'};
const PLAN_BADGE_COLOR={Starter:'#35d49a',Smart:'#5b8cff',Pro:'#ff9d3d',Advanced:'#e05fc9',Business:'#2fd8d8',Max:'#ffb703'};
function lockedCta(toolKey){
 if(!access.authenticated){
  return `<div class="locked-preview"><span>Accedi per sbloccare questo strumento</span><a href="account.html" class="btn purple">Accedi</a></div>`;
 }
 const minPlan=toolKey?TOOL_MIN_PLAN_LABEL[toolKey]:null;
 const userPlan=access.plan||'free';
 const planOrder=['free','single','starter','smart','pro','advanced','business','max'];
 const minPlanKey=toolKey?Object.keys(TOOL_MIN_PLAN_LABEL).includes(toolKey)?
  (['starter','smart','pro','advanced','business','max'][['scenario','break_even','benchmark','distribuzione_costi','cash_flow','costi_fissi_variabili','personale','fornitori','concorrenza_locale','stagionalita','matrice_rischi','strategie_crescita'].indexOf(toolKey)]||'starter')
  :null:null;
 const userPlanIdx=planOrder.indexOf(userPlan);
 const minPlanIdx=planOrder.indexOf(minPlanKey||'free');
 if(minPlanKey&&userPlanIdx<minPlanIdx){
  const color=PLAN_BADGE_COLOR[minPlan]||'#ffb703';
  return `<div class="locked-preview plan-locked"><span class="plan-badge" style="background:${color}22;color:${color};border-color:${color}55">🔒 Richiede piano ${esc(minPlan)}</span><a href="pricing.html" class="btn" style="background:${color};color:#0c1420;font-weight:900">Upgrade a ${esc(minPlan)}</a></div>`;
 }
 const n=access.available_credits??access.credits??0;
 if(n>0){
  return `<div class="locked-preview"><span>Hai ${n} credit${n===1?'o':'i'} disponibil${n===1?'e':'i'}</span><button class="btn gold" type="button" onclick="unlockTool('${esc(toolKey||'')}')">Sblocca con 1 credito</button></div>`;
 }
 return `<div class="locked-preview"><span>Non hai crediti di analisi disponibili</span><a href="pricing.html" class="btn purple">Acquista crediti</a></div>`;
}
window.unlockTool=async(toolKey)=>{
 const p=findCurrent();if(!p?.id)return;
 if(!access.authenticated){modal('Accesso richiesto','<p>Devi accedere al tuo account per sbloccare questo strumento.</p>','<a class="btn gold full" href="account.html">Accedi</a>');return}
 try{
  const c=await BizScanData.getSupabaseClient();
  const{data,error}=await c.rpc('unlock_tool_with_credit',{p_analysis_id:p.id,p_tool_key:toolKey});
  if(error)throw error;
  if(!data?.success){
   if(data?.reason==='no_credits'){modal('Crediti esauriti','<p>Non hai più crediti di analisi disponibili.</p>','<a class="btn gold full" href="pricing.html">Acquista crediti</a>');return}
   if(data?.reason==='plan_too_low'){
    const tool=toolKey?({scenario:'Scenari di profitto',break_even:'Break-even',benchmark:'Confronto categoria',distribuzione_costi:'Distribuzione costi',cash_flow:'Cash-flow 12 mesi',costi_fissi_variabili:'Costi fissi/variabili',personale:'Fabbisogno personale',fornitori:'Fornitori e autorizzazioni',concorrenza_locale:'Concorrenza locale',stagionalita:'Stagionalità',matrice_rischi:'Matrice dei rischi',strategie_crescita:'Strategie di crescita'}[toolKey]||toolKey):'questo strumento';
    const minPlan=TOOL_MIN_PLAN_LABEL[toolKey]||'superiore';
    modal('Piano insufficiente',`<p>Lo strumento <b>${esc(tool)}</b> richiede almeno il piano <b>${esc(minPlan)}</b>.</p>`,'<a class="btn gold full" href="pricing.html">Vedi i pacchetti</a>');return
   }
   toast('Non è stato possibile sbloccare lo strumento');
   return;
  }
  if(!Array.isArray(p.unlocked_tool_keys))p.unlocked_tool_keys=[];
  if(!p.unlocked_tool_keys.includes(toolKey))p.unlocked_tool_keys.push(toolKey);
  if(typeof access.available_credits==='number')access.available_credits=Math.max(0,access.available_credits-1);
  if(typeof access.credits==='number')access.credits=Math.max(0,access.credits-1);
  toast('Strumento sbloccato con successo');
  updateShell();
  const activeTabBtn=document.querySelector('.tabs button.active');
  const content=document.getElementById('analysisTabContent');
  if(activeTabBtn&&content){
   content.innerHTML=activeTabBtn.dataset.tab==='overview'?analysisOverview(p):tabContent(activeTabBtn.dataset.tab);
  }else{
   renderAnalysis();
  }
 }catch(e){
  console.error('unlock error',e);
  toast(e?.message||'Errore, riprova');
 }
};
function tabContent(tab){
 const p=findCurrent();const d=(p&&p.display)||{};const t=d.tools||{};
 if(tab==='finance'){
  return toolBlock('break_even','Break-even mensile','In quale mese esatto l\'attività va in pareggio, calcolato sui costi fissi e sul margine mensile atteso.',t.break_even?`<p>${esc(t.break_even)}</p>`:null)
   + toolBlock('cash_flow','Cash-flow a 12 mesi','Entrate e uscite mese per mese nel primo anno, per capire quando serve liquidità extra.',t.cash_flow?`<p>${esc(t.cash_flow)}</p>`:null);
 }
 if(tab==='costs'){
  return toolBlock('costi_fissi_variabili','Costi fissi e variabili mensili','Cosa paghi comunque ogni mese (affitto, utenze) e cosa dipende invece dalle vendite.',t.costi_fissi_variabili?`<p>${esc(t.costi_fissi_variabili)}</p>`:null);
 }
 if(tab==='market'){
  return toolBlock('concorrenza_locale','Analisi della concorrenza locale','Quanti competitor diretti sono già presenti nella zona e quanto è saturo il mercato.',t.concorrenza_locale?`<p>${esc(t.concorrenza_locale)}</p>`:null)
   + toolBlock('stagionalita','Domanda e stagionalità','Come cambiano le vendite durante l\'anno, con i mesi di picco e di calo.',t.stagionalita?`<p>${esc(t.stagionalita)}</p>`:null);
 }
 if(tab==='risks'){
  return toolBlock('matrice_rischi','Matrice dei rischi','Ogni rischio valutato per probabilità e impatto, con le relative misure di mitigazione.',t.matrice_rischi?`<p>${esc(t.matrice_rischi)}</p>`:null);
 }
 if(tab==='operations'){
  return toolBlock('personale','Fabbisogno di personale','Quante persone servono e con quali ruoli, in base alla dimensione dell\'attività.',t.personale?`<p>${esc(t.personale)}</p>`:null)
   + toolBlock('fornitori','Fornitori e autorizzazioni','Cosa va messo a posto prima di aprire: fornitori chiave, licenze, permessi.',t.fornitori?`<p>${esc(t.fornitori)}</p>`:null)
   + toolBlock('strategie_crescita','Strategie di crescita','Le prime leve concrete per espandersi una volta che l\'attività è avviata.',t.strategie_crescita?`<p>${esc(t.strategie_crescita)}</p>`:null);
 }
 return '';
}
function bindTabs(){const nav=$('.tabs'),content=$('#analysisTabContent');if(!nav||!content)return;nav.querySelectorAll('button').forEach(b=>{const activate=()=>{nav.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');content.innerHTML=b.dataset.tab==='overview'?analysisOverview(findCurrent()):tabContent(b.dataset.tab);b.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})};b.addEventListener('click',activate);b.addEventListener('touchend',e=>{e.preventDefault();activate()},{passive:false})})}
window.refreshReportAccess=async slug=>{
 const p=analyses.find(x=>x.slug===slug),note=document.getElementById('reportAccessNote'),btn=document.getElementById('downloadReportBtn');
 if(!note||!btn)return;
 let pdf=p?.attachments?.find(a=>a.type==='pdf');
 try{
  if(!pdf&&p?.id){const atts=await BizScanData.fetchAttachments(p.id);pdf=atts.find(a=>a.type==='pdf')}
  if(!pdf){note.className='report-access-note locked';note.textContent='Rapporto non disponibile';btn.disabled=true;btn.textContent='Rapporto non disponibile';return}
  const st=await BizScanData.getPdfAccessStatus(pdf.id);
  if(st.allowed){note.className='report-access-note free';note.textContent=st.is_free?'Rapporto gratuito · nessun credito richiesto':'Rapporto già sbloccato · accesso permanente';btn.textContent='Scarica il rapporto'}
  else if(st.reason==='auth_required'){note.className='report-access-note locked';note.textContent='Accedi per verificare il piano e i crediti PDF';btn.textContent='Accedi per continuare'}
  else if(st.reason==='plan_not_allowed'){note.className='report-access-note locked';note.textContent='Il tuo piano non include questo rapporto';btn.textContent='Vedi i pacchetti'}
  else if(st.reason==='no_credits'){note.className='report-access-note locked';note.textContent='Crediti PDF esauriti';btn.textContent='Acquista crediti PDF'}
  else{note.className='report-access-note locked';note.textContent='Rapporto disponibile secondo il piano acquistato';btn.textContent='Sblocca con un credito PDF'}
 }catch(e){note.className='report-access-note locked';note.textContent='Configura le regole PDF in Supabase';btn.textContent='Verifica accesso'}
};
window.downloadReport=async slug=>{
 let p=analyses.find(x=>x.slug===slug),pdf=p?.attachments?.find(a=>a.type==='pdf'),btn=document.getElementById('downloadReportBtn');
 try{
  if(btn){btn.disabled=true;btn.textContent='Verifica accesso…'}
  if(!pdf){const fresh=await BizScanData.fetchAnalysisBySlug(slug);if(fresh){p=fresh;pdf=fresh.attachments?.find(a=>a.type==='pdf')}}
  if(!pdf&&p?.id){const atts=await BizScanData.fetchAttachments(p.id);pdf=atts.find(a=>a.type==='pdf')}
  if(!pdf){modal('Report PDF non disponibile','<p>Il PDF non risulta collegato a questa analisi.</p>');return}
  const result=await BizScanData.requestPdfAccess(pdf.id);
  if(!result.allowed){
    if(result.reason==='auth_required'){location.href='account.html';return}
    if(result.reason==='plan_not_allowed'){modal('Rapporto non incluso','<p>Il piano attivo non consente di sbloccare questo rapporto.</p>','<a class="btn gold full" href="pricing.html">Vedi i pacchetti</a>');return}
    if(result.reason==='no_credits'){modal('Crediti PDF esauriti','<p>Hai già utilizzato tutti i crediti PDF disponibili. I rapporti già sbloccati restano accessibili.</p>','<a class="btn gold full" href="pricing.html">Acquista crediti PDF</a>');return}
    modal('Rapporto bloccato',`<p>${esc(result.message||'Questo rapporto non è disponibile per il tuo account')}</p>`,'<a class="btn gold full" href="pricing.html">Vedi i pacchetti</a>');return
  }
  const url=await BizScanData.signedAttachmentUrl(pdf);window.open(url,'_blank','noopener');
  await refreshReportAccess(slug)
 }catch(e){modal('Impossibile aprire il report',`<p>${esc(e.message||'Controlla la configurazione PDF in Supabase')}</p>`,'<a class="btn gold full" href="account.html">Controlla il mio account</a>')}
 finally{if(btn){btn.disabled=false}}
};

function catalogMatches(p,q,filter){
 const hay=`${p.title||''} ${p.category||''} ${p.summary||''}`.toLowerCase();
 if(q&&!hay.includes(q))return false;
 if(filter==='all')return true;
 return String(p.category||'').toLowerCase()===filter;
}
function renderCatalogResults(){
 const host=$('#catalogResults');if(!host)return;
 const q=($('#searchBox')?.value||'').trim().toLowerCase();
 const arr=analyses.filter(p=>catalogMatches(p,q,catalogFilter));
 const count=$('#catalogCount');if(count)count.textContent=`${arr.length} ${arr.length===1?'analisi disponibile':'analisi disponibili'}`;
 host.innerHTML=arr.map(card).join('')||'<div class="catalog-empty"><strong>Nessuna analisi trovata</strong><span>Prova un altro settore o una parola diversa</span></div>';
}
window.setCatalogFilter=(filter,btn)=>{
 catalogFilter=filter;
 document.querySelectorAll('.catalog-filter').forEach(x=>x.classList.remove('active'));
 if(btn)btn.classList.add('active');
 renderCatalogResults();
};
function toolPreview(type){
 const previews={
  investment:'<div class="tool-kpi"><small>INVESTIMENTO</small><strong>150K–250K €</strong><span>Esempio visivo</span></div>',
  profit:'<div class="tool-kpi"><small>PROFITTO ANNUO</small><strong>45.000 €</strong><span>Esempio visivo</span></div>',
  roi:'<div class="tool-ring" style="--v:63"><b>18,6%</b><small>ROI</small></div>',
  payback:'<div class="tool-kpi"><small>RECUPERO</small><strong>2,8 anni</strong><span>Esempio visivo</span></div>',
  risk:'<div class="tool-risk"><i></i><b>Rischio medio</b><small>2,8 / 5</small></div>',
  score:'<div class="tool-ring green" style="--v:82"><b>82</b><small>/100</small></div>',
  costs:'<div class="tool-donut"><b>Costi</b></div>',
  fixed:'<div class="tool-bars"><i style="height:42%"></i><i style="height:66%"></i><i style="height:52%"></i><i style="height:82%"></i></div>',
  breakeven:'<div class="tool-lines"><i></i><i></i><b>Break-even</b></div>',
  cashflow:'<div class="tool-spark"><svg viewBox="0 0 220 80" aria-hidden="true"><polyline points="5,62 38,50 70,56 104,30 140,20 176,28 215,10" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>',
  scenarios:'<div class="tool-bars"><i style="height:34%"></i><i style="height:50%"></i><i style="height:72%"></i><i style="height:90%"></i></div>',
  stress:'<div class="tool-gauge"><b>Stress test</b></div>',
  market:'<div class="tool-market"><i>Domanda</i><b>Alta</b><i>Concorrenza</i><b>Media</b></div>',
  operations:'<div class="tool-market"><i>Personale</i><b>Medio</b><i>Complessità</i><b>3/5</b></div>',
  compare:'<div class="tool-compare"><span>A</span><b>VS</b><span>B</span></div>',
  pdf:'<div class="tool-pdf"><b>PDF</b><span>Dossier completo</span></div>'
 };
 return previews[type]||previews.investment;
}
function renderToolsCatalog(){
 const host=$('#searchContent');if(!host)return;
 const groups=[
  {k:'NUMERI ESSENZIALI',t:'Capisci subito la dimensione economica',items:[
   ['investment','Investimento iniziale','Capitale necessario per avvio, attrezzature, lavori e riserva'],
   ['profit','Profitto netto annuo','Stima del risultato economico dopo i costi principali'],
   ['roi','ROI medio annuo','Rendimento potenziale del capitale investito'],
   ['payback','Tempo di recupero','Periodo stimato per recuperare l’investimento iniziale'],
   ['risk','Livello di rischio','Valutazione sintetica dei principali fattori di rischio'],
   ['score','BizScan Score','Punteggio complessivo per confrontare opportunità diverse']
  ]},
  {k:'ANALISI FINANZIARIA',t:'Vai oltre i numeri di superficie',items:[
   ['costs','Distribuzione costi iniziali','Ripartizione visiva delle principali voci di investimento'],
   ['fixed','Costi fissi e variabili','Incidenza delle spese ricorrenti e legate alle vendite'],
   ['breakeven','Break-even','Punto in cui ricavi e costi raggiungono l’equilibrio'],
   ['cashflow','Cash-flow mensile','Entrate, uscite e liquidità nei diversi periodi'],
   ['scenarios','Scenari finanziari','Ipotesi prudente, realistica e ottimistica'],
   ['stress','Test di stress','Effetto di vendite inferiori o costi superiori alle attese']
  ]},
  {k:'MERCATO E OPERATIVITÀ',t:'Valuta ciò che può cambiare il risultato',items:[
   ['market','Mercato e concorrenza','Domanda, concorrenza, stagionalità e bacino potenziale'],
   ['operations','Complessità operativa','Personale, processi, fornitori e dipendenza dal proprietario']
  ]},
  {k:'DECISIONE',t:'Trasforma i dati in una scelta più chiara',items:[
   ['compare','Confronto tra attività','Metti due opportunità una accanto all’altra con gli stessi criteri'],
   ['pdf','Report PDF completo','Dossier ordinato da conservare, condividere e consultare offline']
  ]}
 ];
 const total=groups.reduce((n,g)=>n+g.items.length,0);
 host.innerHTML=`<section class="tools-hero"><div><small>STRUMENTI BIZSCAN</small><h1>Tutti gli strumenti per decidere prima di investire</h1><p>Scopri come BizScan trasforma costi, rischio e redditività in indicatori chiari, visivi e confrontabili</p></div><div class="tools-total"><b>${total}</b><span>strumenti mostrati</span></div></section><div class="tools-note">I valori presenti nei preview sono esempi dimostrativi e non appartengono a una singola attività</div>${groups.map(g=>`<section class="tools-section"><div class="tools-head"><small>${g.k}</small><h2>${g.t}</h2></div><div class="tools-grid">${g.items.map(([type,title,desc])=>`<article class="tool-card"><div class="tool-preview">${toolPreview(type)}</div><div class="tool-copy"><h3>${title}</h3><p>${desc}</p><span>Esempio visivo</span></div></article>`).join('')}</div></section>`).join('')}<section class="tools-cta"><div><small>PRONTO A ESPLORARE</small><h2>Vedi questi strumenti applicati a un’attività reale</h2></div><a class="btn gold" href="search.html">Esplora le attività</a></section>`;
}
function renderSearch(){
 const host=$('#searchContent');if(!host)return;
 const params=new URLSearchParams(location.search);
 if(params.get('tools')==='1'){renderToolsCatalog();return}
 const q=(params.get('q')||'').toLowerCase();
 const catParam=(params.get('category')||'all').toLowerCase();
 catalogFilter=catParam;
 const cats=[...new Set(analyses.map(p=>String(p.category||'').trim()).filter(Boolean))];
 const isActive=v=>v===catalogFilter?' active':'';
 host.innerHTML=`<section class="catalog-hero"><div><small>CATALOGO BIZSCAN</small><h1>Tutte le analisi in un unico spazio</h1><p>Esplora le opportunità disponibili e confronta investimento, rischio, profitto e tempi di recupero</p></div><div class="catalog-summary"><b>${analyses.length}</b><span>analisi pubblicate</span></div></section><section class="catalog-toolbar"><div class="catalog-search"><span>⌕</span><input id="searchBox" value="${esc(q)}" placeholder="Cerca per attività o settore" autocomplete="off"><button class="btn gold" type="button" onclick="renderCatalogResults()">Cerca</button></div><div class="catalog-filters"><button class="catalog-filter${isActive('all')}" type="button" onclick="setCatalogFilter('all',this)">Tutte</button>${cats.map(c=>`<button class="catalog-filter${isActive(c.toLowerCase())}" type="button" onclick="setCatalogFilter('${esc(c.toLowerCase())}',this)">${esc(c)}</button>`).join('')}</div><div class="catalog-meta"><span id="catalogCount"></span><small>Aggiornato automaticamente dai dati pubblicati</small></div></section><div id="catalogResults" class="business-grid catalog-grid"></div>`;
 const box=$('#searchBox');
 box?.addEventListener('input',renderCatalogResults);
 box?.addEventListener('keydown',e=>{if(e.key==='Enter')renderCatalogResults()});
 attachSearchSuggestions(box,{onPick:slug=>location.href='analysis.html?slug='+encodeURIComponent(slug)});
 renderCatalogResults();
}
function renderLibrary(){
 const host=$('#libraryContent');if(!host)return;
 const view=(new URLSearchParams(location.search).get('view')||'favorites');
 const isReports=view==='reports';
 const arr=isReports?analyses.filter(p=>p.has_access):analyses.filter(p=>favorites.includes(p.slug));
 const title=isReports?'I miei report':'Preferiti';
 const subtitle=isReports?'Le analisi complete sbloccate nel tuo account':'Le attività che hai salvato per dopo';
 const emptyMsg=isReports?'Non hai ancora sbloccato nessuna analisi completa':'Non hai ancora salvato nessuna attività';
 host.innerHTML=`<section class="page-title"><div class="library-tabs"><a href="library.html?view=favorites" class="${!isReports?'active':''}">Preferiti</a><a href="library.html?view=reports" class="${isReports?'active':''}">I miei report</a></div><h1>${title}</h1><p>${subtitle}</p></section><div class="business-grid search-results">${arr.map(card).join('')||`<div class="empty"><h2>${emptyMsg}</h2><p>Salva un'attività o sblocca un'analisi completa</p><a class="btn gold" href="search.html">Esplora le analisi</a></div>`}</div>`
}
function renderPricing(){
 const host=$('#pricingContent')
 if(!host)return
 const purpose={
  single:'Per conoscere una singola attività',starter:'Per valutare alcune alternative',smart:'Per confrontare con dati più profondi',pro:'Per scegliere con strumenti finanziari completi',advanced:'Per una decisione approfondita',business:'Per analizzare più opportunità in modo professionale',max:'Per utilizzare tutti gli strumenti BizScan'
 }
 const benefits=p=>{
  const items=[`${p.analyses} ${p.analyses===1?'analisi interattiva':'analisi interattive'}`]
  if(p.indicatorCount)items.push(`${p.indicatorCount} ${p.indicatorCount===1?'indicatore premium':'indicatori premium'}`)
  if(p.pdfCredits)items.push(`${p.pdfCredits} ${p.pdfCredits===1?'credito report PDF':'crediti report PDF'}`)
  if(p.compare&&p.compare!=='Base')items.push(`Confronto ${String(p.compare).toLowerCase()}`)
  if(p.key==='single')items.push('Indicatori essenziali')
  if(p.key==='starter')items.push('Libreria personale')
  if(p.key==='business')items.push('Checklist investimento')
  if(p.key==='max')items.push('Tutte le funzioni BizScan')
  return items.slice(0,5)
 }
 const cards=PACKAGES.map(p=>{
  const v=packageValue(p)
  const saving=v.saving>.01
  const classes=['price-card',p.badge?'has-badge':'',p.key==='pro'?'is-pro':'',p.key==='advanced'?'is-advanced':'',p.key==='max'?'is-max':''].filter(Boolean).join(' ')
  return `<article class="${classes}" data-plan="${p.key}">
   ${p.badge?`<span class="price-badge">${p.badge}</span>`:''}
   <div class="price-card-head"><div><small>${p.key==='single'?'ACCESSO SINGOLO':'PAGAMENTO UNICO'}</small><h3>${p.name}</h3></div><div class="price-amount">${euro(p.price)}</div></div>
   <p class="price-purpose">${purpose[p.key]}</p>
   <ul class="price-benefits">${benefits(p).map(x=>`<li>${x}</li>`).join('')}</ul>
   ${saving?`<div class="price-proof"><span><small>Valore acquistato separatamente</small><del>${euro(v.total)}</del></span><span><small>Risparmio incluso</small><strong>${euro(v.saving)}</strong></span></div>`:'<div class="price-proof"><span><small>Prezzo diretto</small><strong>'+euro(p.price)+'</strong></span></div>'}
   <button class="btn ${p.key==='max'?'purple':'gold'} full" onclick="choosePackage('${p.key}')">Scegli ${p.name}</button>
  </article>`
 }).join('')
 host.innerHTML=`<div class="pricing-page">
  <section class="pricing-hero-clean"><small>PAGAMENTO UNICO · NESSUN ABBONAMENTO</small><h1>Scegli il livello di analisi più adatto alla tua decisione</h1><p>Tutti i pacchetti mostrano chiaramente analisi strumenti premium report PDF e risparmio incluso</p><div class="pricing-promises"><span>Analisi sbloccate senza scadenza</span><span>Crediti conservati nel conto</span><span>Upgrade possibile in seguito</span></div></section>
  <div class="pricing-grid">${cards}</div>
  ${packageComparison()}
  <section class="pricing-section"><div class="value-explainer"><div><small>COME È FORMATO IL VALORE</small><h2>Ogni componente ha un prezzo individuale</h2><p>Il valore separato somma soltanto prodotti acquistabili singolarmente nella pagina BizScan</p></div><div class="value-units"><span><b>${euro(UNIT_PRICES.analysis)}</b><em>Analisi interattiva</em></span><span><b>${euro(UNIT_PRICES.indicator)}</b><em>Indicatore premium</em></span><span><b>${euro(UNIT_PRICES.pdf)}</b><em>Report PDF completo</em></span><span><b>${euro(UNIT_PRICES.comparison)}</b><em>Confronto avanzato</em></span></div></div></section>
  ${pdfTopups()}
 </div>`
}
function packageComparison(){return `<section class="pricing-section package-comparison"><div class="pricing-section-head"><small>CONFRONTO COMPLETO</small><h2>Confronta tutti i pacchetti</h2><p>Le funzioni aumentano progressivamente senza ripetizioni</p></div><div class="package-table-wrap"><table class="package-table"><thead><tr><th>Incluso</th>${PACKAGES.map(p=>`<th>${p.name}</th>`).join('')}</tr></thead><tbody><tr><th>Analisi interattive</th>${PACKAGES.map(p=>`<td>${p.analyses}</td>`).join('')}</tr><tr><th>Indicatori premium</th>${PACKAGES.map(p=>`<td>${p.indicatorCount||'—'}</td>`).join('')}</tr><tr><th>Crediti report PDF</th>${PACKAGES.map(p=>`<td>${p.pdfCredits||'—'}</td>`).join('')}</tr><tr><th>Confronto</th>${PACKAGES.map(p=>`<td>${p.compare}</td>`).join('')}</tr><tr><th>Accesso alle analisi sbloccate</th>${PACKAGES.map(()=>'<td class="best">Permanente</td>').join('')}</tr></tbody></table></div></section>`}
function standaloneProducts(){const items=[{icon:'▣',title:'Analisi interattiva',text:'Apri una singola attività nella piattaforma',price:UNIT_PRICES.analysis,action:"chooseAddon('analysis')"},{icon:'◎',title:'Indicatore premium',text:'Sblocca un indicatore avanzato su un’analisi scelta',price:UNIT_PRICES.indicator,action:"chooseAddon('indicator')"},{icon:'PDF',title:'Report PDF completo',text:'Scarica il dossier approfondito di un’attività',price:UNIT_PRICES.pdf,action:"chooseAddon('pdf')"},{icon:'⇄',title:'Confronto avanzato',text:'Confronta due attività con metriche complete',price:UNIT_PRICES.comparison,action:"chooseAddon('comparison')"}];return `<section class="standalone-products section"><div class="section-head"><div><small>ACQUISTA SOLO CIÒ CHE TI SERVE</small><h2>Prezzi singoli trasparenti</h2><p>Questi prezzi formano il valore separato mostrato nei pacchetti</p></div></div><div class="standalone-grid">${items.map(x=>`<article class="panel standalone-card"><i>${x.icon}</i><div><h3>${x.title}</h3><p>${x.text}</p></div><strong>${euro(x.price)}</strong><button class="btn ghost full" onclick="${x.action}">Acquista singolarmente</button></article>`).join('')}</div></section>`}
window.chooseAddon=async type=>{
 const map={analysis:['Analisi interattiva',UNIT_PRICES.analysis],indicator:['Indicatore premium',UNIT_PRICES.indicator],pdf:['Report PDF completo',UNIT_PRICES.pdf],comparison:['Confronto avanzato',UNIT_PRICES.comparison]};
 const item=map[type];if(!item)return;
 if(type==='indicator'||type==='comparison'){
  modal(item[0],`<p>Prezzo singolo <strong>${euro(item[1])}</strong></p><p>Questo prodotto non è ancora disponibile singolarmente. Nel frattempo puoi trovarlo incluso nei pacchetti.</p>`,'<a class="btn gold full" href="pricing.html">Vedi i pacchetti</a>');
  return;
 }
 if(!access.authenticated){modal(item[0],'<p>Devi accedere al tuo account per acquistare.</p>','<a class="btn gold full" href="account.html">Accedi o registrati</a>');return}
 modal(item[0],`<p>Prezzo singolo <strong>${euro(item[1])}</strong></p><p>Stiamo aprendo il pagamento sicuro con Stripe…</p>`,'');
 try{
  const c=await BizScanData.getSupabaseClient();
  let{data:sessionData}=await c.auth.getSession();
  let session=sessionData?.session;
  if(!session?.access_token){
   try{const r=await c.auth.refreshSession();session=r?.data?.session}catch(_){}
  }
  if(!session?.access_token){
   modal(item[0],'<p>La tua sessione è scaduta. Accedi di nuovo e riprova.</p>','<a class="btn gold full" href="account.html">Accedi</a>');
   return;
  }
  const res=await fetch('https://fafedftoyztptdiubjmx.supabase.co/functions/v1/create-checkout-session',{
   method:'POST',
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
   body:JSON.stringify({item_type:type})
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok||!data.url){
   modal(item[0],`<p>Non è stato possibile aprire il pagamento.</p><p style="color:#8d99aa;font-size:11px">Codice: ${esc(data.error||res.status)}${data.detail?'<br>'+esc(data.detail):''}</p>`,'<button class="btn ghost full" onclick="closeModal()">Chiudi</button>');
   return;
  }
  location.href=data.url;
 }catch(e){
  console.error('checkout error',e);
  modal(item[0],`<p>Non è stato possibile aprire il pagamento.</p><p style="color:#8d99aa;font-size:11px">${esc(e?.message||'Errore sconosciuto')}</p>`,'<button class="btn ghost full" onclick="closeModal()">Chiudi</button>');
 }
};
function pdfTopups(){const packs=[{n:1,p:1.99},{n:3,p:4.99},{n:5,p:6.99},{n:10,p:11.99}];return `<section class="pdf-topups section"><div class="section-head"><div><small class="pdf-topup-kicker"><i>📄</i>REPORT COMPLETI</small><h2>Crediti PDF aggiuntivi</h2><p>Scarica il dossier completo solo per le attività che vuoi valutare seriamente</p></div></div><div class="pdf-credit-grid">${packs.map(x=>`<article class="panel pdf-credit-card"><b>${x.n}</b><span>${x.n===1?'report PDF':'report PDF'}</span><strong>${euro(x.p)}</strong><button class="btn ghost full" onclick="choosePdfPack(${x.n},${x.p})">Aggiungi crediti PDF</button></article>`).join('')}</div></section>`}
window.choosePdfPack=async(count,price)=>{
 if(!access.authenticated){modal('Crediti PDF','<p>Devi accedere al tuo account per acquistare.</p>','<a class="btn gold full" href="account.html">Accedi o registrati</a>');return}
 modal('Crediti PDF',`<p>${count} ${count===1?'credito':'crediti'} report PDF per <b>${euro(price)}</b></p><p>Stiamo aprendo il pagamento sicuro con Stripe…</p>`,'');
 try{
  const c=await BizScanData.getSupabaseClient();
  let{data:sessionData}=await c.auth.getSession();
  let session=sessionData?.session;
  if(!session?.access_token){
   try{const r=await c.auth.refreshSession();session=r?.data?.session}catch(_){}
  }
  if(!session?.access_token){
   modal('Crediti PDF','<p>La tua sessione è scaduta. Accedi di nuovo e riprova.</p>','<a class="btn gold full" href="account.html">Accedi</a>');
   return;
  }
  const res=await fetch('https://fafedftoyztptdiubjmx.supabase.co/functions/v1/create-checkout-session',{
   method:'POST',
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
   body:JSON.stringify({pdf_pack_count:count})
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok||!data.url){
   modal('Crediti PDF',`<p>Non è stato possibile aprire il pagamento.</p><p style="color:#8d99aa;font-size:11px">Codice: ${esc(data.error||res.status)}${data.detail?'<br>'+esc(data.detail):''}</p>`,'<button class="btn ghost full" onclick="closeModal()">Chiudi</button>');
   return;
  }
  location.href=data.url;
 }catch(e){
  console.error('checkout error',e);
  modal('Crediti PDF',`<p>Non è stato possibile aprire il pagamento.</p><p style="color:#8d99aa;font-size:11px">${esc(e?.message||'Errore sconosciuto')}</p>`,'<button class="btn ghost full" onclick="closeModal()">Chiudi</button>');
 }
};
window.choosePackage=async key=>{
 const p=PACKAGES.find(x=>x.key===key);if(!p)return;
 if(!access.authenticated){modal(p.name,'<p>Devi accedere al tuo account per acquistare un pacchetto.</p>','<a class="btn gold full" href="account.html?next='+encodeURIComponent(location.pathname+location.search)+'">Accedi o registrati</a>');return}
 modal(p.name,`<p>Il pacchetto selezionato costa <b>${euro(p.price)}</b></p><p>Stiamo aprendo il pagamento sicuro con Stripe…</p>`,'');
 try{
  const c=await BizScanData.getSupabaseClient();
  let{data:sessionData}=await c.auth.getSession();
  let session=sessionData?.session;
  if(!session?.access_token){
   try{const r=await c.auth.refreshSession();session=r?.data?.session}catch(_){}
  }
  if(!session?.access_token){
   modal(p.name,'<p>La tua sessione è scaduta. Accedi di nuovo e riprova.</p>','<a class="btn gold full" href="account.html?next='+encodeURIComponent('pricing.html')+'">Accedi</a>');
   return;
  }
  const res=await fetch('https://fafedftoyztptdiubjmx.supabase.co/functions/v1/create-checkout-session',{
   method:'POST',
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
   body:JSON.stringify({plan_type:key})
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok||!data.url){
   modal(p.name,`<p>Non è stato possibile aprire il pagamento.</p><p style="color:#8d99aa;font-size:11px">Codice: ${esc(data.error||res.status)}${data.detail?'<br>'+esc(data.detail):''}</p>`,'<button class="btn ghost full" onclick="closeModal()">Chiudi</button>');
   return;
  }
  location.href=data.url;
 }catch(e){
  console.error('checkout error',e);
  modal(p.name,`<p>Non è stato possibile aprire il pagamento.</p><p style="color:#8d99aa;font-size:11px">${esc(e?.message||'Errore sconosciuto')}</p>`,'<button class="btn ghost full" onclick="closeModal()">Chiudi</button>');
 }
};
function renderCompare(){const host=$('#compareContent');if(!host)return;const arr=compare.map(s=>analyses.find(p=>p.slug===s)).filter(Boolean);if(arr.length!==2){host.innerHTML=`<div class="empty"><h1>Confronta due attività</h1><p>Usa il simbolo ⇄ sulle card per selezionare due analisi</p><a class="btn gold" href="search.html">Esplora le analisi</a></div>`;return}host.innerHTML=`<section class="page-title"><h1>Confronto attività</h1><p>Decisione basata sugli stessi indicatori e sulle stesse fonti</p></section><div class="compare-cards">${arr.map(card).join('')}</div><section class="panel comparison-full"><div class="comparison-table"><b>Indicatore</b><b>${esc(arr[0].title)}</b><b>${esc(arr[1].title)}</b><span>BizScan Score</span><b>${arr[0].score}</b><b>${arr[1].score}</b><span>Investimento</span><b>${esc(arr[0].investment)}</b><b>${esc(arr[1].investment)}</b><span>Profitto</span><b>${esc(arr[0].profit)}</b><b>${esc(arr[1].profit)}</b><span>ROI</span><b>${esc(arr[0].roi||'—')}</b><b>${esc(arr[1].roi||'—')}</b><span>Recupero</span><b>${esc(arr[0].payback)}</b><b>${esc(arr[1].payback)}</b><span>Rischio</span><b>${esc(arr[0].riskLabel)}</b><b>${esc(arr[1].riskLabel)}</b></div></section>`}
function renderRoute(){renderHome();renderAnalysis();renderSearch();renderLibrary();renderPricing();renderCompare()}
function searchSuggestions(query,limit=6){
 const q=String(query||'').trim().toLowerCase();
 if(q.length<2)return[];
 const scored=[];
 for(const p of analyses){
  const title=String(p.title||'').toLowerCase();
  const cat=String(p.category||'').toLowerCase();
  const tags=(Array.isArray(p.tags)?p.tags:[]).map(t=>String(t).toLowerCase());
  let score=0;
  if(title===q)score=100;
  else if(title.startsWith(q))score=80;
  else if(title.includes(q))score=60;
  else if(tags.some(t=>t===q))score=50;
  else if(tags.some(t=>t.includes(q)))score=35;
  else if(cat.includes(q))score=20;
  if(score>0)scored.push({p,score});
 }
 scored.sort((a,b)=>b.score-a.score||(a.p.title||'').localeCompare(b.p.title||''));
 return scored.slice(0,limit).map(x=>x.p);
}
function attachSearchSuggestions(input,{onPick}={}){
 if(!input||input.__bizscanSuggest)return;
 input.__bizscanSuggest=true;
 const box=document.createElement('div');box.className='search-suggest';box.hidden=true;
 (input.closest('.top-search,.home18-search,.catalog-search')||input.parentElement).appendChild(box);
 let debounce;
 const render=()=>{
  const items=searchSuggestions(input.value);
  if(!items.length){box.hidden=true;box.innerHTML='';return}
  box.innerHTML=items.map(p=>`<a href="analysis.html?slug=${encodeURIComponent(p.slug)}" data-slug="${esc(p.slug)}"><span class="ss-emoji">${esc(p.categoryEmoji||p.emoji||'📊')}</span><span class="ss-text"><b>${esc(p.title)}</b><small>${esc(p.category||'')}</small></span></a>`).join('');
  box.hidden=false;
  box.querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{if(onPick){e.preventDefault();onPick(a.dataset.slug)}}));
 };
 input.addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(render,120)});
 input.addEventListener('focus',render);
 input.addEventListener('blur',()=>setTimeout(()=>{box.hidden=true},150));
}
function bindShellEvents(){
 const topInput=$('.top-search input')
 if(topInput){
  topInput.addEventListener('keydown',e=>{if(e.key==='Enter'){const q=topInput.value.trim();location.href='search.html?q='+encodeURIComponent(q)}})
  attachSearchSuggestions(topInput)
 }
 const homeInput=$('#homeSearch')
 if(homeInput){homeInput.addEventListener('keydown',e=>{if(e.key==='Enter')runSearch()});attachSearchSuggestions(homeInput)}
}
function celebrateCheckoutSuccess(planName){
 const colors=['#ffb703','#ff8a00','#2dd4a7','#3a86ff','#8357ff','#ffd053'];
 const box=document.createElement('div');
 box.className='confetti-box';
 const shapes=['c-rect','c-square','c-star','c-dot','c-spiral','c-star-sm'];
 for(let i=0;i<70;i++){
  const p=document.createElement('i');
  p.className=shapes[i%shapes.length];
  const col=colors[i%colors.length];
  p.style.left=(Math.random()*100)+'%';
  p.style.setProperty('--cc',col);
  p.style.animationDelay=(Math.random()*0.6)+'s';
  p.style.animationDuration=(2.4+Math.random()*1.6)+'s';
  p.style.transform=`rotate(${Math.floor(Math.random()*360)}deg)`;
  box.appendChild(p);
 }
 document.body.appendChild(box);
 const card=document.createElement('div');
 card.className='celebrate-card';
 card.innerHTML=`<div class="celebrate-emoji">🎉</div><h3>Congratulazioni!</h3><p>Il tuo pagamento${planName?' per il pacchetto <b>'+esc(planName)+'</b> di BizScan':''} è andato a buon fine.</p>`;
 document.body.appendChild(card);
 requestAnimationFrame(()=>card.classList.add('show'));
 setTimeout(()=>{card.classList.remove('show');card.classList.add('hide')},3600);
 setTimeout(()=>{card.remove();box.remove()},4300);
}
document.addEventListener('DOMContentLoaded',async()=>{
 await load();renderRoute();bindShellEvents();window.__bizscanSetupFooter?.();
 window.__pageLoadingDone?.();
 const params=new URLSearchParams(location.search);
 if(params.get('checkout')==='success'){
  celebrateCheckoutSuccess(params.get('plan'));
  history.replaceState(null,'',location.pathname);
 }
});
