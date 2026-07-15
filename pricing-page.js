let pricingPlans=[];
const CANONICAL={
 single:{title:"Analisi Singola",price:1.99,limit:1,badge:"",button:"Scegli una analisi",className:"primary",cost:"1,99 € per analisi",save:"",benefits:["1 analisi a scelta","Accesso permanente all’analisi acquistata"]},
 starter:{title:"Starter",price:4.99,limit:5,badge:"",button:"Scegli Starter",className:"blue",cost:"Circa 1 € per analisi",save:"Risparmi 4,96 €",benefits:["5 analisi a scelta","I crediti si aggiungono al tuo conto","Ogni analisi sbloccata resta tua"]},
 smart:{title:"Smart",price:6.99,limit:10,badge:"PIÙ SCELTO",button:"Scegli Smart",className:"primary",cost:"Circa 0,70 € per analisi",save:"Risparmi 12,91 €",benefits:["10 analisi a scelta","Miglior equilibrio prezzo quantità","I crediti restano disponibili"]},
 pro:{title:"Pro",price:9.99,limit:20,badge:"MIGLIOR VALORE",button:"Scegli Pro",className:"blue",cost:"Circa 0,50 € per analisi",save:"Risparmi 29,81 €",benefits:["20 analisi a scelta","Massimo risparmio per analisi","Ogni analisi sbloccata resta tua"]},
 plus:{title:"BizScan Plus",price:14.99,limit:null,badge:"ACCESSO COMPLETO",button:"Scopri BizScan Plus",className:"purple",cost:"14,99 € al mese",save:"Tutte le analisi incluse",benefits:["Tutte le analisi durante l’abbonamento","Tutte le nuove pubblicazioni","Gli acquisti precedenti restano permanenti"]}
};
function money(v){return new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",minimumFractionDigits:2}).format(Number(v)||0)}
function canonicalPlan(type,db){const c=CANONICAL[type];return c?{...db,...c,type,dbId:db?.id||null}:null}
function renderPricingPlans(dbPlans){
 const host=document.getElementById("plansHost");
 const byType=Object.fromEntries((dbPlans||[]).map(p=>[p.type,p]));
 const plans=["single","starter","smart","pro","plus"].map(t=>canonicalPlan(t,byType[t])).filter(Boolean);
 pricingPlans=plans;
 host.className="pricing-cards";
 host.innerHTML=plans.map(plan=>`<article class="price-plan ${plan.type==='smart'?'featured':''}" data-plan-type="${plan.type}">${plan.badge?`<span class="price-plan-badge">${plan.badge}</span>`:''}<h3>${plan.title}</h3><div class="price-plan-value">${money(plan.price)}${plan.type==='plus'?'<small>/mese</small>':''}</div><div class="price-plan-cost">${plan.cost}</div>${plan.save?`<span class="price-plan-saving">${plan.save}</span>`:''}<ul>${plan.benefits.map(x=>`<li>${x}</li>`).join('')}</ul><button class="btn ${plan.className} full" type="button" onclick="selectPricingPlan('${plan.type}')">${plan.button}</button></article>`).join('');
}
async function selectPricingPlan(type){
 const plan=pricingPlans.find(p=>p.type===type);if(!plan)return;
 sessionStorage.setItem("bizscanSelectedPlan",type);
 const user=await BizScanData.currentUser();
 const content=document.getElementById("modalContent");
 content.innerHTML=`<h2>${plan.title}</h2><p><strong>${money(plan.price)}${type==='plus'?' al mese':''}</strong></p><p>${plan.cost}${plan.save?` · ${plan.save}`:''}</p><div class="actions"><a class="btn primary full" href="account.html?plan=${encodeURIComponent(type)}">${user?'Continua dal tuo account':'Accedi o registrati per continuare'}</a><button class="btn dark full" type="button" onclick="closeModal()">Chiudi</button></div>`;
 document.getElementById("modal").classList.add("show");
}
window.selectPricingPlan=selectPricingPlan;
document.addEventListener("DOMContentLoaded",async()=>{try{renderPricingPlans(await BizScanData.fetchPlans())}catch(e){console.error(e);renderPricingPlans([])}});
