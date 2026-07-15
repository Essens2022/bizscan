let pricingPlans=[];

const PLAN_META={
  single:{badge:"",button:"Scegli una analisi",className:"primary"},
  starter:{badge:"",button:"Scegli Starter",className:"blue"},
  smart:{badge:"PIÙ SCELTO",button:"Scegli Smart",className:"primary"},
  pro:{badge:"MIGLIOR VALORE",button:"Scegli Pro",className:"blue"},
  plus:{badge:"ACCESSO COMPLETO",button:"Scopri BizScan Plus",className:"purple"}
};

function money(value,currency="EUR"){
  return new Intl.NumberFormat("it-IT",{style:"currency",currency,minimumFractionDigits:2}).format(Number(value)||0);
}

function planBenefits(plan){
  if(plan.type==="single")return["1 analisi a scelta","Accesso permanente all’analisi acquistata"];
  if(plan.type==="starter")return[`${plan.analysis_limit||5} analisi a scelta`,"I crediti si aggiungono al tuo conto","Ogni analisi sbloccata resta tua"];
  if(plan.type==="smart")return[`${plan.analysis_limit||10} analisi a scelta`,"Miglior equilibrio prezzo quantità","I crediti non scadono dopo l’acquisto"];
  if(plan.type==="pro")return[`${plan.analysis_limit||25} analisi a scelta`,"Pacchetto per ricerche più complete","Ogni sblocco resta permanente"];
  if(plan.type==="plus")return["Tutte le analisi durante l’abbonamento","Tutte le nuove pubblicazioni","Preferiti sincronizzati e accesso completo"];
  return[];
}

function renderPricingPlans(plans){
  const host=document.getElementById("plansHost");
  const paid=plans.filter(p=>["single","starter","smart","pro","plus"].includes(p.type));
  if(!paid.length){host.innerHTML='<div class="notice">Nessun piano disponibile al momento.</div>';return;}
  host.innerHTML=paid.map(plan=>{
    const meta=PLAN_META[plan.type]||PLAN_META.single;
    const interval=plan.billing_interval==="monthly"?' <small style="font-size:12px;color:var(--muted)">al mese</small>':'';
    const badge=meta.badge?`<span class="tag" style="display:inline-block;margin-bottom:10px">${meta.badge}</span>`:"";
    return `<article class="card" style="display:block" data-plan-type="${plan.type}"><div class="card-body">${badge}<h3>${plan.type==="plus"?"BizScan Plus":plan.title}</h3><div class="price">${money(plan.price,plan.currency)}${interval}</div><p>${plan.description||""}</p><div style="margin:12px 0 14px">${planBenefits(plan).map(x=>`<div style="margin:7px 0;color:var(--muted);font-size:13px">✓ ${x}</div>`).join("")}</div><button class="btn ${meta.className} full" type="button" onclick="selectPricingPlan('${plan.type}')">${meta.button}</button></div></article>`;
  }).join("");
}

async function selectPricingPlan(type){
  const plan=pricingPlans.find(p=>p.type===type);
  if(!plan)return;
  sessionStorage.setItem("bizscanSelectedPlan",type);
  const user=await BizScanData.currentUser();
  const content=document.getElementById("modalContent");
  const recurring=plan.billing_interval==="monthly"?" al mese":"";
  content.innerHTML=`<h2>${type==="plus"?"BizScan Plus":plan.title}</h2><p><strong>${money(plan.price,plan.currency)}${recurring}</strong></p><p>${plan.description||""}</p><div class="actions">${user?'<a class="btn primary full" href="account.html?plan='+encodeURIComponent(type)+'">Continua dal tuo account</a>':'<a class="btn primary full" href="account.html?plan='+encodeURIComponent(type)+'">Accedi o registrati per continuare</a>'}<button class="btn dark full" type="button" onclick="closeModal()">Chiudi</button></div>`;
  document.getElementById("modal").classList.add("show");
}
window.selectPricingPlan=selectPricingPlan;

async function initPricing(){
  try{
    pricingPlans=await BizScanData.fetchPlans();
    renderPricingPlans(pricingPlans);
  }catch(error){
    console.error("BizScan pricing",error);
    document.getElementById("plansHost").innerHTML='<div class="notice">Impossibile caricare i piani. Riprova tra poco.</div>';
  }
}
document.addEventListener("DOMContentLoaded",initPricing);
