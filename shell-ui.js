(function(){
  'use strict';

  function initLoadingBar(){
    if(document.getElementById('page-progress'))return;
    var bar=document.createElement('div');
    bar.id='page-progress';
    var fill=document.createElement('i');
    bar.appendChild(fill);
    document.body.prepend(bar);
    var pct=8;
    fill.style.width=pct+'%';
    bar.classList.add('active');
    var timer=setInterval(function(){
      pct=Math.min(pct+(90-pct)*0.08,90);
      fill.style.width=pct+'%';
    },180);
    window.__pageLoadingDone=function(){
      clearInterval(timer);
      fill.style.width='100%';
      setTimeout(function(){
        bar.classList.remove('active');
        setTimeout(function(){fill.style.width='0%'},260);
      },220);
    };
    // Give immediate feedback on any same-page navigation click, even before the browser unloads.
    document.addEventListener('click',function(e){
      var a=e.target.closest('a[href]');
      if(!a)return;
      var href=a.getAttribute('href')||'';
      if(!href||href.startsWith('#')||href.startsWith('javascript:')||a.target==='_blank')return;
      if(/^https?:\/\//i.test(href)&&!href.includes(location.hostname))return;
      pct=Math.max(pct,20);
      fill.style.width=pct+'%';
      bar.classList.add('active');
    },true);
  }
  initLoadingBar();
})();

(function(){
  'use strict';

  function closePanels(){
    document.querySelectorAll('.shell-popover.is-open').forEach(function(el){el.classList.remove('is-open')});
    document.querySelectorAll('[aria-expanded="true"]').forEach(function(el){el.setAttribute('aria-expanded','false')});
  }

  function buildPopover(id, html){
    var el=document.getElementById(id);
    if(el) return el;
    el=document.createElement('div');
    el.id=id;
    el.className='shell-popover';
    el.innerHTML=html;
    document.body.appendChild(el);
    return el;
  }

  function positionPopover(panel, trigger){
    var r=trigger.getBoundingClientRect();
    var width=Math.min(286, window.innerWidth-20);
    panel.style.width=width+'px';
    var left=Math.min(window.innerWidth-width-10, Math.max(10, r.right-width));
    panel.style.left=left+'px';
    panel.style.top=Math.min(window.innerHeight-20, r.bottom+9)+'px';
  }

  function togglePopover(panel, trigger){
    var opening=!panel.classList.contains('is-open');
    closePanels();
    if(opening){
      positionPopover(panel,trigger);
      panel.classList.add('is-open');
      trigger.setAttribute('aria-expanded','true');
    }
  }

  function setupHeader(){
    var actions=document.querySelector('.top-actions, .account-actions');
    if(!actions) return;

    var menuTrigger=actions.querySelector('[aria-label="Menu"]');
    var profileTrigger=actions.querySelector('[aria-label="Profilo"]');
    var favTrigger=actions.querySelector('[aria-label="Preferiti"]');
    var libraryTrigger=actions.querySelector('[aria-label="Libreria"]');

    if(favTrigger && favTrigger.tagName==='A') favTrigger.href='library.html';
    if(libraryTrigger && libraryTrigger.tagName==='A') libraryTrigger.href='library.html';

    if(menuTrigger){
      if(menuTrigger.tagName==='A'){
        menuTrigger.removeAttribute('href');
        menuTrigger.setAttribute('role','button');
      }
      menuTrigger.type='button';
      menuTrigger.setAttribute('aria-haspopup','menu');
      menuTrigger.setAttribute('aria-expanded','false');
      var menu=buildPopover('shellMenuPopover',
        '<div class="shell-popover-head"><strong>Menu BizScan</strong><button type="button" data-close aria-label="Chiudi">×</button></div>'+
        '<nav class="shell-menu-list">'+
        '<a href="/"><span>⌂</span><b>Dashboard</b></a>'+
        '<a href="search.html"><span>⌕</span><b>Esplora analisi</b></a>'+
        '<a href="compare.html"><span>⇄</span><b>Confronta</b></a>'+
        '<a href="library.html"><span>♡</span><b>Preferiti e report</b></a>'+
        '<a href="pricing.html"><span>€</span><b>Pacchetti</b></a>'+
        '</nav>');
      menuTrigger.onclick=function(e){e.preventDefault();e.stopPropagation();togglePopover(menu,menuTrigger)};
    }

    if(profileTrigger){
      if(profileTrigger.tagName==='A'){
        profileTrigger.removeAttribute('href');
        profileTrigger.setAttribute('role','button');
      }
      profileTrigger.type='button';
      profileTrigger.setAttribute('aria-haspopup','menu');
      profileTrigger.setAttribute('aria-expanded','false');
      var profile=buildPopover('shellProfilePopover',
        '<div class="shell-popover-head"><div><small>ACCOUNT</small><span class="brand-word"><strong>Biz</strong><b>Scan</b></span></div><button type="button" data-close aria-label="Chiudi">×</button></div>'+
        '<a class="shell-profile-summary" href="account.html"><span class="shell-avatar"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8v1H4v-1z"/></svg></span><div><b id="shellProfileName">Account BizScan</b><small id="shellProfileStatus">Crediti e analisi personali</small></div></a>'+
        '<nav class="shell-menu-list">'+
        '<a href="library.html?view=reports"><span>▤</span><b>I miei report</b></a>'+
        '<a href="library.html?view=favorites"><span>♡</span><b>Preferiti</b></a>'+
        '<a href="account.html"><span>€</span><b>Crediti e pacchetti</b></a>'+
        '<a href="invoices.html"><span>🧾</span><b>Fatturazione</b></a>'+
        '<div class="shell-menu-sep"></div>'+
        '<a href="#" id="shellLogoutBtn"><span>⎋</span><b>Esci</b></a>'+
        '</nav>');
      var logoutBtn=document.getElementById('shellLogoutBtn');
      if(logoutBtn){
        logoutBtn.onclick=function(e){
          e.preventDefault();e.stopPropagation();
          if(window.BizScanData&&window.BizScanData.getSupabaseClient){
            window.BizScanData.getSupabaseClient().then(function(c){
              return c.auth.signOut();
            }).then(function(){
              try{localStorage.removeItem('bizscan_favorites')}catch(_){}
              try{localStorage.removeItem('bizscan_last_credits')}catch(_){}
              location.href='/';
            });
          }
        };
      }
      profileTrigger.onclick=function(e){e.preventDefault();e.stopPropagation();togglePopover(profile,profileTrigger)};
    }

    document.querySelectorAll('.shell-popover [data-close]').forEach(function(btn){btn.onclick=closePanels});
  }

  document.addEventListener('click',function(e){
    if(!e.target.closest('.shell-popover') && !e.target.closest('[aria-label="Menu"]') && !e.target.closest('[aria-label="Profilo"]')) closePanels();
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape') closePanels()});
  window.addEventListener('resize',closePanels);
  window.addEventListener('scroll',closePanels,{passive:true});

  function buildSourcesMarquee(){
    var sources=[
      {c:'src-fipe',t:'FIPE'},
      {c:'src-istat',t:'ISTAT'},
      {c:'src-mit',t:'MIT'},
      {c:'src-mimit',t:'MIMIT'},
      {c:'src-ade',t:'Agenzia delle Entrate'},
      {c:'src-unioncamere',t:'Unioncamere'},
      {c:'src-camcom',t:'Camere di Commercio'},
      {c:'src-infocamere',t:'InfoCamere'},
      {c:'src-movimprese',t:'Movimprese'},
      {c:'src-inps',t:'INPS',svg:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6"/><path d="M7 15c1.2-4 2.8-6 5-6s3.8 2 5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="9" r="1.6" fill="currentColor"/></svg>'},
      {c:'src-bankit',t:'Banca d&#39;Italia',svg:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><path d="M12 2l9 4.5v2H3v-2L12 2z" fill="currentColor"/><rect x="4" y="9.5" width="2.2" height="9" fill="currentColor"/><rect x="10.9" y="9.5" width="2.2" height="9" fill="currentColor"/><rect x="17.8" y="9.5" width="2.2" height="9" fill="currentColor"/><rect x="3" y="19.5" width="18" height="2" fill="currentColor"/></svg>'},
      {c:'src-confcommercio',t:'Confcommercio'},
      {c:'src-confesercenti',t:'Confesercenti'},
      {c:'src-confartigianato',t:'Confartigianato'},
      {c:'src-cna',t:'CNA'},
      {c:'src-aci',t:'ACI',svg:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".15"/><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6"/><path d="M8 13.5l2.2-5h1.6l2.2 5M9 11.8h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5 8.5v5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'},
      {c:'src-fiaip',t:'FIAIP'},
      {c:'src-enit',t:'ENIT'},
      {c:'src-federalberghi',t:'Federalberghi'},
      {c:'src-coni',t:'CONI'},
      {c:'src-salute',t:'Ministero della Salute'},
      {c:'src-assofranchising',t:'Assofranchising'},
      {c:'src-invitalia',t:'Invitalia'},
      {c:'src-lavoro',t:'Ministero del Lavoro'},
      {c:'src-federdistribuzione',t:'Federdistribuzione'}
    ];
    var badge=function(s){return '<span class="src-badge '+s.c+'">'+(s.svg||'')+'<span>'+s.t+'</span></span>'};
    var row=sources.map(badge).join('');
    return '<div class="footer-sources"><strong class="footer-sources-label">Dati ufficiali e verificati, tra le fonti che consultiamo</strong>'
      +'<div class="footer-sources-track"><div class="footer-sources-row">'+row+row+'</div></div></div>';
  }

  function setupFooter(){
    if(document.querySelector('.site-footer'))return;
    if(!document.getElementById('homeContent'))return;
    var shell=document.querySelector('.app-shell');if(!shell)return;
    var year=new Date().getFullYear();
    var html=''
      +'<footer class="site-footer">'
      +'<div class="footer-brand"><a class="footer-logo" href="/"><strong>Biz</strong><b>Scan</b></a><p>Analisi strutturate per capire un business prima di investirci tempo o capitale.</p></div>'
      +buildSourcesMarquee()
      +'<div class="footer-trust">'
      +'<div class="footer-trust-head"><svg class="footer-shield" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.5l7.5 3v5.2c0 4.7-3.2 8.9-7.5 10.3-4.3-1.4-7.5-5.6-7.5-10.3V5.5l7.5-3z" fill="currentColor" opacity=".16"/><path d="M12 2.5l7.5 3v5.2c0 4.7-3.2 8.9-7.5 10.3-4.3-1.4-7.5-5.6-7.5-10.3V5.5l7.5-3z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8.7 12.2l2.1 2.1 4.3-4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg><strong>Pagamenti sicuri</strong></div>'
      +'<p class="footer-trust-note">I dati di pagamento non transitano né vengono conservati sui nostri server</p>'
      +'<div class="footer-pay-icons" aria-label="Metodi di pagamento supportati">'
      +'<span class="pay-badge pay-visa">VISA</span>'
      +'<span class="pay-badge pay-mc"><i></i><i></i></span>'
      +'<span class="pay-badge pay-apple"><svg viewBox="0 0 17 20" class="apple-mark" aria-hidden="true"><path fill="currentColor" d="M13.9 10.6c0-2 1.6-3 1.7-3.1-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.6 1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2.2-.9-2.2-3.4Z"/><path fill="currentColor" d="M11.7 4.3c.6-.7 1-1.7.9-2.6-.8 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.5.9.1 1.9-.5 2.5-1.2Z"/></svg><b>Pay</b></span>'
      +'<span class="pay-badge pay-paypal">Pay<b>Pal</b></span>'
      +'</div>'
      +'<small class="footer-stripe-note">Elaborazione pagamenti a cura di Stripe</small>'
      +'<button type="button" class="footer-install-btn" onclick="if(window.__bizscanTriggerInstall)window.__bizscanTriggerInstall()">📲 Installa la nostra app (Android / iOS)</button>'
      +'</div>'
      +'<div class="footer-social"><small class="footer-social-label">Seguici</small><div class="footer-social-icons">'
      +'<a href="https://www.youtube.com/@BizScanItalia" target="_blank" rel="noopener" class="social-badge social-youtube" aria-label="YouTube"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12Z"/></svg></a>'
      +'<span class="social-badge social-tiktok is-soon" aria-label="TikTok (presto disponibile)" title="Presto disponibile"><svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.4 2.3 2 4.1 4.4 4.4v3.1c-1.6.1-3-.4-4.4-1.3v6.6c0 3.3-2.7 5.9-5.9 5.9S4.8 19.1 4.8 15.9c0-3.2 2.6-5.8 5.7-5.9v3.2c-1.4.1-2.5 1.3-2.5 2.7 0 1.5 1.2 2.7 2.7 2.7s2.7-1.2 2.7-2.7V3h3.2Z"/></svg></span>'
      +'<span class="social-badge social-instagram is-soon" aria-label="Instagram (presto disponibile)" title="Presto disponibile"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg></span>'
      +'</div></div>'
      +'<div class="footer-nav">'
      +'<div class="footer-col"><h4>Piattaforma</h4><a href="/">Dashboard</a><a href="search.html">Esplora</a><a href="compare.html">Confronta</a><a href="library.html">Preferiti</a><a href="pricing.html">Pacchetti</a></div>'
      +'<div class="footer-col"><h4>Account</h4><a href="account.html">Il mio account</a><a href="library.html?view=reports">I miei report</a><a href="account.html">Assistenza</a></div>'
      +'<div class="footer-col"><h4>Legale</h4><a href="privacy.html">Privacy Policy</a><a href="cookie-policy.html">Cookie Policy</a><a href="termini.html">Termini e Condizioni</a><a href="#" onclick="event.preventDefault();if(window.openCookiePreferences)window.openCookiePreferences()">Gestisci preferenze cookie</a></div>'
      +'</div>'
      +'<div class="footer-bottom">© '+year+' BizScan. Tutti i diritti riservati.</div>'
      +'</footer>';
    shell.insertAdjacentHTML('beforeend',html);
  }
  window.__bizscanSetupFooter=setupFooter;

  // --- Installazione app (PWA) ---
  document.addEventListener('DOMContentLoaded',function(){setupHeader()});
  if('serviceWorker' in navigator){
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('/sw.js').catch(function(){});
    });
  }

  function isStandalone(){
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;
  }
  function isIOS(){
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }
  function dismissedThisSession(){
    return sessionStorage.getItem('bizscan_install_dismissed')==='1';
  }
  function pushSiteBarsDown(px){
    var topbar=document.querySelector('.topbar, header.top');
    var backRow=document.querySelector('.page-back-row');
    if(topbar)topbar.style.top=px+'px';
    if(backRow)backRow.style.top=(px+ (backRow.dataset.origTop?Number(backRow.dataset.origTop):parseInt(getComputedStyle(backRow).top||'60',10)))+'px';
  }
  function restoreSiteBars(){
    var topbar=document.querySelector('.topbar, header.top');
    var backRow=document.querySelector('.page-back-row');
    if(topbar)topbar.style.top='';
    if(backRow)backRow.style.top='';
  }
  function showInstallBar(html,onClickInstall){
    if(document.getElementById('pwaInstallBar'))return;
    var backRow=document.querySelector('.page-back-row');
    if(backRow && !backRow.dataset.origTop){
      backRow.dataset.origTop=parseInt(getComputedStyle(backRow).top||'60',10);
    }
    var bar=document.createElement('div');
    bar.id='pwaInstallBar';
    bar.className='pwa-install-bar';
    bar.innerHTML='<img src="/icon-192.png" alt="BizScan"><div class="pwa-install-text">'+html+'</div><button type="button" class="pwa-install-btn" id="pwaInstallBtn">Installa</button><button type="button" class="pwa-install-close" id="pwaInstallClose" aria-label="Chiudi">×</button>';
    document.body.prepend(bar);
    var barHeight=bar.offsetHeight;
    pushSiteBarsDown(barHeight);
    document.getElementById('pwaInstallClose').onclick=function(){
      bar.remove();
      restoreSiteBars();
      sessionStorage.setItem('bizscan_install_dismissed','1');
    };
    document.getElementById('pwaInstallBtn').onclick=onClickInstall||triggerInstall;
  }

  var deferredPrompt=null;
  var promptFired=false;

  window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();
    deferredPrompt=e;
    promptFired=true;
    if(!isStandalone() && !dismissedThisSession()){
      showInstallBar('<b>Installa BizScan</b><small>Accesso rapido, come app</small>',triggerInstall);
    }
  });
  window.addEventListener('appinstalled',function(){
    var bar=document.getElementById('pwaInstallBar');
    if(bar)bar.remove();
    restoreSiteBars();
  });

  function triggerInstall(){
    if(deferredPrompt){
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function(){
        deferredPrompt=null;
        var bar=document.getElementById('pwaInstallBar');
        if(bar)bar.remove();
        restoreSiteBars();
      });
    }else if(isIOS()){
      alert('Per installare BizScan:\n\nSafari: tocca Condividi, poi "Aggiungi a Home".\n\nChrome: tocca il menu ⋮, poi "Aggiungi a Home".');
    }else{
      alert('Apri il menu del browser e cerca "Installa app" o "Aggiungi a schermata Home".');
    }
  }
  window.__bizscanTriggerInstall=triggerInstall;

  if(!isStandalone() && !dismissedThisSession() && isIOS()){
    // Su iOS, alcune versioni recenti di Chrome supportano beforeinstallprompt come Android;
    // altre (e Safari) no. Aspettiamo un momento per vedere se l'evento nativo arriva -
    // altrimenti mostriamo le istruzioni manuali, che coprono sia Safari che Chrome.
    setTimeout(function(){
      if(!promptFired && !document.getElementById('pwaInstallBar')){
        showInstallBar('<b>Installa BizScan</b><small>Safari: Condividi → Aggiungi a Home. Chrome: menu ⋮ → Aggiungi a Home</small>',null);
      }
    },1200);
  }

  // ---------- Pulsante di aiuto contestuale ----------
  var HELP_CONTENT={
    'index':{title:'Cosa trovi in questa pagina',body:'<p>BizScan analizza attività di business reali — costi, rischi, profitti — così puoi decidere prima di investire tempo o denaro.</p><p><b>Come funzionano i crediti:</b> il tuo piano sblocca gli strumenti (grafici, indicatori), ma per vedere il contenuto <b>completo</b> di una singola attività serve un credito analisi. Per scaricare il PDF completo serve un credito PDF separato.</p><p>Tocca una categoria o cerca un&#39;attività per iniziare.</p>'},
    'search':{title:'Come cercare',body:'<p>Usa la barra di ricerca per un&#39;attività specifica, oppure tocca una categoria per filtrare.</p><p>I filtri rapidi (rischio basso, rientro veloce, ecc.) riordinano i risultati in base a quel criterio.</p><p>Ogni scheda mostra le cifre principali gratis — per il dettaglio completo serve sbloccare l&#39;analisi.</p>'},
    'analysis':{title:'Cosa è gratis e cosa è premium',body:'<p>Le prime sezioni (Panoramica) sono sempre visibili gratis. Le sezioni con il lucchetto richiedono <b>un credito analisi</b> oppure un piano che le includa.</p><p>Il PDF scaricabile è separato — richiede <b>un credito PDF</b>, anche se hai già sbloccato l&#39;analisi.</p><p>Il pulsante di sblocco ti mostra sempre quanti crediti userai prima di confermare.</p>'},
    'pricing':{title:'Piano o crediti — qual è la differenza',body:'<p><b>Il piano</b> (mensile) sblocca gli strumenti — grafici, indicatori, confronti — su tutte le attività.</p><p><b>I crediti</b> sono separati: ogni credito analisi sblocca il contenuto completo di UNA attività specifica, a tua scelta. I crediti PDF servono solo per scaricare il documento.</p><p>Puoi comprare crediti aggiuntivi in qualsiasi momento, anche senza cambiare piano.</p>'},
    'account':{title:'La tua pagina account',body:'<p>Qui vedi i tuoi crediti disponibili (analisi e PDF), le analisi già sbloccate, e i report scaricabili.</p><p>La cronologia degli acquisti è nella sezione Fatturazione.</p>'},
    'library':{title:'I tuoi preferiti e report',body:'<p>Qui trovi le attività che hai salvato come preferite, e i report PDF che hai già sbloccato — pronti per essere riaperti in qualsiasi momento, senza consumare crediti di nuovo.</p>'},
    'compare':{title:'Come funziona il confronto',body:'<p>Scegli due attività per confrontarle fianco a fianco — punteggio, rischio, investimento, profitto.</p><p>Il consiglio di BizScan sotto il confronto si aggiorna automaticamente in base ai dati reali delle due attività scelte.</p>'}
  };
  function currentPageKey(){
    var raw=location.pathname.split('/').pop()||'';
    var p=raw.replace('.html','');
    if(p===''||p==='/')p='index';
    return HELP_CONTENT[p]?p:null;
  }
  function buildHelpButton(){
    var key=currentPageKey();
    var existingBtn=document.getElementById('bizscanHelpBtn');
    var existingPanel=document.getElementById('bizscanHelpPanel');
    if(existingBtn)existingBtn.remove();
    if(existingPanel)existingPanel.remove();
    if(!key)return;
    var btn=document.createElement('button');
    btn.id='bizscanHelpBtn';
    btn.className='bizscan-help-pulse';
    btn.setAttribute('aria-label','Aiuto');
    btn.textContent='?';
    document.body.appendChild(btn);
    var pulseInterval=setInterval(function(){
      if(!btn.classList.contains('bizscan-help-pulse')){clearInterval(pulseInterval);return}
      btn.classList.remove('bizscan-help-pulse')
      void btn.offsetWidth // forza il browser a "vedere" il cambio prima di riaggiungere la classe
      btn.classList.add('bizscan-help-pulse')
    },6000)
    var panel=document.createElement('div');
    panel.id='bizscanHelpPanel';
    var c=HELP_CONTENT[key];
    panel.innerHTML='<div class="bizscan-help-head"><strong>'+c.title+'</strong><button aria-label="Chiudi">×</button></div><div class="bizscan-help-body">'+c.body+'</div>';
    document.body.appendChild(panel);
    function toggle(){
      panel.classList.toggle('is-open')
      btn.classList.remove('bizscan-help-pulse')
    }
    btn.addEventListener('click',function(e){e.stopPropagation();toggle()});
    panel.querySelector('button').addEventListener('click',toggle);
    document.addEventListener('click',function(e){
      if(panel.classList.contains('is-open') && !panel.contains(e.target) && e.target!==btn)panel.classList.remove('is-open');
    });
  }
  buildHelpButton();

  // ---------- Tour guidato alla prima visita (solo homepage, una volta sola) ----------
  function buildFirstVisitTour(){
    var page=location.pathname.split('/').pop()||'';
    if(page==='admin.html')return;
    var permanentlyDismissed=false;
    try{permanentlyDismissed=localStorage.getItem('bizscan_tour_dismissed')==='1'}catch(_){}
    if(permanentlyDismissed)return;
    var dismissedThisTab=false;
    try{dismissedThisTab=sessionStorage.getItem('bizscan_tour_session_dismissed')==='1'}catch(_){}
    if(dismissedThisTab)return;

    var steps=[
      {icon:'🔎',title:'Benvenuto su BizScan',body:'Analizziamo attività di business reali — costi, rischi, profitti, tempo di recupero — con dati concreti, per aiutarti a capire se conviene davvero aprire un&#39;attività, prima di investire tempo o denaro.'},
      {icon:'🗂️',title:'Come cercare',body:'Usa la barra di ricerca per trovare un&#39;attività specifica (es. "pizzeria" o "parrucchiere"), oppure tocca una categoria per esplorare cosa c&#39;è disponibile in quel settore. Ogni scheda mostra già gratis le cifre principali — punteggio, rischio, investimento, profitto — così puoi farti un&#39;idea prima ancora di aprire l&#39;analisi.'},
      {icon:'🔑',title:'Come funzionano i crediti',body:'Il tuo piano (mensile) sblocca gli strumenti — grafici, indicatori, confronti — validi su tutte le attività. Ma per vedere il contenuto <b>completo</b> di una singola attività (tutte le sezioni, i numeri dettagliati) serve <b>un credito analisi</b>, che scegli tu su quale attività usare. Il <b>PDF scaricabile</b> è separato: richiede un <b>credito PDF</b> a parte, anche se hai già sbloccato l&#39;analisi stessa.'},
      {icon:'✓',title:'Hai capito?',body:'Esplora le attività, salva le tue preferite, confronta due opportunità fianco a fianco. Se in qualsiasi pagina hai dubbi su qualcosa che vedi, cerca il pulsante <b>?</b> in basso — spiega esattamente quella pagina. Se hai già capito come funziona, spunta la casella qui sotto per non vedere più questa guida.'}
    ];
    var idx=0;

    var overlay=document.createElement('div');
    overlay.id='bizscanTourOverlay';
    var card=document.createElement('div');
    card.id='bizscanTourCard';
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    function finish(){
      try{sessionStorage.setItem('bizscan_tour_session_dismissed','1')}catch(_){}
      var chk=card.querySelector('#bizscanTourDismissChk');
      if(chk && chk.checked){
        try{localStorage.setItem('bizscan_tour_dismissed','1')}catch(_){}
      }
      overlay.remove();
    }
    function render(){
      var s=steps[idx];
      var dots=steps.map(function(_,i){return '<span class="bizscan-tour-dot'+(i===idx?' active':'')+'"></span>'}).join('');
      var isLast=idx===steps.length-1;
      card.innerHTML=
        '<button class="bizscan-tour-skip" aria-label="Salta">Salta</button>'+
        '<div class="bizscan-tour-icon">'+s.icon+'</div>'+
        '<h3>'+s.title+'</h3>'+
        '<p>'+s.body+'</p>'+
        '<div class="bizscan-tour-dots">'+dots+'</div>'+
        (isLast?'<label class="bizscan-tour-dismiss"><input type="checkbox" id="bizscanTourDismissChk"> Ho capito, non mostrare più questa guida</label>':'')+
        '<button class="btn gold full bizscan-tour-next">'+(isLast?'Fatto':'Avanti')+'</button>';
      card.querySelector('.bizscan-tour-skip').addEventListener('click',finish);
      card.querySelector('.bizscan-tour-next').addEventListener('click',function(){
        if(isLast){finish();return}
        idx++;render();
      });
    }
    render();
    overlay.addEventListener('click',function(e){if(e.target===overlay)finish()});
  }
  setTimeout(buildFirstVisitTour,10000);
})();
