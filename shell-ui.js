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
      +'<footer class="site-footer">'
      +'<div class="footer-brand"><a class="footer-logo" href="index.html"><strong>Biz</strong><b>Scan</b></a><p>Analisi strutturate per capire un business prima di investirci tempo o capitale.</p></div>'
      +'<div class="footer-nav">'
      +'<div class="footer-col"><h4>Piattaforma</h4><a href="index.html">Dashboard</a><a href="search.html">Esplora</a><a href="compare.html">Confronta</a><a href="library.html">Preferiti</a><a href="pricing.html">Pacchetti</a></div>'
      +'<div class="footer-col"><h4>Account</h4><a href="account.html">Il mio account</a><a href="library.html">I miei report</a><a href="account.html">Assistenza</a></div>'
      +'<div class="footer-col"><h4>Legale</h4><a href="privacy.html">Privacy Policy</a><a href="cookie-policy.html">Cookie Policy</a><a href="termini.html">Termini e Condizioni</a></div>'
      +'</div>'
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
      +'<div class="footer-bottom">© '+year+' BizScan. Tutti i diritti riservati.</div>'
      +'</footer>';
    shell.insertAdjacentHTML('beforeend',html);
  }

  document.addEventListener('DOMContentLoaded',function(){setupHeader();setupFooter()});
})();
