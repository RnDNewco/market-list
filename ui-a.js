function switchScreen(name){
  currentScreen=name; document.querySelectorAll(".screen").forEach(x=>x.classList.toggle("active",x.id===`screen-${name}`)); document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.screen===name));
  $("screenTitle").textContent=name==="list"?"Η λίστα μου":name==="add"?"Προσθήκη":"Αγορές"; if(name==="history")renderHistoryScreen();
}
function renderTheme(){document.body.classList.toggle("dark",state.theme==="dark");document.body.classList.toggle("shopping-mode",!!state.shopping);$("themeToggleBtn").textContent=state.theme==="dark"?"☀️ Light mode":"🌙 Dark mode";}
function renderInstall(){
  const standalone=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
  if(standalone){$("installCard").classList.add("hidden");return;}
  $("installCard").classList.remove("hidden");
  const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  if(isiOS){$("installHelp").textContent="Στο Safari: Share → Add to Home Screen.";$("installBtn").textContent="Οδηγίες";}
  else if(deferredInstall){$("installHelp").textContent="Η εφαρμογή είναι έτοιμη για εγκατάσταση.";$("installBtn").textContent="Install app";}
  else{$("installHelp").textContent="Στο Chrome: menu → Install app / Add to Home screen.";$("installBtn").textContent="Install app";}
}
function renderSummary(){
  const need=state.items.filter(x=>x.status==="need"),done=state.items.filter(x=>x.status==="done");
  $("needCount").textContent=need.length;$("cartTotal").textContent=euro(cartTotal());$("listEstimate").textContent=euro(needTotal());$("budgetMetric").textContent=euro(state.budget);
  $("shoppingSummary").textContent=`${done.length}/${need.length+done.length} αγορασμένα · ${euro(cartTotal())}`;
  $("shoppingBanner").classList.toggle("hidden",!state.shopping);
}
function renderWeekly(){
  const sug=buildSuggestions(); selectedSuggestions=new Set([...selectedSuggestions].filter(id=>sug.some(s=>s.p.id===id)));
  for(const s of sug){if(s.group==="high"&&!selectedSuggestions.has(s.p.id))selectedSuggestions.add(s.p.id);}
  const groups=[{k:"high",t:"Πολύ πιθανό"},{k:"likely",t:"Πιθανό"},{k:"check",t:"Έλεγξε αν έχεις"}];
  $("weeklySuggestions").innerHTML=groups.map(g=>{
    const arr=sug.filter(s=>s.group===g.k);if(!arr.length)return "";
    return `<div class="suggest-group"><h3>${g.t}</h3>${arr.map(s=>`<label class="suggest-row"><input type="checkbox" data-suggest="${s.p.id}" ${selectedSuggestions.has(s.p.id)?"checked":""}><span><b>${s.p.icon} ${s.p.name}</b><small>${s.reason}</small></span><span class="suggest-qty">×${s.qty}</span></label>`).join("")}</div>`;
  }).join("")||'<div class="empty">Μόλις έχεις λίγο ιστορικό αγορών, οι προτάσεις θα γίνουν πιο ακριβείς.</div>';
}
function renderStockWarnings(){
  const rows=[];
  for(const p of allProducts()){
    const inv=state.inventory[p.id]; if(!inv?.track)continue;
    if(inv.qty<=inv.threshold)rows.push({p,inv});
  }
  $("stockWarningsCard").classList.toggle("hidden",!rows.length);$("stockWarningCount").textContent=rows.length;
  $("stockWarnings").innerHTML=rows.map(({p,inv})=>`<div class="stock-row"><div><b>${p.icon} ${p.name}</b><small>stock ${inv.qty} · όριο ${inv.threshold}</small></div><div class="stock-actions"><button data-stock-dec="${p.id}">−</button><button data-stock-inc="${p.id}">+</button><button class="btn secondary compact" data-stock-add="${p.id}">στη λίστα</button></div></div>`).join("");
}
function listRows(){
  if(state.shopping)return state.items.filter(x=>x.status==="need"||x.status==="done");
  return state.items.filter(x=>x.status===listFilter);
}
function renderShoppingList(){
  const vis=listRows(); let html="";
  for(const cat of CATEGORIES){
    const arr=vis.filter(x=>x.category===cat);if(!arr.length)continue;
    html+=`<section class="list-group"><div class="group-head"><span>${cat}</span><span class="count-pill">${arr.length}</span></div>`;
    for(const x of arr){
      html+=`<div class="shopping-row ${x.status==="done"?"done":""}" data-swipe="${x.id}">
        <input class="check" type="checkbox" data-check="${x.id}" ${x.status==="done"?"checked":""}>
        <div data-edit="${x.id}"><div class="item-name">${x.name}</div><div class="item-meta">${x.unitPrice!=null?`${x.qty} ${x.unit} × ${euro(x.unitPrice)}`:`${x.qty} ${x.unit} · χωρίς τιμή`}</div>
          <div class="qty-inline"><button data-qty="${x.id}" data-d="-1">−</button><span>${x.qty}</span><button data-qty="${x.id}" data-d="1">+</button>${state.shopping?`<input class="price-inline" data-price="${x.id}" type="number" min="0" step="0.01" value="${x.unitPrice??""}" placeholder="€">`:""}</div>
        </div>
        <div class="item-side"><span class="line-total">${x.unitPrice!=null?euro(itemTotal(x)):"—"}</span><button class="row-btn" data-edit="${x.id}">⋯</button></div>
      </div>`;
    }
    html+="</section>";
  }
  $("shoppingList").innerHTML=html||'<section class="card empty">Η λίστα είναι άδεια.</section>';
  document.querySelectorAll(".seg").forEach(b=>b.classList.toggle("active",b.dataset.listFilter===listFilter));
}
function renderCatalog(){
  const q=norm($("catalogSearch").value);let arr=allProducts();
  if(catalogCategory==="Συχνά")arr=arr.filter(p=>p.hot||historyStats(p).visits>0||state.pins.includes(p.id)).sort((a,b)=>(state.pins.includes(b.id)-state.pins.includes(a.id))+(historyStats(b).visits-historyStats(a).visits));
  else if(catalogCategory!=="Όλα")arr=arr.filter(p=>p.cat===catalogCategory);
  if(q)arr=arr.filter(p=>norm(p.name).includes(q)||norm(p.family).includes(q));
  $("catalogCount").textContent=arr.length;
  $("catalogCategories").innerHTML=["Συχνά","Όλα",...CATEGORIES.filter(c=>c!=="Άλλο")].map(c=>`<button class="chip ${c===catalogCategory?"active":""}" data-cat="${c}">${c}</button>`).join("");
  $("catalogGrid").innerHTML=arr.map(p=>{
    const inList=activeNeed(p.id),stats=priceStats(p.id);return `<div class="product-card ${state.pins.includes(p.id)?"pinned":""}"><div class="product-icon">${p.icon}</div><div><div class="product-name">${p.name}</div><div class="product-meta">${stats?`τελευταία ${euro(stats.last)}`:(p.seed!=null?`ενδεικτικά ${euro(p.seed)}`:"χωρίς τιμή")}${inList?` · στη λίστα ×${inList.qty}`:""}</div><button class="pin-btn" data-pin="${p.id}">${state.pins.includes(p.id)?"★":"☆"} pin</button></div><button class="add-circle" data-add="${p.id}">+</button></div>`;
  }).join("")||'<div class="empty">Δεν βρέθηκε προϊόν.</div>';
}
