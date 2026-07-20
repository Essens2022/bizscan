const SUPABASE_URL="https://fafedftoyztptdiubjmx.supabase.co";
const SUPABASE_KEY="sb_publishable_Xv8QeF_A5ShMEqhxqB1jgQ_mLZGx5KJ";
let _client;

async function getSupabaseClient(){
  if(_client)return _client;
  const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  _client=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return _client;
}
function riskMeta(score){const s=Number(score)||0;if(s<50)return{label:"Rischio basso",color:"green"};if(s<70)return{label:"Rischio medio",color:"amber"};return{label:"Rischio alto",color:"red"}}
function visualFor(row,i=0){const seed=String(row.category_id||row.category?.slug||row.id||i);let hash=0;for(let n=0;n<seed.length;n++)hash=((hash<<5)-hash+seed.charCodeAt(n))|0;return["vp","vm","va","vb"][Math.abs(hash)%4]}
function mapAnalysis(row,i=0){
  const r=riskMeta(row.risk_score),cat=row.category||row.categories||{};
  const attachments=Array.isArray(row.attachments)?row.attachments:[];
  const cover=attachments.find(a=>a&&a.type==="cover"&&a.file_url);
  return {...row,attachments,coverUrl:cover?.file_url||"",category:cat.name||"",categorySlug:cat.slug||"",categoryEmoji:cat.emoji||"",risk:Number(row.risk_score)||0,score:Number(row.bizscan_score)||0,riskLabel:r.label,riskColor:r.color,visual:visualFor(row,i),investment:row.investment_display||"",profit:row.profit_display||row.profit_level||"",payback:row.payback_display||"",summary:row.short_description||"",price:Number(row.price??1.99),emoji:row.emoji||cat.emoji||"📊",verdictLabel:{conviene:"Conviene",dipende:"Dipende",non_conviene:"Non conviene"}[row.verdict]||"Analisi BizScan"};
}
async function fetchPublishedAnalyses(){const c=await getSupabaseClient();const{data,error}=await c.rpc("public_list_analyses");if(error)throw error;return(data||[]).map(mapAnalysis)}
async function fetchAttachments(analysisId){const c=await getSupabaseClient();const{data,error}=await c.from("attachments").select("id,analysis_id,type,file_url,file_name,mime_type,file_size_bytes,order_index").eq("analysis_id",analysisId).order("order_index");if(error)throw error;return data||[]}
async function fetchAnalysisBySlug(slug){const c=await getSupabaseClient();const{data,error}=await c.rpc("public_get_analysis_by_slug",{p_slug:slug});if(error)throw error;if(!data)return null;let row=data;try{if(row.id&&(!Array.isArray(row.attachments)||!row.attachments.length))row={...row,attachments:await fetchAttachments(row.id)}}catch(e){console.warn("BizScan attachments fallback",e)}return mapAnalysis(row)}
async function fetchCategories(){const c=await getSupabaseClient();const{data,error}=await c.from("categories").select("id,name,slug,emoji,color,description,order_index").eq("is_active",true).order("order_index");if(error)throw error;return data||[]}
async function fetchPlans(){const c=await getSupabaseClient();const{data,error}=await c.from("plans").select("id,type,title,description,price,currency,analysis_limit,pdf_credits,billing_interval,order_index").eq("is_active",true).order("order_index");if(error)throw error;return data||[]}
async function session(){const c=await getSupabaseClient();const{data,error}=await c.auth.getSession();if(error)throw error;return data.session}
async function currentUser(){return(await session())?.user||null}
async function fetchFavorites(){const c=await getSupabaseClient();const u=await currentUser();if(!u)return[];const{data,error}=await c.from("favorites").select("analysis_id,analyses(slug)").eq("user_id",u.id);if(error)throw error;return(data||[]).map(x=>x.analyses?.slug).filter(Boolean)}
async function setFavorite(analysisId,enabled){const c=await getSupabaseClient();const u=await currentUser();if(!u)throw new Error("AUTH_REQUIRED");if(enabled){const{error}=await c.from("favorites").upsert({user_id:u.id,analysis_id:analysisId},{onConflict:"user_id,analysis_id"});if(error)throw error}else{const{error}=await c.from("favorites").delete().eq("user_id",u.id).eq("analysis_id",analysisId);if(error)throw error}}
async function accessSummary(){const c=await getSupabaseClient();const u=await currentUser();if(!u)return{authenticated:false,credits:0,available_credits:0,available_pdf_credits:0,plan:'free',unlocked_analyses:0,subscription_active:false,unlocked:[],unlocked_tools:['score','investimento','rischio','rientro']};const[{data:s,error:e1},{data:urows,error:e2}]=await Promise.all([c.rpc("get_my_access_summary"),c.from("analysis_unlocks").select("analysis_id,source,expires_at,analyses(slug,title,emoji)").eq("user_id",u.id)]);if(e1)throw e1;if(e2)throw e2;const summary=Array.isArray(s)?s[0]:(s||{});const availCredits=Number(summary.available_credits??summary.credits??0);return{authenticated:true,credits:availCredits,available_credits:availCredits,available_pdf_credits:Number(summary.available_pdf_credits??0),plan:summary.plan||'free',unlocked_analyses:Number(summary.unlocked_analyses??0),subscription_active:Boolean(summary.has_active_subscription??summary.subscription_active),has_active_subscription:Boolean(summary.has_active_subscription??summary.subscription_active),subscription_end:summary.subscription_end||null,unlocked:urows||[],unlocked_tools:Array.isArray(summary.unlocked_tools)?summary.unlocked_tools:['score','investimento','rischio','rientro']}}
async function hasAccess(analysisId){const c=await getSupabaseClient();const u=await currentUser();if(!u)return false;const{data,error}=await c.rpc("has_analysis_access",{p_analysis_id:analysisId});if(error)throw error;return Boolean(data)}
async function unlockWithCredit(analysisId){const c=await getSupabaseClient();const{data,error}=await c.rpc("unlock_analysis_with_credit",{p_analysis_id:analysisId});if(error)throw error;return data}
async function fetchSections(analysisId){const c=await getSupabaseClient();const{data,error}=await c.rpc("get_analysis_sections",{p_analysis_id:analysisId});if(error)throw error;return data||[]}
function storagePath(att){const value=String(att?.file_url||"");if(!value)return"";if(!/^https?:/i.test(value))return value;const marker="/storage/v1/object/public/bizscan-public/";const i=value.indexOf(marker);return i>=0?decodeURIComponent(value.slice(i+marker.length)):""}

async function requestPdfAccess(attachmentId){
  const c=await getSupabaseClient();
  const{data,error}=await c.rpc("request_pdf_access",{p_attachment_id:attachmentId});
  if(error)throw error;
  return Array.isArray(data)?data[0]:(data||{});
}
async function getPdfAccessStatus(attachmentId){
  const c=await getSupabaseClient();
  const{data,error}=await c.rpc("get_pdf_access_status",{p_attachment_id:attachmentId});
  if(error)throw error;
  return Array.isArray(data)?data[0]:(data||{});
}
async function savePdfAccessRule(attachmentId,isFree,allowedPlans){
  const c=await getSupabaseClient();
  const{data,error}=await c.rpc("admin_set_pdf_access_rule",{p_attachment_id:attachmentId,p_is_free:Boolean(isFree),p_allowed_plan_types:allowedPlans||[]});
  if(error)throw error;return data;
}
async function signedAttachmentUrl(att,expires=900){if(!att)return null;if(att.type!=="pdf"&&/^https?:/i.test(att.file_url||""))return att.file_url;const path=storagePath(att);if(!path)throw new Error("Percorso allegato non valido");const c=await getSupabaseClient();const{data,error}=await c.storage.from(att.type==="pdf"?"bizscan-private":"bizscan-public").createSignedUrl(path,expires);if(error)throw error;return data.signedUrl}
async function fetchHeroMedia(){const c=await getSupabaseClient();const{data,error}=await c.rpc("public_list_hero_media");if(error)throw error;return data||[]}
async function fetchHeroPhrases(){const c=await getSupabaseClient();const{data,error}=await c.rpc("public_list_hero_phrases");if(error)throw error;return data||[]}
window.BizScanData={getSupabaseClient,fetchPublishedAnalyses,fetchAnalysisBySlug,fetchAttachments,fetchCategories,fetchPlans,session,currentUser,fetchFavorites,setFavorite,accessSummary,hasAccess,unlockWithCredit,fetchSections,requestPdfAccess,getPdfAccessStatus,savePdfAccessRule,signedAttachmentUrl,fetchHeroMedia,fetchHeroPhrases};
