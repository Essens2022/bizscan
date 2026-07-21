/* BizScan - Cookie Consent Management (GDPR / Garante Privacy compliant)
   - Cookie tecnici: sempre attivi (necessari al funzionamento del sito)
   - Cookie analitici (Google Analytics): NON caricati finché l'utente non acconsente
   - Cookie marketing/profilazione: predisposti, non ancora utilizzati
   - Consenso salvato in localStorage, richiedibile di nuovo in ogni momento tramite
     window.openCookiePreferences() (collegato al link "Gestisci preferenze cookie")
*/
(function(){
"use strict";
var CONSENT_KEY="bizscan_cookie_consent";
var CONSENT_VERSION=1;
var GA_ID="G-ND8Y8Q272W";

function esc(v){return String(v??"").replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}

function getConsent(){
  try{
    var raw=localStorage.getItem(CONSENT_KEY);
    if(!raw)return null;
    var parsed=JSON.parse(raw);
    if(parsed.version!==CONSENT_VERSION)return null;
    return parsed;
  }catch(e){return null}
}

function saveConsent(analytics,marketing){
  var data={version:CONSENT_VERSION,necessary:true,analytics:!!analytics,marketing:!!marketing,timestamp:new Date().toISOString()};
  try{localStorage.setItem(CONSENT_KEY,JSON.stringify(data))}catch(e){}
  applyConsent(data);
  return data;
}

function applyConsent(consent){
  if(consent.analytics)loadGoogleAnalytics();
  // Marketing/profilazione: nessun tracker attivo al momento - predisposto per usi futuri.
}

function loadGoogleAnalytics(){
  if(window.__bizscanGaLoaded)return;
  window.__bizscanGaLoaded=true;
  var s=document.createElement("script");
  s.async=true;
  s.src="https://www.googletagmanager.com/gtag/js?id="+GA_ID;
  document.head.appendChild(s);
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer.push(arguments)};
  window.gtag("js",new Date());
  window.gtag("config",GA_ID);
}

function injectStyles(){
  if(document.getElementById("cookieConsentStyles"))return;
  var css=".cc-banner{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#0b1119;border-top:1px solid #232f42;box-shadow:0 -12px 40px rgba(0,0,0,.45);padding:20px;animation:cc-slide-up .35s ease}"+
  "@keyframes cc-slide-up{from{transform:translateY(100%)}to{transform:translateY(0)}}"+
  ".cc-banner-inner{max-width:920px;margin:0 auto}"+
  ".cc-banner h3{margin:0 0 8px;font-size:16px;font-weight:900;color:#f5f7fb}"+
  ".cc-banner p{margin:0 0 16px;font-size:13px;line-height:1.5;color:#9fa6b2}"+
  ".cc-banner p a{color:#ffb400;text-decoration:underline}"+
  ".cc-btn-row{display:flex;gap:10px;flex-wrap:wrap}"+
  ".cc-btn{padding:12px 18px;border-radius:12px;font-weight:800;font-size:13px;border:none;cursor:pointer;flex:1;min-width:130px;text-align:center}"+
  ".cc-btn-primary{background:linear-gradient(135deg,#ffb400,#ff8a00);color:#0c1420}"+
  ".cc-btn-secondary{background:#151d2b;color:#f5f7fb;border:1px solid #2b394e}"+
  ".cc-btn-ghost{background:transparent;color:#9fa6b2;border:1px solid #232f42}"+
  ".cc-overlay{position:fixed;inset:0;background:rgba(2,5,10,.72);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;animation:cc-fade-in .2s ease}"+
  "@keyframes cc-fade-in{from{opacity:0}to{opacity:1}}"+
  ".cc-panel{background:#0d131d;border:1px solid #232f42;border-radius:20px;max-width:560px;width:100%;max-height:86vh;overflow-y:auto;padding:26px}"+
  ".cc-panel h2{margin:0 0 6px;font-size:20px;font-weight:900;color:#f5f7fb}"+
  ".cc-panel>p{margin:0 0 20px;font-size:13px;color:#9fa6b2;line-height:1.5}"+
  ".cc-panel>p a{color:#ffb400;text-decoration:underline}"+
  ".cc-cat{border:1px solid #232f42;border-radius:14px;padding:16px;margin-bottom:12px}"+
  ".cc-cat-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:6px}"+
  ".cc-cat-head b{font-size:14px;color:#f5f7fb}"+
  ".cc-cat p{margin:0;font-size:12px;color:#8f9bad;line-height:1.5}"+
  ".cc-switch{position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0}"+
  ".cc-switch input{opacity:0;width:0;height:0}"+
  ".cc-slider{position:absolute;cursor:pointer;inset:0;background:#2b394e;border-radius:99px;transition:.2s}"+
  ".cc-slider:before{content:'';position:absolute;height:18px;width:18px;left:3px;top:3px;background:#f5f7fb;border-radius:50%;transition:.2s}"+
  ".cc-switch input:checked+.cc-slider{background:#ffb400}"+
  ".cc-switch input:checked+.cc-slider:before{transform:translateX(18px)}"+
  ".cc-switch input:disabled+.cc-slider{opacity:.5;cursor:not-allowed}"+
  ".cc-panel-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}"+
  "@media(max-width:480px){.cc-btn{min-width:100%}.cc-panel-actions .cc-btn{min-width:100%}}";
  var style=document.createElement("style");
  style.id="cookieConsentStyles";
  style.textContent=css;
  document.head.appendChild(style);
}

function renderBanner(){
  injectStyles();
  var el=document.createElement("div");
  el.className="cc-banner";
  el.id="ccBanner";
  el.innerHTML=
    '<div class="cc-banner-inner">'+
      '<h3>Rispettiamo la tua privacy</h3>'+
      '<p>Usiamo cookie tecnici, sempre necessari al funzionamento del sito, e cookie analitici opzionali per capire come viene usato BizScan. Nessun cookie opzionale viene attivato senza il tuo consenso. Leggi la <a href="cookie-policy.html">Cookie Policy</a>.</p>'+
      '<div class="cc-btn-row">'+
        '<button type="button" class="cc-btn cc-btn-ghost" id="ccRejectAll">Rifiuta tutti</button>'+
        '<button type="button" class="cc-btn cc-btn-secondary" id="ccCustomize">Personalizza</button>'+
        '<button type="button" class="cc-btn cc-btn-primary" id="ccAcceptAll">Accetta tutti</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(el);
  document.getElementById("ccAcceptAll").onclick=function(){saveConsent(true,true);removeBanner()};
  document.getElementById("ccRejectAll").onclick=function(){saveConsent(false,false);removeBanner()};
  document.getElementById("ccCustomize").onclick=function(){removeBanner();renderPreferencesPanel()};
}

function removeBanner(){
  var el=document.getElementById("ccBanner");
  if(el)el.remove();
}

function renderPreferencesPanel(){
  injectStyles();
  var current=getConsent()||{analytics:false,marketing:false};
  var overlay=document.createElement("div");
  overlay.className="cc-overlay";
  overlay.id="ccOverlay";
  overlay.innerHTML=
    '<div class="cc-panel">'+
      '<h2>Gestisci preferenze cookie</h2>'+
      '<p>Scegli quali categorie di cookie vuoi permettere. I cookie tecnici sono sempre attivi perché necessari al funzionamento del sito. Puoi modificare o revocare il consenso in qualsiasi momento tornando su questa pagina. Leggi la <a href="cookie-policy.html">Cookie Policy</a>.</p>'+
      '<div class="cc-cat"><div class="cc-cat-head"><b>Cookie necessari</b><label class="cc-switch"><input type="checkbox" checked disabled><span class="cc-slider"></span></label></div><p>Indispensabili per il funzionamento del sito (login, sicurezza, preferenze di base). Non richiedono consenso.</p></div>'+
      '<div class="cc-cat"><div class="cc-cat-head"><b>Cookie analitici</b><label class="cc-switch"><input type="checkbox" id="ccAnalyticsToggle" '+(current.analytics?"checked":"")+'><span class="cc-slider"></span></label></div><p>Google Analytics - ci aiutano a capire come viene usato il sito, in forma aggregata. Attivati solo con il tuo consenso.</p></div>'+
      '<div class="cc-cat"><div class="cc-cat-head"><b>Marketing / Profilazione</b><label class="cc-switch"><input type="checkbox" id="ccMarketingToggle" '+(current.marketing?"checked":"")+'><span class="cc-slider"></span></label></div><p>Al momento non utilizziamo cookie di marketing o profilazione. Predisposto per usi futuri, con lo stesso livello di controllo.</p></div>'+
      '<div class="cc-panel-actions">'+
        '<button type="button" class="cc-btn cc-btn-ghost" id="ccPanelRejectAll">Rifiuta tutti</button>'+
        '<button type="button" class="cc-btn cc-btn-primary" id="ccPanelSave">Salva preferenze</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove()});
  document.getElementById("ccPanelRejectAll").onclick=function(){saveConsent(false,false);overlay.remove()};
  document.getElementById("ccPanelSave").onclick=function(){
    var analytics=document.getElementById("ccAnalyticsToggle").checked;
    var marketing=document.getElementById("ccMarketingToggle").checked;
    saveConsent(analytics,marketing);
    overlay.remove();
  };
}

window.openCookiePreferences=function(){
  var existingOverlay=document.getElementById("ccOverlay");
  if(existingOverlay)return;
  removeBanner();
  renderPreferencesPanel();
};

function init(){
  var consent=getConsent();
  if(consent){
    applyConsent(consent);
  }else{
    renderBanner();
  }
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",init);
}else{
  init();
}
})();
