const DEMO=[]; // Production-safe: never display local demo products
const PACKAGES=[
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
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const euro=n=>Number(n).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
function riskClass(p){return Number(p.risk)<45?'risk-low':Number(p.risk)<70?'risk-mid':'risk-high'}
function mediaFor(p){return p.coverUrl||p.wideCover||''}
function image(p,wide=false){const src=wide?(p.wideCover||p.coverUrl):p.coverUrl;return src?`<img src="${esc(src)}" alt="${esc(p.title)}">`:`<div class="visual-placeholder">${p.categoryEmoji||p.emoji||'📊'}</div>`}
let dataLoadError=null;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function load(){
 dataLoadError=null;analyses=[];
 let lastError=null;
 for(let attempt=1;attempt<=3;attempt++){
  try{analyses=await BizScanData.fetchPublishedAnalyses();lastError=null;break}
  catch(e){lastError=e;console.warn(`BizScan load ${attempt}/3`,e);if(attempt<3)await wait(attempt*500)}
 }
 if(lastError){dataLoadError=lastError;analyses=[];console.error('BizScan failed closed: no demo products shown',lastError)}
 favorites=JSON.parse(localStorage.getItem('bizscan_favorites')||'[]');compare=JSON.parse(localStorage.getItem('bizscan_compare')||'[]');
 const valid=new Set(analyses.map(x=>x.slug));favorites=favorites.filter(x=>valid.has(x));compare=compare.filter(x=>valid.has(x)).slice(0,2);
 localStorage.setItem('bizscan_favorites',JSON.stringify(favorites));localStorage.setItem('bizscan_compare',JSON.stringify(compare));
 try{access=await BizScanData.accessSummary()}catch(e){access={authenticated:false,credits:0}}
 updateShell();
}
function updateShell(){const c=$('.top-actions .chip');if(c)c.textContent=`Crediti: ${access.credits||0}`}
function toast(t){let e=$('#toast');if(!e){e=document.createElement('div');e.id='toast';e.className='toast';document.body.append(e)}e.textContent=t;e.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>e.classList.remove('show'),1700)}
function modal(title,body,actions=''){const m=$('#globalModal'),c=$('#globalModalContent');if(!m||!c)return;c.innerHTML=`<div class="modal-head"><h2>${esc(title)}</h2><button onclick="closeModal()">×</button></div>${body}${actions}`;m.classList.add('show')}
window.closeModal=()=>$('#globalModal')?.classList.remove('show');
window.toggleFavorite=async slug=>{const p=analyses.find(x=>x.slug===slug);const enabling=!favorites.includes(slug);favorites=enabling?[...favorites,slug]:favorites.filter(x=>x!==slug);localStorage.setItem('bizscan_favorites',JSON.stringify(favorites));if(access.authenticated&&p?.id){try{await BizScanData.setFavorite(p.id,enabling)}catch(e){console.warn(e)}}toast(enabling?'Aggiunta ai preferiti':'Rimossa dai preferiti');renderRoute()};
window.toggleCompare=slug=>{compare=compare.includes(slug)?compare.filter(x=>x!==slug):compare.length<2?[...compare,slug]:[compare[1],slug];localStorage.setItem('bizscan_compare',JSON.stringify(compare));toast(compare.length===2?'Confronto pronto':'Aggiunta al confronto');renderRoute()};
function categories(){const m={};analyses.forEach(p=>{const k=String(p.category||'').trim();if(!k)return;m[k]=(m[k]||0)+1});return Object.entries(m)}
function scoreRing(value,size='normal'){return `<div class="score-ring ${size}" style="--v:${Number(value)||0}"><div><b>${Number(value)||0}</b><small>/100</small></div></div>`}
function card(p){const url=`analysis.html?slug=${encodeURIComponent(p.slug)}`;return `<article class="business-card"><div class="business-cover business-cover-link" role="link" tabindex="0" aria-label="Apri ${esc(p.title)}" onclick="location.href='${url}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();location.href='${url}'}">${image(p)}<div class="card-tools"><button aria-label="Confronta" onclick="event.preventDefault();event.stopPropagation();toggleCompare('${p.slug}')">⇄</button><button aria-label="Salva" onclick="event.preventDefault();event.stopPropagation();toggleFavorite('${p.slug}')">${favorites.includes(p.slug)?'♥':'♡'}</button></div></div><a href="${url}" class="business-body"><div class="business-title-row"><div><h3>${esc(p.title)}</h3><div class="category">${esc(p.category||'Business')}</div></div><span class="card-open-arrow">→</span></div><div class="card-metrics">${scoreRing(p.score,'small')}<div class="metric-list"><span><em>Investimento</em><b>${esc(p.investment||'—')}</b></span><span><em>Profitto annuo</em><b>${esc(p.profit||'—')}</b></span><span><em>Rischio</em><b class="${riskClass(p)}">${esc((p.riskLabel||'—').replace('Rischio ',''))}</b></span></div></div></a></article>`}
function categoryIcons(i){return ['☕','🧰','🛍','▣','♨','⚙','▤','⌂'][i]||'◇'}
function sparkline(vals,color='purple'){const w=250,h=85,pad=8,max=Math.max(...vals),min=Math.min(...vals),pts=vals.map((v,i)=>`${pad+i*(w-pad*2)/(vals.length-1)},${h-pad-(v-min)/(max-min||1)*(h-pad*2)}`).join(' ');return `<svg viewBox="0 0 ${w} ${h}" class="sparkline ${color}" role="img"><polyline points="${pts}" fill="none" vector-effect="non-scaling-stroke"/></svg>`}
function homeInsights(){return `<div class="insight-grid"><section class="panel insight"><h3>Investimenti medi</h3><small>per categoria</small><div class="bar-list"><div class="bar-row"><span>Ristorazione</span><div class="track"><i style="width:88%"></i></div><b>185K €</b></div><div class="bar-row"><span>Servizi</span><div class="track"><i style="width:63%"></i></div><b>120K €</b></div><div class="bar-row"><span>Retail</span><div class="track"><i style="width:50%"></i></div><b>95K €</b></div><div class="bar-row"><span>Online</span><div class="track"><i style="width:38%"></i></div><b>70K €</b></div></div></section><section class="panel insight"><h3>Rischio medio</h3><small>per categoria</small><div class="risk-donut"><div><b>2,8</b><small>/5</small></div></div><div class="legend"><span><i class="g"></i>Basso 32%</span><span><i class="y"></i>Medio 48%</span><span><i class="r"></i>Alto 20%</span></div></section><section class="panel insight"><h3>ROI medio annuo</h3><small>per categoria</small><strong>18,6%</strong><mark>+2,4% vs mese scorso</mark>${sparkline([15,16,15.5,17,17.8,18.2,19,18.6])}</section><section class="panel insight"><h3>Tempo medio di recupero</h3><small>per categoria</small><strong>2,8 anni</strong><mark>-0,3 anni vs mese scorso</mark>${sparkline([3.6,3.1,2.9,3.0,2.7,2.9,2.8,3.0],'cyan')}</section></div>`}
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

function displayDefaults(p={}){
 const investment=String(p.investment||'—'),profit=String(p.profit||'—'),payback=String(p.payback||'—');
 return {
  dashboard:{profit_score:74,roi_score:63,payback_score:44,chart:[34,48,57,72,88,78]},
  scenarios:{revenue:[investment,investment,investment],net_profit:[profit,profit,profit],roi:['—','—','—'],payback:[payback,payback,payback]},
  costs:{total:investment,items:[
   {label:'Attrezzature',percent:'—',amount:'—'},{label:'Ristrutturazione',percent:'—',amount:'—'},{label:'Arredi',percent:'—',amount:'—'},
   {label:'Licenze e permessi',percent:'—',amount:'—'},{label:'Marketing iniziale',percent:'—',amount:'—'},{label:'Altro',percent:'—',amount:'—'}]},
  benchmark:[
   {label:'ROI medio',activity:'—',average:'—',delta:''},{label:'Margine netto',activity:'—',average:'—',delta:''},
   {label:'Tempo recupero',activity:payback,average:'—',delta:''},{label:'Rischio',activity:String((p.riskLabel||'—').replace('Rischio ','')),average:'—',delta:''}],
  indicators:[
   {label:'Domanda',value:'—',tone:'mid',icon:'♢'},{label:'Concorrenza',value:'—',tone:'mid',icon:'▣'},
   {label:'Scalabilità',value:'—',tone:'mid',icon:'⌁'},{label:'Gestione',value:'—',tone:'mid',icon:'⌂'}]
 }
}
function displayFor(p){
 const d=displayDefaults(p),x=p?.displayData||{};
 return {dashboard:{...d.dashboard,...(x.dashboard||{})},scenarios:{...d.scenarios,...(x.scenarios||{})},costs:{...d.costs,...(x.costs||{})},benchmark:Array.isArray(x.benchmark)&&x.benchmark.length?x.benchmark:d.benchmark,indicators:Array.isArray(x.indicators)&&x.indicators.length?x.indicators:d.indicators}
}
function openCategoriesModal(){
 const cats=categories();
 if(!cats.length){modal('Categorie','<p>Non ci sono ancora categorie con analisi pubblicate.</p>');return}
 const body=`<div class="category-modal-grid">${cats.map(([name,count],i)=>`<a href="search.html?category=${encodeURIComponent(name.toLowerCase())}"><i>${categoryIcons(i)}</i><span><b>${esc(name)}</b><small>${count} ${count===1?'analisi':'analisi'}</small></span><em>→</em></a>`).join('')}</div>`;
 modal('Tutte le categorie',body)
}
window.openCategoriesModal=openCategoriesModal;
function renderHome(){
 const host=$('#homeContent');if(!host)return
 if(dataLoadError){host.innerHTML='<section class="data-state-panel"><h1>Dati temporaneamente non disponibili</h1><p>Per sicurezza BizScan non mostra prodotti dimostrativi. Riprova tra qualche secondo.</p><button class="btn gold" onclick="location.reload()">Riprova</button></section>';return}
 if(!analyses.length){host.innerHTML='<section class="data-state-panel"><h1>Nessuna analisi pubblicata</h1><p>Le analisi appariranno qui appena saranno pubblicate.</p></section>';return}
 const allFeatured=analyses.slice(0,12)
 const featured=filterHomeAnalyses(allFeatured,homeFilter).slice(0,6)
 const lead=featured[0]||allFeatured[0]||null
 const second=featured[1]||allFeatured.find(x=>x.slug!==lead?.slug)||lead
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
   <div class="home18-head"><div><small>DASHBOARD</small><h2>Panoramica BizScan</h2></div><a href="search.html?tools=1">Esplora gli strumenti BizScan</a></div>
   <div class="home18-dashboard">
    <article class="home18-score-card">
     <div class="home18-score-top">${scoreRing(lead.score,'large')}<div><small>BIZSCAN SCORE</small><h3>${esc(lead.verdictLabel||'Opportunità forte')}</h3><p>${esc(lead.summary||'Buon equilibrio tra capitale rischio e recupero')}</p></div></div>
     <div class="home18-bars">
      <div><span>Rischio</span><i><b class="risk" style="width:${Math.min(100,Number(lead.risk)||52)}%"></b></i><strong>${Number(lead.risk)||52}</strong></div>
      <div><span>Profitto</span><i><b class="profit" style="width:${Math.min(100,Number(displayFor(lead).dashboard.profit_score)||0)}%"></b></i><strong>${Number(displayFor(lead).dashboard.profit_score)||0}</strong></div>
      <div><span>ROI</span><i><b class="roi" style="width:${Math.min(100,Number(displayFor(lead).dashboard.roi_score)||0)}%"></b></i><strong>${Number(displayFor(lead).dashboard.roi_score)||0}</strong></div>
      <div><span>Rientro</span><i><b class="payback" style="width:${Math.min(100,Number(displayFor(lead).dashboard.payback_score)||0)}%"></b></i><strong>${Number(displayFor(lead).dashboard.payback_score)||0}</strong></div>
     </div>
    </article>
    <article class="home18-chart-card"><small>SCENARI DI PROFITTO</small><div class="home18-bars-chart">${displayFor(lead).dashboard.chart.map(v=>`<i style="height:${Math.max(8,Math.min(100,Number(v)||0))}%"></i>`).join('')}</div><div class="home18-chart-labels"><span>Prudente</span><span>Realistico</span><span>Ottimistico</span></div></article>
   </div>
  </section>

  <section class="home18-section">
   <div class="home18-head"><div><small>CONFRONTO</small><h2>Decisione immediata</h2></div><button class="link-button" type="button" onclick="openImmediateCompare('${lead.slug}','${second.slug}')">Apri confronto</button></div>
   <div class="home18-compare">${[lead,second].filter(Boolean).map(p=>`<article class="home18-compare-card" role="link" tabindex="0" aria-label="Apri analisi ${esc(p.title)}" onclick="openHomeAnalysis('${esc(p.slug)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openHomeAnalysis('${esc(p.slug)}')}"><h3>${esc(p.title)}</h3><div><span>Score</span><b>${Number(p.score)||0}/100</b></div><div><span>Rischio</span><b>${esc((p.riskLabel||'—').replace('Rischio ',''))}</b></div><div><span>Rientro</span><b>${esc(p.payback||'—')}</b></div><div><span>Vantaggio</span><b class="home18-winner">${esc(p.verdictLabel||'Da valutare')}</b></div><span class="home18-card-open">Apri analisi →</span></article>`).join('')}</div>
  </section>

  <section class="home18-locked">
   <div class="home18-locked-content"><small>PREMIUM</small><h2>Dati che cambiano la decisione</h2><div class="home18-blur-chart"><i style="height:42%"></i><i style="height:69%"></i><i style="height:55%"></i><i style="height:86%"></i><i style="height:64%"></i></div></div>
   <a href="pricing.html">Scopri i dati premium con BizScan Plus</a>
  </section>

  <section class="home18-how">
   <div class="home18-how-copy"><small>COME FUNZIONA</small><h2>Dalla curiosità a una decisione più consapevole</h2><p>Un percorso semplice che riduce il rumore e porta subito ai numeri che contano</p><a href="pricing.html">Vedi i pacchetti</a></div>
   <div class="home18-steps"><article><b>01</b><div><h3>Scegli l’attività</h3><p>Cerca per nome o settore e apri la scheda che ti interessa</p></div></article><article><b>02</b><div><h3>Leggi i numeri chiave</h3><p>Valuta costi margini rischio ROI e tempo di recupero</p></div></article><article><b>03</b><div><h3>Confronta e decidi</h3><p>Metti due opportunità una accanto all’altra e scarica il dossier completo</p></div></article></div>
  </section>

  <section class="home18-section">
   <div class="home18-head"><div><small>ESPLORA PER SETTORE</small><h2>Trova il business più vicino ai tuoi obiettivi</h2></div><button class="link-button" type="button" onclick="openCategoriesModal()">Tutte le categorie</button></div>
   <div class="home18-categories">${cats.map(([n,c],i)=>`<a href="search.html?category=${encodeURIComponent(n.toLowerCase())}"><i>${categoryIcons(i)}</i><span><b>${esc(n)}</b><small>${c} analisi</small></span><em>→</em></a>`).join('')}</div>
  </section>

  <section class="home18-faq">
   <small>DOMANDE FREQUENTI</small><h2>Tutto quello che serve sapere</h2><p>Risposte chiare prima di acquistare o aprire un’analisi</p>
   <div class="home18-faq-list"><details open><summary>Che cosa include un’analisi BizScan?<span>+</span></summary><p>Una panoramica strutturata di investimento iniziale costi ricavi profitto potenziale rischio ROI tempo di recupero e indicatori disponibili per il livello acquistato</p></details><details><summary>Devo pagare un abbonamento?<span>+</span></summary><p>No I pacchetti prevedono un pagamento unico e le analisi sbloccate restano disponibili nel tuo account</p></details><details><summary>Qual è la differenza tra analisi interattiva e report PDF?<span>+</span></summary><p>L’analisi interattiva serve per esplorare dati e confronti Il PDF è il dossier completo da conservare e consultare offline</p></details><details><summary>Posso confrontare due attività?<span>+</span></summary><p>Sì Puoi confrontare punteggio investimento profitto ROI recupero e rischio</p></details><details><summary>I dati sostituiscono una consulenza professionale?<span>+</span></summary><p>No BizScan è uno strumento informativo Prima di investire verifica dati locali contratti fiscalità autorizzazioni e condizioni specifiche con professionisti qualificati</p></details></div>
  </section>
 </div>`
}
window.openHomeAnalysis=slug=>{if(!slug)return;location.href='analysis.html?slug='+encodeURIComponent(slug)};
window.openImmediateCompare=(a,b)=>{const chosen=[a,b].filter(Boolean).filter((x,i,arr)=>arr.indexOf(x)===i).slice(0,2);if(chosen.length<2){location.href='search.html';return}compare=chosen;localStorage.setItem('bizscan_compare',JSON.stringify(compare));location.href='compare.html'};
window.runSearch=()=>{const q=$('#homeSearch')?.value||'';location.href='search.html?q='+encodeURIComponent(q)};
function findCurrent(){const slug=new URLSearchParams(location.search).get('slug');return analyses.find(x=>x.slug===slug)||analyses[0]||null}
function scenarioChart(p){const d=displayFor(p),groups=[d.scenarios.revenue,d.scenarios.net_profit,d.scenarios.roi],numeric=groups.flat().map(v=>Number(String(v).replace(/[^0-9.,-]/g,'').replace(',','.'))||0),max=Math.max(...numeric,1);return `<div class="scenario-chart">${groups.map((g,gi)=>`<div class="chart-group">${g.map((v,i)=>{const n=Number(String(v).replace(/[^0-9.,-]/g,'').replace(',','.'))||0;return `<i class="s${i}" style="height:${Math.max(12,n/max*100)}%"></i>`}).join('')}<small>${['Fatturato','Utile netto','ROI'][gi]}</small></div>`).join('')}</div>`}
function costLegend(p){const d=displayFor(p).costs,items=(d.items||[]).slice(0,6);return `<div class="cost-layout"><div class="cost-donut"><div><small>Totale</small><b>${esc(d.total||'—')}</b></div></div><div class="cost-list">${items.map((x,i)=>`<span><i class="c${i+1}"></i>${esc(x.label||'Voce')} <b>${esc(x.percent||'—')} · ${esc(x.amount||'—')}</b></span>`).join('')}</div></div>`}
function analysisOverview(p=findCurrent()){if(!p)return '<div class="notice">Analisi non disponibile</div>';const d=displayFor(p),s=d.scenarios;return `<div class="dash-grid"><section class="panel chart-card"><h3>Scenari di profitto (annuo)</h3><div class="scenario-head"><span></span><b>Prudente</b><b>Realistico</b><b>Ottimistico</b><span>Fatturato</span>${s.revenue.map(v=>`<b>${esc(v)}</b>`).join('')}<span>Utile netto</span>${s.net_profit.map(v=>`<b>${esc(v)}</b>`).join('')}<span>ROI</span>${s.roi.map(v=>`<b>${esc(v)}</b>`).join('')}<span>Recupero investimento</span>${s.payback.map(v=>`<b>${esc(v)}</b>`).join('')}</div>${scenarioChart(p)}</section><section class="panel chart-card"><h3>Distribuzione costi iniziali</h3>${costLegend(p)}</section><section class="panel benchmark"><h3>Confronto con la media categoria</h3><div class="benchmark-table"><span></span><b>Attività</b><b>Media</b>${d.benchmark.map(x=>`<span>${esc(x.label)}</span><b>${esc(x.activity)}</b><b>${esc(x.average)} ${x.delta?`<mark>${esc(x.delta)}</mark>`:''}</b>`).join('')}</div></section><section class="panel key-indicators"><h3>Indicatori chiave</h3><div class="indicator-row">${d.indicators.map(x=>`<div><i class="${x.tone==='low'?'green':''}">${esc(x.icon||'◇')}</i><small>${esc(x.label)}</small><b class="risk-${x.tone||'mid'}">${esc(x.value)}</b></div>`).join('')}</div></section></div>`}
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
  costs:'<div class="tool-donut"><span></span><b>Costi</b></div>',
  fixed:'<div class="tool-bars"><i style="height:42%"></i><i style="height:66%"></i><i style="height:52%"></i><i style="height:82%"></i></div>',
  breakeven:'<div class="tool-lines"><i></i><i></i><b>Break-even</b></div>',
  cashflow:'<div class="tool-spark"><svg viewBox="0 0 220 80" aria-hidden="true"><polyline points="5,62 38,50 70,56 104,30 140,20 176,28 215,10" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>',
  scenarios:'<div class="tool-bars"><i style="height:34%"></i><i style="height:50%"></i><i style="height:72%"></i><i style="height:90%"></i></div>',
  stress:'<div class="tool-gauge"><span></span><b>Stress test</b></div>',
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
 const q=(params.get('q')||'').toLowerCase();const requestedCategory=(params.get('category')||'').toLowerCase();
 const cats=[...new Set(analyses.map(p=>String(p.category||'').trim()).filter(Boolean))];
 if(requestedCategory)catalogFilter=requestedCategory;host.innerHTML=`<section class="catalog-hero"><div><small>CATALOGO BIZSCAN</small><h1>Tutte le analisi in un unico spazio</h1><p>Esplora le opportunità disponibili e confronta investimento, rischio, profitto e tempi di recupero</p></div><div class="catalog-summary"><b>${analyses.length}</b><span>analisi pubblicate</span></div></section><section class="catalog-toolbar"><div class="catalog-search"><span>⌕</span><input id="searchBox" value="${esc(q)}" placeholder="Cerca per attività o settore"><button class="btn gold" type="button" onclick="renderCatalogResults()">Cerca</button></div><div class="catalog-filters"><button class="catalog-filter ${requestedCategory?'':'active'}" type="button" onclick="setCatalogFilter('all',this)">Tutte</button>${cats.map(c=>`<button class="catalog-filter ${requestedCategory===c.toLowerCase()?'active':''}" type="button" onclick="setCatalogFilter('${esc(c.toLowerCase())}',this)">${esc(c)}</button>`).join('')}</div><div class="catalog-meta"><span id="catalogCount"></span><small>Aggiornato automaticamente dai dati pubblicati</small></div></section><div id="catalogResults" class="business-grid catalog-grid"></div>`;
 const box=$('#searchBox');
 box?.addEventListener('input',renderCatalogResults);
 box?.addEventListener('keydown',e=>{if(e.key==='Enter')renderCatalogResults()});
 renderCatalogResults();
}
function renderLibrary(){const host=$('#libraryContent');if(!host)return;const arr=analyses.filter(p=>favorites.includes(p.slug));host.innerHTML=`<section class="page-title"><h1>I miei report</h1><p>Preferiti e analisi sbloccate nel tuo account</p></section><div class="business-grid search-results">${arr.map(card).join('')||'<div class="empty"><h2>La libreria è vuota</h2><p>Salva un’attività o sblocca un’analisi completa</p><a class="btn gold" href="search.html">Esplora le analisi</a></div>'}</div>`}
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
window.chooseAddon=type=>{const map={analysis:['Analisi interattiva',UNIT_PRICES.analysis],indicator:['Indicatore premium',UNIT_PRICES.indicator],pdf:['Report PDF completo',UNIT_PRICES.pdf],comparison:['Confronto avanzato',UNIT_PRICES.comparison]};const item=map[type];modal(item[0],`<p>Prezzo singolo <strong>${euro(item[1])}</strong></p><p>Il checkout reale verrà attivato quando Stripe sarà collegato al catalogo prodotti</p>`,'<a class="btn gold full" href="account.html">Accedi per continuare</a>')}
function pdfTopups(){const packs=[{n:1,p:1.99},{n:3,p:4.99},{n:5,p:6.99},{n:10,p:11.99}];return `<section class="pdf-topups section"><div class="section-head"><div><small>REPORT COMPLETI</small><h2>Crediti PDF aggiuntivi</h2><p>Scarica il dossier completo solo per le attività che vuoi valutare seriamente</p></div></div><div class="pdf-credit-grid">${packs.map(x=>`<article class="panel pdf-credit-card"><b>${x.n}</b><span>${x.n===1?'report PDF':'report PDF'}</span><strong>${euro(x.p)}</strong><button class="btn ghost full" onclick="choosePdfPack(${x.n},${x.p})">Aggiungi crediti PDF</button></article>`).join('')}</div></section>`}
window.choosePdfPack=(count,price)=>modal('Crediti PDF',`<p>${count} ${count===1?'credito':'crediti'} report PDF per <b>${euro(price)}</b></p><p>I crediti restano nel conto finché non vengono utilizzati</p>`,`<button class="btn ghost full" onclick="closeModal()">Chiudi</button>`)
window.choosePackage=key=>{const p=PACKAGES.find(x=>x.key===key);modal(p.name,`<p>Il pacchetto selezionato costa <b>${euro(p.price)}</b></p><p>Il Checkout reale verrà aperto quando gli ID prezzo Stripe e il webhook saranno configurati</p>`,`<button class="btn ghost full" onclick="closeModal()">Chiudi</button>`)};
function renderCompare(){const host=$('#compareContent');if(!host)return;const arr=compare.map(s=>analyses.find(p=>p.slug===s)).filter(Boolean);if(arr.length!==2){host.innerHTML=`<div class="empty"><h1>Confronta due attività</h1><p>Usa il simbolo ⇄ sulle card per selezionare due analisi</p><a class="btn gold" href="search.html">Esplora le analisi</a></div>`;return}host.innerHTML=`<section class="page-title"><h1>Confronto attività</h1><p>Decisione basata sugli stessi indicatori e sulle stesse fonti</p></section><div class="compare-cards">${arr.map(card).join('')}</div><section class="panel comparison-full"><div class="comparison-table"><b>Indicatore</b><b>${esc(arr[0].title)}</b><b>${esc(arr[1].title)}</b><span>BizScan Score</span><b>${arr[0].score}</b><b>${arr[1].score}</b><span>Investimento</span><b>${esc(arr[0].investment)}</b><b>${esc(arr[1].investment)}</b><span>Profitto</span><b>${esc(arr[0].profit)}</b><b>${esc(arr[1].profit)}</b><span>ROI</span><b>${esc(arr[0].roi||'—')}</b><b>${esc(arr[1].roi||'—')}</b><span>Recupero</span><b>${esc(arr[0].payback)}</b><b>${esc(arr[1].payback)}</b><span>Rischio</span><b>${esc(arr[0].riskLabel)}</b><b>${esc(arr[1].riskLabel)}</b></div></section>`}
function renderRoute(){renderHome();renderAnalysis();renderSearch();renderLibrary();renderPricing();renderCompare()}
function bindShellEvents(){
 const topInput=$('.top-search input')
 if(topInput){
  topInput.addEventListener('keydown',e=>{if(e.key==='Enter'){const q=topInput.value.trim();location.href='search.html?q='+encodeURIComponent(q)}})
 }
 const homeInput=$('#homeSearch')
 if(homeInput){homeInput.addEventListener('keydown',e=>{if(e.key==='Enter')runSearch()})}
}
document.addEventListener('DOMContentLoaded',async()=>{await load();renderRoute();bindShellEvents()});
