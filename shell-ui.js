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
        '</nav>');
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

  function setupFooter(){
    if(document.querySelector('.site-footer'))return;
    if(!document.getElementById('homeContent'))return;
    var shell=document.querySelector('.app-shell');if(!shell)return;
    var year=new Date().getFullYear();
    var html=''
      +'<footer class="site-footer">'
      +'<div class="footer-brand"><a class="footer-logo" href="/"><strong>Biz</strong><b>Scan</b></a><p>Analisi strutturate per capire un business prima di investirci tempo o capitale.</p></div>'
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
      +'</div>'
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

  document.addEventListener('DOMContentLoaded',function(){setupHeader()});

  // --- Installazione app (PWA) ---
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
  function dismissedRecently(){
    var t=localStorage.getItem('bizscan_install_dismissed');
    if(!t)return false;
    return (Date.now()-Number(t)) < 1000*60*60*24*14; // 14 giorni
  }
  function showInstallBar(html,onClickInstall){
    if(document.getElementById('pwaInstallBar'))return;
    var bar=document.createElement('div');
    bar.id='pwaInstallBar';
    bar.className='pwa-install-bar';
    bar.innerHTML='<img src="/icon-192.png" alt="BizScan"><div class="pwa-install-text">'+html+'</div><button type="button" class="pwa-install-btn" id="pwaInstallBtn">Installa</button><button type="button" class="pwa-install-close" id="pwaInstallClose" aria-label="Chiudi">×</button>';
    document.body.prepend(bar);
    document.getElementById('pwaInstallClose').onclick=function(){
      bar.remove();
      localStorage.setItem('bizscan_install_dismissed',String(Date.now()));
    };
    if(onClickInstall){
      document.getElementById('pwaInstallBtn').onclick=onClickInstall;
    }else{
      document.getElementById('pwaInstallBtn').style.display='none';
    }
  }

  if(!isStandalone() && !dismissedRecently()){
    var deferredPrompt=null;
    window.addEventListener('beforeinstallprompt',function(e){
      e.preventDefault();
      deferredPrompt=e;
      showInstallBar('<b>Installa BizScan</b><small>Accesso rapido, come app</small>',function(){
        if(!deferredPrompt)return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function(){
          deferredPrompt=null;
          var bar=document.getElementById('pwaInstallBar');
          if(bar)bar.remove();
        });
      });
    });
    if(isIOS() && !window.navigator.standalone){
      showInstallBar('<b>Installa BizScan</b><small>Tocca <b>Condividi</b> poi <b>Aggiungi a Home</b></small>',null);
    }
  }
})();
