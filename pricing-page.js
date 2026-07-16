const PRICING_CATALOG=[
 {type:'single',title:'Analisi Singola',price:1.99,analyses:1,pdfCredits:0,indicatorCount:0,badge:'',benefits:['1 analisi interattiva','Indicatori essenziali','Report PDF acquistabile separatamente']},
 {type:'starter',title:'Starter',price:4.99,analyses:3,pdfCredits:0,indicatorCount:0,badge:'',benefits:['3 analisi interattive','Libreria personale','Report PDF acquistabili separatamente']},
 {type:'smart',title:'Smart',price:6.99,analyses:5,pdfCredits:1,indicatorCount:1,badge:'SCELTA INTELLIGENTE',benefits:['5 analisi interattive','Break-even','1 credito report PDF']},
 {type:'pro',title:'Pro',price:9.99,analyses:8,pdfCredits:2,indicatorCount:3,badge:'PIÙ SCELTO',benefits:['8 analisi interattive','3 indicatori premium','2 crediti report PDF']},
 {type:'advanced',title:'Advanced',price:14.99,analyses:12,pdfCredits:3,indicatorCount:6,badge:'CONSIGLIATO',benefits:['12 analisi interattive','6 indicatori premium','3 crediti report PDF']},
 {type:'business',title:'Business',price:18.99,analyses:16,pdfCredits:5,indicatorCount:10,badge:'MIGLIOR VALORE',benefits:['16 analisi interattive','10 indicatori premium','5 crediti report PDF']},
 {type:'max',title:'BizScan Max',price:23.99,analyses:20,pdfCredits:7,indicatorCount:12,badge:'ESPERIENZA COMPLETA',benefits:['20 analisi interattive','Tutti i 12 indicatori','7 crediti report PDF']}
]
const UNIT_PRICES={analysis:1.99,indicator:2.99,pdf:3.99,comparison:1.99}
const COMPARISON_UNITS={single:0,starter:0,smart:0,pro:1,advanced:2,business:3,max:4}
const money=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(v)
function renderPricingPlans(){const host=document.getElementById('plansHost');if(!host)return;host.innerHTML=PRICING_CATALOG.map(p=>{const c=COMPARISON_UNITS[p.type]||0;const total=p.analyses*UNIT_PRICES.analysis+p.indicatorCount*UNIT_PRICES.indicator+p.pdfCredits*UNIT_PRICES.pdf+c*UNIT_PRICES.comparison;const saving=Math.max(0,total-p.price);const resources=p.analyses+p.indicatorCount+p.pdfCredits+c;return `<article class="price-plan ${p.type==='pro'?'featured':''}">${p.badge?`<span class="price-plan-badge">${p.badge}</span>`:''}<h3>${p.title}</h3><div class="price-plan-value">${money(p.price)}</div><div class="price-plan-cost">Valore separato <del>${money(total)}</del></div><div class="price-plan-saving">Risparmi ${money(saving)}</div><div class="price-plan-cost">Circa ${money(p.price/resources)} per risorsa inclusa</div><ul>${p.benefits.map(x=>`<li>${x}</li>`).join('')}</ul><button class="btn primary full" onclick="selectPricingPlan('${p.type}')">Scegli ${p.title}</button></article>`}).join('')}
async function selectPricingPlan(type){sessionStorage.setItem('bizscanSelectedPlan',type);location.href=`account.html?plan=${encodeURIComponent(type)}`}
window.selectPricingPlan=selectPricingPlan
document.addEventListener('DOMContentLoaded',renderPricingPlans)
