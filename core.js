function allProducts(){return [...CATALOG,...(state.custom||[])];}
function productById(id){return allProducts().find(p=>p.id===id)||null;}
function productForLine(line){return productById(line.productId)||findProduct(line.name);}
function findProduct(text){
  const n=norm(text); let best=null,score=0;
  for(const p of allProducts()){
    const terms=[p.name,p.family||""].map(norm);
    for(const t of terms){
      const s=n===t?100:(t&&n&&(t.includes(n)||n.includes(t))?Math.min(t.length,n.length):0);
      if(s>score){score=s;best=p;}
    }
  }
  return score>=3?best:null;
}
function ensureCustom(name,cat="Άλλο",price=null){
  const found=findProduct(name); if(found)return found;
  const p={id:`custom_${uid()}`,name:String(name).trim(),cat,icon:"🛒",seed:price===""?null:Number(price)||null,hot:false,family:`custom_${norm(name).replace(/\s+/g,"_")}`,stockable:false,threshold:1,defaultQty:1,custom:true};
  state.custom.push(p); return p;
}
function normalizeItem(x){
  const p=productById(x.productId)||findProduct(x.name)||null;
  let status=x.status||"need";
  if(status==="now")status="need";
  if(status==="home")status="need";
  return {id:x.id||uid(),productId:x.productId||p?.id||null,name:x.name||p?.name||"Προϊόν",category:x.category||p?.cat||"Άλλο",status:["need","later","done"].includes(status)?status:"need",qty:Math.max(.01,Number(x.qty)||1),unit:x.unit||"τεμ.",unitPrice:x.unitPrice??x.price??p?.seed??null,addedAt:x.addedAt||new Date().toISOString()};
}
function migrate(raw){
  const next={...defaultState(),...raw,version:2};
  next.items=(raw.items||[]).map(normalizeItem);
  next.custom=Array.isArray(raw.custom)?raw.custom:(Array.isArray(raw.customProducts)?raw.customProducts:[]);
  next.pins=Array.isArray(raw.pins)?raw.pins:[];
  next.inventory=raw.inventory&&typeof raw.inventory==="object"?raw.inventory:{};
  for(const x of raw.items||[]){
    if(x.status==="home"){
      const p=productById(x.productId)||findProduct(x.name);
      if(p)next.inventory[p.id]={track:true,qty:Number(x.stock??x.qty??0)||0,threshold:Number(x.threshold??p.threshold??1)||1};
    }
  }
  return next;
}

function openDB(){return new Promise((resolve,reject)=>{if(!("indexedDB" in window)){resolve(null);return;}const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function dbSave(snapshot){const db=await openDB();if(!db)return;await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,"readwrite");tx.objectStore(DB_STORE).put(snapshot,DB_KEY);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}
async function dbLoad(){const db=await openDB();if(!db)return null;const value=await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,"readonly");const r=tx.objectStore(DB_STORE).get(DB_KEY);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});db.close();return value;}
function setSaveUI(mode){$("saveDot").classList.remove("saving","error");if(mode==="saving"){$("saveDot").classList.add("saving");$("saveText").textContent="Αποθήκευση…";}else if(mode==="error"){$("saveDot").classList.add("error");$("saveText").textContent="Σφάλμα";}else $("saveText").textContent="Αποθηκεύτηκε";}
function save(){
  state.lastSaved=new Date().toISOString(); setSaveUI("saving");
  const snapshot=JSON.parse(JSON.stringify(state));
  try{localStorage.setItem(LOCAL_KEY,JSON.stringify(snapshot));dbSave(snapshot).then(()=>setSaveUI("saved")).catch(()=>setSaveUI("saved"));}catch{setSaveUI("error");}
}
async function hydrate(){
  let best=null;
  try{
    const local=JSON.parse(localStorage.getItem(LOCAL_KEY)||"null"); const db=await dbLoad();
    best=db||local;
    if(db&&local&&db.lastSaved&&local.lastSaved)best=new Date(db.lastSaved)>new Date(local.lastSaved)?db:local;
    if(!best){for(const k of LEGACY_KEYS){const x=JSON.parse(localStorage.getItem(k)||"null");if(x){best=x;break;}}}
  }catch{}
  state=best?migrate(best):defaultState(); ensureInventoryDefaults(); renderAll(); save();
}
function ensureInventoryDefaults(){
  for(const p of allProducts()){
    if(p.stockable&&!state.inventory[p.id])state.inventory[p.id]={track:false,qty:0,threshold:p.threshold||1};
  }
}

function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),1800);}
function showUndo(msg,snapshot){undoSnapshot=snapshot;$("undoText").textContent=msg;$("undoBar").classList.remove("hidden");clearTimeout(undoTimer);undoTimer=setTimeout(()=>{$("undoBar").classList.add("hidden");undoSnapshot=null;},5000);}
function activeNeed(productId){return state.items.find(x=>x.productId===productId&&x.status==="need")||null;}
function itemTotal(x){return (Number(x.qty)||0)*(Number(x.unitPrice)||0);}
function cartTotal(){return state.items.filter(x=>x.status==="done").reduce((s,x)=>s+itemTotal(x),0);}
function needTotal(){return state.items.filter(x=>x.status==="need").reduce((s,x)=>s+itemTotal(x),0);}

function priceStats(productId){
  const arr=(state.priceHistory[productId]||[]).map(x=>Number(x.netUnitPrice??x.unitPrice)).filter(Number.isFinite);
  if(!arr.length)return null;
  return {last:arr[arr.length-1],min:Math.min(...arr),avg:arr.reduce((a,b)=>a+b,0)/arr.length,count:arr.length};
}
function historyStats(product){
  const visits=[]; const quantities=[]; const dates=[];
  for(const h of state.history){
    let qty=0,found=false;
    for(const l of h.lines||[]){
      const lp=productForLine(l); if(!lp)continue;
      if(lp.id===product.id || (lp.family&&product.family&&lp.family===product.family)){found=true;qty+=Number(l.qty)||1;}
    }
    if(found){visits.push(h);quantities.push(qty);if(h.date)dates.push(h.date);}
  }
  const recent=state.history.slice(-3).filter(h=>(h.lines||[]).some(l=>{const lp=productForLine(l);return lp&&(lp.id===product.id||(lp.family&&product.family&&lp.family===product.family));})).length;
  const avgQty=quantities.length?quantities.reduce((a,b)=>a+b,0)/quantities.length:(product.defaultQty||1);
  return {visits:visits.length,recent,last:dates.length?dates[dates.length-1]:null,avgQty};
}
function suggestedQty(p,hs){
  const inv=state.inventory[p.id];
  if(inv?.track&&inv.qty<=inv.threshold)return Math.max(1,Math.round(Math.max(p.defaultQty||1,(inv.threshold*2)-inv.qty)));
  return Math.max(1,Math.round(hs.avgQty||p.defaultQty||1));
}
function buildSuggestions(){
  const out=[]; const seenFamilies=new Set();
  const needFamilies=new Set(state.items.filter(x=>x.status==="need").map(x=>productById(x.productId)?.family).filter(Boolean));
  for(const p of allProducts()){
    const family=p.family||p.id;
    if(seenFamilies.has(family))continue;
    seenFamilies.add(family);
    if(activeNeed(p.id)||needFamilies.has(family))continue;
    const hs=historyStats(p); const inv=state.inventory[p.id];
    let score=0,reason="";
    if(inv?.track&&inv.qty<=inv.threshold){score+=120;reason=`χαμηλό stock (${inv.qty}, όριο ${inv.threshold})`;}
    score+=hs.recent*45+hs.visits*8+(p.hot?6:0)+(state.pins.includes(p.id)?15:0);
    if(!reason&&hs.recent>=2)reason=`αγοράστηκε σε ${hs.recent}/3 τελευταίες αγορές`;
    else if(!reason&&hs.last)reason=`τελευταία αγορά πριν ${Math.max(1,Math.round(daysSince(hs.last)))} ημέρες`;
    else if(!reason&&p.hot)reason="συχνή δική σου επιλογή";
    if(score<=0)continue;
    let group="likely";
    if(score>=80)group="high";
    if(inv?.track&&inv.qty>inv.threshold)group="check";
    if(hs.visits===0&&p.hot&&score<20)group="check";
    out.push({p,score,group,reason,qty:suggestedQty(p,hs)});
  }
  return out.sort((a,b)=>b.score-a.score).slice(0,18);
}

function addItem(productOrName,{qty=1,unit="τεμ.",price=null,status="need",category="Άλλο"}={}){
  const p=typeof productOrName==="string"?(findProduct(productOrName)||ensureCustom(productOrName,category,price)):productOrName;
  if(!p||!p.name){toast("Γράψε προϊόν.");return false;}
  const existing=state.items.find(x=>x.productId===p.id&&x.status===status);
  const q=Math.max(.01,Number(qty)||1); const usePrice=price===""||price==null?(priceStats(p.id)?.last??p.seed??null):Number(price);
  if(existing){existing.qty=(Number(existing.qty)||1)+q;if(usePrice!=null)existing.unitPrice=usePrice;}
  else state.items.unshift({id:uid(),productId:p.id,name:p.name,category:p.cat,status,qty:q,unit,unitPrice:usePrice,addedAt:new Date().toISOString()});
  save();renderAll();toast(existing?`${p.name}: ποσότητα ${existing.qty}`:`Προστέθηκε: ${p.name}`);return true;
}
function parseMulti(text){
  return String(text||"").split(/[\n,;]+/).map(s=>s.trim()).filter(Boolean).map(raw=>{
    let name=raw,qty=1; let m=raw.match(/^(.+?)\s*[x×]\s*(\d+(?:[.,]\d+)?)$/i);
    if(m){name=m[1].trim();qty=parseFloat(m[2].replace(",","."));}
    else {m=raw.match(/^(\d+(?:[.,]\d+)?)\s*[x×]\s*(.+)$/i);if(m){qty=parseFloat(m[1].replace(",","."));name=m[2].trim();}}
    return {name,qty};
  });
}

