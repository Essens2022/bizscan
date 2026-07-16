(() => {
  const enabled = new URLSearchParams(location.search).get('visualEditor') === '1' || sessionStorage.getItem('bizscanVisualEditor') === '1'
  if(!enabled) return
  sessionStorage.setItem('bizscanVisualEditor','1')

  const DRAFT_KEY='bizscanVisualDraftV2'
  const runtime=()=>window.BizScanBuilderRuntime
  const pageKey=()=>runtime()?.pageKey || 'index'
  const parse=v=>{try{return JSON.parse(v||'{}')||{}}catch{return{}}}
  let fullDraft=parse(localStorage.getItem(DRAFT_KEY))
  if(!fullDraft.version) fullDraft={version:2,pages:{}}
  if(!fullDraft.pages) fullDraft.pages={}
  if(!fullDraft.pages[pageKey()]) fullDraft.pages[pageKey()]={elements:{},orders:{}}
  let page=fullDraft.pages[pageKey()]
  let selected=null
  let history=[]
  let future=[]
  let device='desktop'
  let dirty=false

  const editableSelector='h1,h2,h3,h4,h5,h6,p,small,strong,b,em,span,label,li,button,a,input,textarea,img,section,article,.panel,.business-card,.plan,.hero-stats>div,.kpi,.insight,.category-card'
  const containerSelector='section,article,.panel,.business-card,.plan,.hero-stats>div,.kpi,.insight,.category-card'

  function snapshot(){
    history.push(JSON.stringify(fullDraft))
    if(history.length>50) history.shift()
    future=[]
  }
  function save(){ localStorage.setItem(DRAFT_KEY,JSON.stringify(fullDraft));dirty=true;status('Bozza salvata') }
  function config(el){
    const id=el.dataset.veId
    page.elements[id] ||= {}
    return page.elements[id]
  }
  function status(text){const e=document.getElementById('veStatus');if(e)e.textContent=text}
  function esc(v){return String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
  function px(v){return String(v||'').replace('px','')}
  function currentStyle(el,prop){return getComputedStyle(el)[prop]||''}

  function decorate(root=document){
    runtime()?.assignStableIds(root)
    const list=[]
    if(root.nodeType===1 && root.matches?.(editableSelector)) list.push(root)
    root.querySelectorAll?.(editableSelector).forEach(el=>list.push(el))
    list.forEach(el=>{
      if(el.closest('.ve-toolbar,.ve-panel,.ve-selection-toolbar')) return
      el.dataset.veEditable='1'
    })
    runtime()?.applyState(fullDraft)
  }

  function select(el){
    if(!el || el.closest('.ve-toolbar,.ve-panel,.ve-selection-toolbar')) return
    selected?.classList.remove('ve-selected')
    selected=el
    selected.classList.add('ve-selected')
    renderPanel()
    positionSelectionToolbar()
  }

  function canText(el){return el.matches('h1,h2,h3,h4,h5,h6,p,small,strong,b,em,span,label,li,button,a,th,td')}
  function canMove(el){return el.parentElement && el.matches(containerSelector)}

  function renderPanel(){
    if(!selected)return
    const c=config(selected)
    const cs=getComputedStyle(selected)
    const isImg=selected.matches('img')
    const isInput=selected.matches('input,textarea')
    const isLink=selected.matches('a')
    const panel=document.getElementById('vePanel')
    panel.innerHTML=`
      <div class="ve-panel-head"><div><small>ELEMENTO SELECTAT</small><strong>${esc(selected.tagName.toLowerCase())} · ${esc((selected.className||'').toString().split(' ').slice(0,2).join('.'))}</strong></div><button data-close>×</button></div>
      <div class="ve-tabs"><button class="active" data-pane-btn="content">Contenuto</button><button data-pane-btn="style">Stile</button><button data-pane-btn="layout">Layout</button><button data-pane-btn="visibility">Visibilità</button></div>
      <div class="ve-pane active" data-pane="content">
        ${canText(selected)?`<label>Testo<textarea data-field="text">${esc(c.text!==undefined?c.text:selected.textContent.trim())}</textarea></label>`:''}
        ${isInput?`<label>Testo placeholder<input data-field="placeholder" value="${esc(c.placeholder!==undefined?c.placeholder:selected.placeholder)}"></label>`:''}
        ${isImg?`<label>URL immagine<input data-field="src" value="${esc(c.src||selected.getAttribute('src')||'')}"></label><label>Testo alternativo<input data-field="alt" value="${esc(selected.alt||'')}"></label>`:''}
        ${isLink?`<label>Destinazione link<input data-field="href" value="${esc(c.href||selected.getAttribute('href')||'')}"></label>`:''}
        <div class="ve-action-grid">
          <button data-duplicate ${selected.matches('header,main,nav')?'disabled':''}>Duplica</button>
          <button data-reset>Ripristina elemento</button>
        </div>
      </div>
      <div class="ve-pane" data-pane="style">
        <div class="ve-grid2"><label>Colore<input type="color" data-style="color" value="${rgbToHex(cs.color)}"></label><label>Sfondo<input type="color" data-style="backgroundColor" value="${rgbToHex(cs.backgroundColor,'#0b1017')}"></label></div>
        <div class="ve-grid2"><label>Dimensione testo<input type="number" min="8" max="120" data-style-px="fontSize" value="${px(cs.fontSize)}"></label><label>Peso<select data-style="fontWeight"><option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option><option value="800">800</option><option value="900">900</option></select></label></div>
        <label>Allineamento<select data-style="textAlign"><option value="left">Sinistra</option><option value="center">Centro</option><option value="right">Destra</option></select></label>
        <div class="ve-grid2"><label>Raggio<input type="number" min="0" max="80" data-style-px="borderRadius" value="${px(cs.borderRadius)}"></label><label>Opacità<input type="range" min="0.1" max="1" step="0.05" data-style="opacity" value="${cs.opacity||1}"></label></div>
      </div>
      <div class="ve-pane" data-pane="layout">
        <div class="ve-grid2"><label>Margine sopra<input type="number" min="-100" max="200" data-style-px="marginTop" value="${px(cs.marginTop)}"></label><label>Margine sotto<input type="number" min="-100" max="200" data-style-px="marginBottom" value="${px(cs.marginBottom)}"></label></div>
        <div class="ve-grid2"><label>Padding verticale<input type="number" min="0" max="150" data-style-px="paddingTop" value="${px(cs.paddingTop)}"></label><label>Padding orizzontale<input type="number" min="0" max="150" data-style-px="paddingLeft" value="${px(cs.paddingLeft)}"></label></div>
        <div class="ve-grid2"><label>Larghezza %<input type="number" min="10" max="100" data-style-percent="width" value="${c.styles?.width?.includes('%')?parseInt(c.styles.width):100}"></label><label>Altezza minima<input type="number" min="0" max="1000" data-style-px="minHeight" value="${px(cs.minHeight)==='0'?'':px(cs.minHeight)}"></label></div>
        <div class="ve-action-grid"><button data-move="up" ${canMove(selected)?'':'disabled'}>Sposta su</button><button data-move="down" ${canMove(selected)?'':'disabled'}>Sposta giù</button></div>
      </div>
      <div class="ve-pane" data-pane="visibility">
        <label class="ve-check"><input type="checkbox" data-flag="hidden" ${c.hidden?'checked':''}> Nascondi ovunque</label>
        <label class="ve-check"><input type="checkbox" data-flag="hiddenDesktop" ${c.hiddenDesktop?'checked':''}> Nascondi su desktop</label>
        <label class="ve-check"><input type="checkbox" data-flag="hiddenMobile" ${c.hiddenMobile?'checked':''}> Nascondi su mobile</label>
        <button class="ve-danger" data-delete>Elimina dal layout</button>
      </div>`
    panel.classList.add('show')
    panel.querySelector('[data-close]').onclick=()=>closePanel()
    panel.querySelectorAll('[data-pane-btn]').forEach(btn=>btn.onclick=()=>{
      panel.querySelectorAll('[data-pane-btn]').forEach(x=>x.classList.toggle('active',x===btn))
      panel.querySelectorAll('[data-pane]').forEach(x=>x.classList.toggle('active',x.dataset.pane===btn.dataset.paneBtn))
    })
    const weight=panel.querySelector('[data-style="fontWeight"]');if(weight)weight.value=String(Math.round(Number(cs.fontWeight)/100)*100)
    const align=panel.querySelector('[data-style="textAlign"]');if(align)align.value=cs.textAlign
    bindPanelControls(panel)
  }

  function bindPanelControls(panel){
    panel.querySelectorAll('[data-field]').forEach(input=>input.addEventListener('input',()=>{
      snapshot();const c=config(selected),field=input.dataset.field;c[field]=input.value
      if(field==='text'){if(selected.matches('input,textarea'))selected.value=input.value;else selected.textContent=input.value}
      if(field==='placeholder')selected.placeholder=input.value
      if(field==='src')selected.src=input.value
      if(field==='alt')selected.alt=input.value
      if(field==='href')selected.href=input.value
      save()
    }))
    panel.querySelectorAll('[data-style]').forEach(input=>input.addEventListener('input',()=>setStyle(input.dataset.style,input.value)))
    panel.querySelectorAll('[data-style-px]').forEach(input=>input.addEventListener('input',()=>{
      let prop=input.dataset.stylePx;setStyle(prop,input.value===''?'':`${input.value}px`)
      if(prop==='paddingTop') setStyle('paddingBottom',input.value===''?'':`${input.value}px`,false)
      if(prop==='paddingLeft') setStyle('paddingRight',input.value===''?'':`${input.value}px`,false)
    }))
    panel.querySelectorAll('[data-style-percent]').forEach(input=>input.addEventListener('input',()=>setStyle(input.dataset.stylePercent,`${input.value}%`)))
    panel.querySelectorAll('[data-flag]').forEach(input=>input.onchange=()=>{snapshot();config(selected)[input.dataset.flag]=input.checked;runtime().applyElement(selected,config(selected));save()})
    panel.querySelector('[data-reset]').onclick=()=>{snapshot();delete page.elements[selected.dataset.veId];selected.removeAttribute('style');selected.classList.remove('ve-hidden-desktop','ve-hidden-mobile','ve-builder-hidden');save();location.reload()}
    panel.querySelector('[data-duplicate]').onclick=()=>duplicateSelected()
    panel.querySelector('[data-delete]').onclick=()=>{snapshot();config(selected).hidden=true;runtime().applyElement(selected,config(selected));save();closePanel()}
    panel.querySelectorAll('[data-move]').forEach(btn=>btn.onclick=()=>moveSelected(btn.dataset.move))
  }

  function setStyle(prop,value,record=true){
    if(record)snapshot();const c=config(selected);c.styles ||= {};c.styles[prop]=value;selected.style[prop]=value;save();positionSelectionToolbar()
  }
  function duplicateSelected(){
    if(!selected?.parentElement)return
    snapshot();const clone=selected.cloneNode(true);clone.removeAttribute('data-ve-id');clone.querySelectorAll('[data-ve-id]').forEach(x=>x.removeAttribute('data-ve-id'));selected.after(clone);decorate(clone);save();select(clone)
  }
  function moveSelected(direction){
    const parent=selected.parentElement;if(!parent)return
    snapshot()
    if(direction==='up'&&selected.previousElementSibling) parent.insertBefore(selected,selected.previousElementSibling)
    if(direction==='down'&&selected.nextElementSibling) parent.insertBefore(selected.nextElementSibling,selected)
    runtime().assignStableIds(parent)
    const pid=parent.dataset.veId || (parent.dataset.veId=`${pageKey()}:container-${Date.now()}`)
    page.orders[pid]=[...parent.children].filter(x=>x.dataset.veId).map(x=>x.dataset.veId)
    save();positionSelectionToolbar()
  }
  function closePanel(){document.getElementById('vePanel')?.classList.remove('show');selected?.classList.remove('ve-selected');selected=null;document.getElementById('veSelectionToolbar')?.classList.remove('show')}

  function rgbToHex(rgb,fallback='#ffffff'){
    const m=String(rgb||'').match(/\d+(?:\.\d+)?/g);if(!m||m.length<3)return fallback
    if(m.length>3&&Number(m[3])===0)return fallback
    return '#'+m.slice(0,3).map(x=>Math.round(Number(x)).toString(16).padStart(2,'0')).join('')
  }

  function positionSelectionToolbar(){
    const t=document.getElementById('veSelectionToolbar');if(!t||!selected)return
    const r=selected.getBoundingClientRect();t.style.left=`${Math.max(8,Math.min(innerWidth-190,r.left))}px`;t.style.top=`${Math.max(8,r.top-42)}px`;t.classList.add('show')
  }

  function undo(){if(!history.length)return;future.push(JSON.stringify(fullDraft));fullDraft=parse(history.pop());page=fullDraft.pages[pageKey()]||{elements:{},orders:{}};localStorage.setItem(DRAFT_KEY,JSON.stringify(fullDraft));location.reload()}
  function redo(){if(!future.length)return;history.push(JSON.stringify(fullDraft));fullDraft=parse(future.pop());page=fullDraft.pages[pageKey()]||{elements:{},orders:{}};localStorage.setItem(DRAFT_KEY,JSON.stringify(fullDraft));location.reload()}

  async function publish(){
    const published=runtime().getLocalPublished();published.version=2;published.pages ||= {};published.pages[pageKey()]=page
    localStorage.setItem(runtime().PUBLISHED_KEY,JSON.stringify(published))
    let remote=false
    try{
      const client=await BizScanData.getSupabaseClient();const {data:{user}}=await client.auth.getUser();if(!user)throw new Error('Accedi come amministratore')
      const {error}=await client.from('site_builder_pages').upsert({page_key:pageKey(),draft_state:page,published_state:page,updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:'page_key'})
      if(error)throw error;remote=true
    }catch(e){console.warn('Pubblicazione Supabase non disponibile',e?.message||e)}
    dirty=false;status(remote?'Pubblicato in Supabase':'Pubblicato in questo browser')
    alert(remote?'Modifiche pubblicate in Supabase':'Modifiche pubblicate localmente\nPer pubblicarle per tutti esegui la migrazione visual_builder.sql in Supabase')
  }

  function exportJson(){
    const blob=new Blob([JSON.stringify(fullDraft,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`bizscan-layout-${pageKey()}.json`;a.click();URL.revokeObjectURL(a.href)
  }
  function importJson(file){const r=new FileReader();r.onload=()=>{try{fullDraft=JSON.parse(r.result);page=fullDraft.pages?.[pageKey()]||{elements:{},orders:{}};save();location.reload()}catch{alert('File JSON non valido')}};r.readAsText(file)}

  document.addEventListener('click',e=>{
    if(e.target.closest('.ve-toolbar,.ve-panel,.ve-selection-toolbar'))return
    const el=e.target.closest('[data-ve-editable]');if(!el)return
    e.preventDefault();e.stopPropagation();select(el)
  },true)
  window.addEventListener('resize',positionSelectionToolbar)
  window.addEventListener('scroll',positionSelectionToolbar,true)
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}})

  document.addEventListener('DOMContentLoaded',()=>{
    document.body.classList.add('visual-editor-mode','ve-device-desktop')
    document.body.insertAdjacentHTML('beforeend',`
      <div class="ve-toolbar">
        <div class="ve-brand"><strong>BizScan Visual Builder</strong><span id="veStatus">Modifica qualsiasi elemento</span></div>
        <div class="ve-device-switch"><button class="active" data-device="desktop">Desktop</button><button data-device="mobile">Mobile</button></div>
        <button id="veUndo">↶</button><button id="veRedo">↷</button><button id="veExport">Esporta</button><label class="ve-import">Importa<input id="veImport" type="file" accept="application/json"></label><button id="vePreview">Preview</button><button class="ve-publish" id="vePublish">Pubblica</button>
      </div>
      <aside id="vePanel" class="ve-panel"></aside>
      <div id="veSelectionToolbar" class="ve-selection-toolbar"><button onclick="document.querySelector('#vePanel').classList.add('show')">Modifica</button><button onclick="document.querySelector('[data-move=up]')?.click()">↑</button><button onclick="document.querySelector('[data-move=down]')?.click()">↓</button></div>`)
    decorate(document)
    new MutationObserver(m=>m.forEach(x=>x.addedNodes.forEach(n=>{if(n.nodeType===1)decorate(n)}))).observe(document.body,{childList:true,subtree:true})
    document.getElementById('vePreview').onclick=()=>{sessionStorage.removeItem('bizscanVisualEditor');location.href=location.pathname+location.search.replace(/[?&]visualEditor=1/,'')+location.hash}
    document.getElementById('vePublish').onclick=publish
    document.getElementById('veUndo').onclick=undo;document.getElementById('veRedo').onclick=redo
    document.getElementById('veExport').onclick=exportJson
    document.getElementById('veImport').onchange=e=>e.target.files[0]&&importJson(e.target.files[0])
    document.querySelectorAll('[data-device]').forEach(btn=>btn.onclick=()=>{
      device=btn.dataset.device;document.querySelectorAll('[data-device]').forEach(x=>x.classList.toggle('active',x===btn));document.body.classList.toggle('ve-device-mobile',device==='mobile');document.body.classList.toggle('ve-device-desktop',device==='desktop')
    })
  })
})()
