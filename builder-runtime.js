(() => {
  const VERSION = 1
  const PUBLISHED_KEY = 'bizscanVisualPublishedV2'
  const pageKey = (() => {
    const name = location.pathname.split('/').pop() || 'index.html'
    return name.replace(/\.html$/,'') || 'index'
  })()

  const parse = value => {
    try { return JSON.parse(value || '{}') || {} } catch { return {} }
  }
  const localPublished = parse(localStorage.getItem(PUBLISHED_KEY))
  let remotePublished = null

  function stateForPage(state){
    return state?.pages?.[pageKey] || {elements:{}, orders:{}}
  }

  function safeCssEscape(value){
    if(window.CSS?.escape) return CSS.escape(value)
    return String(value).replace(/[^a-zA-Z0-9_-]/g,'\\$&')
  }

  function applyElement(el, config){
    if(!el || !config) return
    if(config.text !== undefined){
      if(el.matches('input,textarea')) el.value = config.text
      else el.textContent = config.text
    }
    if(config.placeholder !== undefined && el.matches('input,textarea')) el.placeholder = config.placeholder
    if(config.src && el.matches('img')) el.src = config.src
    if(config.href && el.matches('a')) el.href = config.href
    if(config.styles) Object.assign(el.style, config.styles)
    el.classList.toggle('ve-hidden-desktop', Boolean(config.hiddenDesktop))
    el.classList.toggle('ve-hidden-mobile', Boolean(config.hiddenMobile))
    el.classList.toggle('ve-builder-hidden', Boolean(config.hidden))
  }

  function applyOrders(page){
    Object.entries(page.orders || {}).forEach(([containerId, ids]) => {
      const container = document.querySelector(`[data-ve-id="${safeCssEscape(containerId)}"]`)
      if(!container) return
      ids.forEach(id => {
        const child = container.querySelector(`:scope > [data-ve-id="${safeCssEscape(id)}"]`)
        if(child) container.appendChild(child)
      })
    })
  }

  function applyState(state){
    const page = stateForPage(state)
    Object.entries(page.elements || {}).forEach(([id, config]) => {
      const el = document.querySelector(`[data-ve-id="${safeCssEscape(id)}"]`)
      applyElement(el, config)
    })
    applyOrders(page)
  }

  function applyAll(){
    assignStableIds(document)
    applyState(localPublished)
    if(remotePublished) applyState(remotePublished)
  }

  function slug(text){
    return String(text||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)
  }

  function elementRole(el){
    const known = [...el.classList].filter(c => !c.startsWith('ve-')).slice(0,2).join('.')
    return `${el.tagName.toLowerCase()}${known?'.'+known:''}`
  }

  function stableToken(el){
    if(el.id && !el.id.startsWith('ve')) return `id-${slug(el.id)}`
    if(el.dataset.editId) return `edit-${slug(el.dataset.editId)}`
    if(el.matches('article,.business-card,.plan')){
      const title=el.querySelector('h1,h2,h3,.plan-name')?.textContent
      if(title) return `card-${slug(title)}`
    }
    if(el.matches('section,main,header,nav,aside')){
      const title=el.querySelector(':scope > h1,:scope > h2,:scope > h3,:scope > div > h1,:scope > div > h2')?.textContent
      const cls=[...el.classList].find(c=>!c.startsWith('ve-'))
      if(cls) return `${el.tagName.toLowerCase()}-${slug(cls)}${title?'-'+slug(title):''}`
    }
    return ''
  }

  function makeId(el){
    if(el.dataset.veId) return el.dataset.veId
    const chain=[]
    let node=el
    while(node && node!==document.body){
      const stable=stableToken(node)
      if(stable){ chain.unshift(stable); break }
      const parent=node.parentElement
      if(!parent) break
      const peers=[...parent.children].filter(x=>x.tagName===node.tagName)
      chain.unshift(`${elementRole(node)}-${peers.indexOf(node)+1}`)
      node=parent
      if(chain.length>5) break
    }
    return `${pageKey}:${chain.join('/')}`
  }

  function assignStableIds(root=document){
    const selector='header,main,nav,aside,section,article,.panel,.business-card,.plan,.hero-stats>div,.kpi,.insight,.category-card,h1,h2,h3,h4,h5,h6,p,small,strong,b,em,span,label,li,button,a,input,textarea,img,th,td'
    const all=[]
    if(root.nodeType===1 && root.matches?.(selector)) all.push(root)
    root.querySelectorAll?.(selector).forEach(el=>all.push(el))
    all.forEach(el=>{
      if(el.closest('.ve-toolbar,.ve-panel,.ve-selection-toolbar')) return
      if(!el.dataset.veId) el.dataset.veId=makeId(el)
    })
  }

  async function loadRemote(){
    try{
      if(!window.BizScanData?.getSupabaseClient) return
      const client=await BizScanData.getSupabaseClient()
      const {data,error}=await client.from('site_builder_pages').select('page_key,published_state').eq('page_key',pageKey).maybeSingle()
      if(error) return
      if(data?.published_state){
        remotePublished={version:VERSION,pages:{[pageKey]:data.published_state}}
        applyAll()
      }
    }catch(e){ console.info('Visual Builder remote state unavailable',e?.message||e) }
  }

  window.BizScanBuilderRuntime={
    VERSION,pageKey,PUBLISHED_KEY,assignStableIds,applyState,applyElement,stateForPage,applyAll,
    getLocalPublished:()=>parse(localStorage.getItem(PUBLISHED_KEY)),
    setLocalPublished:state=>{localStorage.setItem(PUBLISHED_KEY,JSON.stringify(state));location.reload()}
  }

  document.addEventListener('DOMContentLoaded',()=>{
    assignStableIds(document)
    applyAll()
    const observer=new MutationObserver(muts=>{
      let changed=false
      muts.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1){assignStableIds(n);changed=true}}))
      if(changed) requestAnimationFrame(applyAll)
    })
    observer.observe(document.body,{childList:true,subtree:true})
    loadRemote()
  })
})()
