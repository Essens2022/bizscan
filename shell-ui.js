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
        '<a href="index.html"><span>⌂</span><b>Dashboard</b></a>'+
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
        '<div class="shell-popover-head"><div><small>ACCOUNT</small><strong>Il tuo spazio BizScan</strong></div><button type="button" data-close aria-label="Chiudi">×</button></div>'+
        '<div class="shell-profile-summary"><span class="shell-avatar">♙</span><div><b id="shellProfileName">Account BizScan</b><small id="shellProfileStatus">Crediti e analisi personali</small></div></div>'+
        '<nav class="shell-menu-list">'+
        '<a href="account.html"><span>♙</span><b>Profilo e accesso</b></a>'+
        '<a href="library.html"><span>▤</span><b>I miei report</b></a>'+
        '<a href="library.html"><span>♡</span><b>Preferiti</b></a>'+
        '<a href="pricing.html"><span>€</span><b>Crediti e pacchetti</b></a>'+
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
    var shell=document.querySelector('.app-shell');if(!shell)return;
    var year=new Date().getFullYear();
    var html=''
      +'<footer class="site-footer"><div class="footer-top">'
      +'<div class="footer-brand"><a class="footer-logo" href="index.html">BizScan</a><p>Analisi strutturate per capire un business prima di investirci tempo o capitale.</p></div>'
      +'<div class="footer-col"><h4>Piattaforma</h4><a href="index.html">Dashboard</a><a href="search.html">Esplora</a><a href="compare.html">Confronta</a><a href="library.html">Preferiti</a><a href="pricing.html">Pacchetti</a></div>'
      +'<div class="footer-col"><h4>Account</h4><a href="account.html">Il mio account</a><a href="library.html">I miei report</a><a href="account.html">Assistenza</a></div>'
      +'<div class="footer-col"><h4>Legale</h4><a href="privacy.html">Privacy Policy</a><a href="cookie-policy.html">Cookie Policy</a><a href="termini.html">Termini e Condizioni</a></div>'
      +'</div>'
      +'<div class="footer-trust"><div class="footer-trust-head"><span class="footer-lock">🔒</span><div><strong>Pagamenti sicuri</strong><small>I dati di pagamento non transitano né vengono conservati sui nostri server</small></div></div>'
      +'<div class="footer-pay-icons" aria-hidden="true"><span>VISA</span><span>Mastercard</span><span>Apple Pay</span><span>PayPal</span></div><small class="footer-pay-note">Metodi di pagamento in fase di attivazione</small></div>'
      +'<div class="footer-bottom"><span>© '+year+' BizScan. Tutti i diritti riservati.</span><span>P.IVA in fase di attivazione</span></div>'
      +'</footer>';
    shell.insertAdjacentHTML('beforeend',html);
  }

  document.addEventListener('DOMContentLoaded',function(){setupHeader();setupFooter()});
})();
