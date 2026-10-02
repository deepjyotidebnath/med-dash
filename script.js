// Sales Dashboard (standalone). Your orders are saved in this browser (localStorage "dash_orders_v1").
// You can add orders by hand or import a CSV. Demo data lets you preview the dashboard.
const $=id=>document.getElementById(id);
const inr=n=>"₹"+Math.round(n).toLocaleString("en-IN");
const esc=s=>String(s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const KEY="dash_orders_v1",DAY=864e5;
const load=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const store=o=>{try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){toast("Could not save. Browser storage may be full or blocked.")}};
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const sameDay=(a,b)=>new Date(a).toDateString()===new Date(b).toDateString();
let charts={};
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),3200)}

// ---------- demo data ----------
const DEMO=[["Paracetamol 650","Pain & Fever",30],["Cetirizine 10 mg","Cold & Allergy",22],["Herbal Cough Syrup","Cold & Allergy",85],["ORS Electrolyte","Digestive",40],["Antacid Gel","Digestive",110],["Multivitamin","Vitamins",180],["Pain Relief Gel","Pain & Fever",95],["Antiseptic Liquid","First Aid",135],["Adhesive Bandages","First Aid",45],["Digital Thermometer","Devices",150]];
function demoOrders(){
  let a=20261002;const rnd=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const names=["Aarav Patil","Sneha Kulkarni","Rohan Deshmukh","Priya Joshi","Vikram More","Anjali Shinde","Kiran Pawar","Meera Gokhale","Sahil Jadhav","Neha Bhosale"];
  const out=[],now=Date.now(),phones=names.map(()=>"98"+Math.floor(10000000+rnd()*89999999));
  for(let d=89;d>=0;d--){
    const day=new Date(now-d*DAY),wk=[0,6].includes(day.getDay()),n=Math.floor(2+rnd()*4+(wk?2:0)+(90-d)/30);
    for(let i=0;i<n;i++){
      const items=[],used={};
      for(let x=0,k=1+Math.floor(rnd()*3);x<k;x++){const p=DEMO[Math.floor(Math.pow(rnd(),1.4)*DEMO.length)];if(used[p[0]])continue;used[p[0]]=1;items.push({n:p[0],c:p[1],q:1+Math.floor(rnd()*3),p:p[2]})}
      const sub=sum(items,t=>t.q*t.p),ci=Math.floor(rnd()*names.length),ts=new Date(day).setHours(9+Math.floor(rnd()*11),Math.floor(rnd()*60));
      out.push({id:"DM"+String(out.length+1).padStart(4,"0"),ts,name:names[ci],phone:phones[ci],pay:rnd()<.62?"upi":"cod",total:sub+(sub<499?40:0),items});
    }
  }
  return out;
}

// ---------- CSV ----------
function parseCSV(t){
  const rows=[];let r=[],f="",q=false;t=t.replace(/^\ufeff/,"");
  for(let i=0;i<t.length;i++){const c=t[i];
    if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;else if(c===","){r.push(f);f=""}
    else if(c==="\n"||c==="\r"){if(c==="\r"&&t[i+1]==="\n")i++;r.push(f);f="";if(r.some(x=>x.trim()))rows.push(r);r=[]}else f+=c}
  if(f||r.length){r.push(f);if(r.some(x=>x.trim()))rows.push(r)}
  return rows;
}
function parseDate(s){
  s=String(s).trim();let m;
  if(m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/))return new Date(+m[3],+m[2]-1,+m[1],12).getTime();
  if(m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/))return new Date(+m[1],+m[2]-1,+m[3],12).getTime();
  const t=Date.parse(s);return isNaN(t)?null:t;
}
const payKey=p=>{p=String(p||"").trim().toLowerCase();return p==="cash on delivery"||p==="cash"?"cod":p||"other"};
const payName=p=>({upi:"UPI",cod:"COD",card:"Card",other:"Other"}[p]||p.toUpperCase());
function importCSV(text){
  const rows=parseCSV(text);if(rows.length<2)return toast("The file has no rows.");
  const h=rows[0].map(x=>x.trim().toLowerCase()),col=n=>h.indexOf(n),need=["order_id","date","product","qty","price"],miss=need.filter(n=>col(n)<0);
  if(miss.length)return toast("Missing columns: "+miss.join(", ")+". Use Download CSV template.");
  const map={},bad=[];
  rows.slice(1).forEach((r,i)=>{
    const g=n=>col(n)<0?"":(r[col(n)]||"").trim(),ts=parseDate(g("date")),q=+g("qty"),p=+g("price");
    if(!g("order_id")||ts===null||!(q>0)||isNaN(p)||!g("product"))return bad.push(i+2);
    const o=map[g("order_id")]=map[g("order_id")]||{id:g("order_id"),ts,name:g("customer")||"Walk-in",phone:g("phone"),pay:payKey(g("payment")),del:0,items:[]};
    o.items.push({n:g("product"),c:g("category")||"Other",q,p});o.del+= +g("delivery")||0;
  });
  const have=new Set(load(KEY,[]).map(o=>o.id)),all=load(KEY,[]);let added=0;
  Object.values(map).forEach(o=>{if(have.has(o.id))return;o.total=sum(o.items,t=>t.q*t.p)+o.del;delete o.del;all.push(o);added++});
  store(all);$("src").value="mine";render();
  toast(added+" orders imported"+(bad.length?". Skipped "+bad.length+" invalid rows (lines "+bad.slice(0,5).join(", ")+(bad.length>5?"…":"")+")":"")+(Object.keys(map).length-added>0&&added+bad.length>=0?". Duplicates ignored.":""));
}
function toCSV(orders){
  const q=v=>'"'+String(v).replace(/"/g,'""')+'"',out=["order_id,date,customer,phone,payment,product,category,qty,price,delivery"];
  orders.forEach(o=>{const del=o.total-sum(o.items,t=>t.q*t.p);o.items.forEach((t,i)=>out.push([o.id,new Date(o.ts).toISOString().slice(0,10),o.name,o.phone,payName(o.pay),t.n,t.c,t.q,t.p,i?0:Math.max(0,del)].map(q).join(",")))});
  return out.join("\n");
}
function download(name,text){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+text],{type:"text/csv"}));a.download=name;a.click()}

// ---------- calculations ----------
const current=()=>$("src").value==="demo"?demoOrders():load(KEY,[]);
const inRange=(o,days,off)=>days===0?off===0:o.ts>=Date.now()-(days+off)*DAY&&o.ts<Date.now()-off*DAY;
const delta=(c,p)=>p?((c-p)/p*100):null;
const dTxt=d=>d===null?"":`<span class="${d>=0?"up":"down"}">${d>=0?"+":""}${d.toFixed(0)}% vs previous period</span>`;
function agg(orders){
  const prod={},cat={};
  orders.forEach(o=>o.items.forEach(i=>{const r=i.q*i.p;(prod[i.n]=prod[i.n]||{n:i.n,c:i.c,r:0,q:0});prod[i.n].r+=r;prod[i.n].q+=i.q;cat[i.c]=(cat[i.c]||0)+r}));
  return{prod,cat};
}

// ---------- render ----------
function render(){
  const demo=$("src").value==="demo",days=+$("range").value,all=current();
  $("banner").textContent=demo?"Showing demo data. Choose My orders to see your own.":
    all.length?"":"No orders yet. Add an order, import a CSV file, or choose Demo data to preview the dashboard.";
  const cur=all.filter(o=>inRange(o,days,0)),prev=days?all.filter(o=>inRange(o,days,days)):[];
  const rev=sum(cur,o=>o.total),cnt=cur.length,aov=cnt?rev/cnt:0,upi=cnt?cur.filter(o=>o.pay==="upi").length/cnt*100:0;
  const cust={};cur.forEach(o=>{const k=o.phone||o.name;cust[k]=(cust[k]||0)+1});
  const nc=Object.keys(cust).length,rep=nc?Object.values(cust).filter(x=>x>1).length/nc*100:0;
  $("kpis").innerHTML=[["Revenue",inr(rev),days?dTxt(delta(rev,sum(prev,o=>o.total))):""],["Orders",cnt,days?dTxt(delta(cnt,prev.length)):""],
    ["Average order",inr(aov),cnt?`UPI ${upi.toFixed(0)}% · Other ${(100-upi).toFixed(0)}%`:""],["Customers",nc,nc?`${rep.toFixed(0)}% ordered more than once`:""]]
    .map(k=>`<div class="kpi"><small>${k[0]}</small><b>${k[1]}</b><span>${k[2]}</span></div>`).join("");

  // revenue buckets: daily up to 92 days, otherwise monthly
  const oldest=all.length?Math.min(...all.map(o=>o.ts)):Date.now(),span=days||Math.max(1,Math.ceil((Date.now()-oldest)/DAY)+1),labels=[],vals=[];
  if(span<=92){for(let d=span-1;d>=0;d--){const t=Date.now()-d*DAY;labels.push(new Date(t).toLocaleDateString("en-IN",{day:"numeric",month:"short"}));vals.push(sum(cur.filter(o=>sameDay(o.ts,t)),o=>o.total))}}
  else{const m={};cur.sort((a,b)=>a.ts-b.ts).forEach(o=>{const d=new Date(o.ts),k=d.getFullYear()*12+d.getMonth();m[k]=m[k]||{l:d.toLocaleDateString("en-IN",{month:"short",year:"2-digit"}),v:0};m[k].v+=o.total});Object.values(m).forEach(x=>{labels.push(x.l);vals.push(x.v)})}
  const {prod,cat}=agg(cur),top=Object.values(prod).sort((a,b)=>b.r-a.r),dow=[0,0,0,0,0,0,0];
  cur.forEach(o=>dow[(new Date(o.ts).getDay()+6)%7]++);
  const css=getComputedStyle(document.documentElement),c=n=>css.getPropertyValue(n).trim();
  Chart.defaults.color=c("--mute");Chart.defaults.borderColor=c("--line");Chart.defaults.font.family="Mukta,system-ui,sans-serif";
  const pal=[c("--blue"),c("--turm"),c("--leaf"),c("--chilli"),"#7a4bb5","#2a9db5","#b4571f"],base={responsive:true,maintainAspectRatio:false};
  const draw=(id,cfg)=>{charts[id]&&charts[id].destroy();charts[id]=new Chart($(id),cfg)};
  draw("cRev",{type:"line",data:{labels,datasets:[{data:vals,borderColor:c("--blue"),backgroundColor:c("--blue")+"22",fill:true,tension:.3,pointRadius:labels.length>35?0:3}]},options:{...base,plugins:{legend:{display:false},tooltip:{callbacks:{label:x=>inr(x.parsed.y)}}},scales:{y:{beginAtZero:true,ticks:{callback:v=>inr(v)}},x:{ticks:{maxTicksLimit:8}}}}});
  draw("cCat",{type:"doughnut",data:{labels:Object.keys(cat),datasets:[{data:Object.values(cat),backgroundColor:pal,borderColor:c("--card"),borderWidth:2}]},options:{...base,cutout:"60%",plugins:{legend:{position:"bottom"},tooltip:{callbacks:{label:x=>x.label+": "+inr(x.parsed)}}}}});
  draw("cTop",{type:"bar",data:{labels:top.slice(0,6).map(t=>t.n),datasets:[{data:top.slice(0,6).map(t=>t.r),backgroundColor:c("--leaf"),borderRadius:4}]},options:{...base,indexAxis:"y",plugins:{legend:{display:false},tooltip:{callbacks:{label:x=>inr(x.parsed.x)+" · "+top[x.dataIndex].q+" sold"}}},scales:{x:{ticks:{callback:v=>inr(v)}}}}});
  draw("cDow",{type:"bar",data:{labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],datasets:[{data:dow,backgroundColor:c("--turm"),borderRadius:4}]},options:{...base,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0}}}}});

  // product performance
  const pp=agg(prev).prod,max=top.length?top[0].r:1;
  $("tProd").innerHTML=top.length?"<tr><th>Product</th><th>Category</th><th class='n'>Units</th><th class='n'>vs previous</th><th class='n'>Revenue</th><th>Share</th></tr>"+top.slice(0,10).map(t=>{
    const d=days&&pp[t.n]?delta(t.q,pp[t.n].q):null;
    return`<tr><td>${esc(t.n)}</td><td>${esc(t.c)}</td><td class="n">${t.q}</td><td class="n">${d===null?"–":`<span class="${d>=0?"up":"down"}">${d>=0?"+":""}${d.toFixed(0)}%</span>`}</td><td class="n">${inr(t.r)}</td><td><span class="bar-s" style="width:${Math.max(4,t.r/max*70)}px"></span>${(t.r/rev*100).toFixed(0)}%</td></tr>`}).join(""):'<tr><td class="empty">No sales in this period.</td></tr>';
  // recent orders
  const rec=[...cur].sort((a,b)=>b.ts-a.ts).slice(0,8);
  $("tOrders").innerHTML=rec.length?"<tr><th>Order</th><th>Date</th><th>Customer</th><th>Phone</th><th>Items</th><th>Payment</th><th class='n'>Total</th>"+(demo?"":"<th></th>")+"</tr>"+
    rec.map(o=>`<tr><td>${esc(o.id)}</td><td>${new Date(o.ts).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</td><td>${esc(o.name)}</td><td>${o.phone?"xxxxxx"+esc(String(o.phone).slice(-4)):"–"}</td><td title="${esc(o.items.map(i=>i.n+" × "+i.q).join(", "))}">${sum(o.items,i=>i.q)}</td><td>${payName(o.pay)}</td><td class="n">${inr(o.total)}</td>${demo?"":`<td><button class="sm bad" data-del="${esc(o.id)}">Delete</button></td>`}</tr>`).join(""):'<tr><td class="empty">No orders in this period.</td></tr>';
}

// ---------- add order ----------
function addDlg(){
  const today=new Date().toISOString().slice(0,10);let lines=[{n:"",c:"",q:1,p:0}];
  $("dlgBody").innerHTML=`<div class="r"><h2>Add order</h2><button class="x" data-close aria-label="Close">×</button></div>
    <div class="two"><label>Customer<input class="f" id="aN" placeholder="Name"></label><label>Phone<input class="f" id="aP" inputmode="numeric" maxlength="10"></label></div>
    <div class="two"><label>Date<input class="f" id="aD" type="date" value="${today}"></label><label>Payment<select class="f" id="aPay"><option value="upi">UPI</option><option value="cod">Cash on delivery</option><option value="card">Card</option><option value="other">Other</option></select></label></div>
    <label>Delivery charge (₹)<input class="f" id="aDel" type="number" min="0" value="0"></label>
    <div class="r4 note"><span>Product</span><span>Category</span><span>Qty</span><span>Price</span></div><div id="aL"></div>
    <button class="sm" id="aAdd">Add product line</button><p class="note">Order total: <b id="aT">₹0</b></p><button class="cta" id="aSave">Save order</button>`;
  const draw=()=>{$("aL").innerHTML=lines.map((l,i)=>`<div class="r4" style="margin-bottom:6px"><input class="f" data-i="${i}" data-k="n" value="${esc(l.n)}" aria-label="Product"><input class="f" data-i="${i}" data-k="c" value="${esc(l.c)}" aria-label="Category"><input class="f" type="number" min="1" data-i="${i}" data-k="q" value="${l.q}" aria-label="Quantity"><input class="f" type="number" min="0" data-i="${i}" data-k="p" value="${l.p}" aria-label="Price"></div>`).join("");tot()};
  const tot=()=>$("aT").textContent=inr(sum(lines,l=>l.q*l.p)+(+$("aDel").value||0));
  $("aL").addEventListener("input",e=>{const i=e.target.dataset.i;if(i===undefined)return;const k=e.target.dataset.k;lines[i][k]=k==="n"||k==="c"?e.target.value:Math.max(0,+e.target.value||0);tot()});
  $("aDel").oninput=tot;$("aAdd").onclick=()=>{lines.push({n:"",c:"",q:1,p:0});draw()};
  $("aSave").onclick=()=>{
    const ls=lines.filter(l=>l.n.trim()&&l.q>0);if(!ls.length)return toast("Add at least one product with a name and quantity.");
    const ts=parseDate($("aD").value);if(ts===null)return toast("Choose a valid date.");
    const all=load(KEY,[]),n=all.reduce((m,o)=>{const x=/^ORD(\d+)$/.exec(o.id);return x?Math.max(m,+x[1]):m},0)+1;
    all.push({id:"ORD"+String(n).padStart(4,"0"),ts,name:$("aN").value.trim()||"Walk-in",phone:$("aP").value.trim(),pay:$("aPay").value,total:sum(ls,l=>l.q*l.p)+(+$("aDel").value||0),items:ls.map(l=>({n:l.n.trim(),c:l.c.trim()||"Other",q:l.q,p:l.p}))});
    store(all);$("dlg").close();$("src").value="mine";render();toast("Order saved");
  };
  draw();$("dlg").showModal();
}

// ---------- events ----------
$("range").onchange=$("src").onchange=render;
$("add").onclick=addDlg;
$("imp").onclick=()=>$("file").click();
$("file").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>importCSV(String(r.result));r.readAsText(f);e.target.value=""};
$("csv").onclick=()=>{const o=current();if(!o.length)return toast("There are no orders to export yet.");download("orders.csv",toCSV(o))};
$("tpl").onclick=()=>download("orders-template.csv","order_id,date,customer,phone,payment,product,category,qty,price,delivery\nORD0001,2026-10-01,Aarav Patil,9876543210,UPI,Paracetamol 650,Pain & Fever,2,30,40\nORD0001,2026-10-01,Aarav Patil,9876543210,UPI,ORS Electrolyte,Digestive,1,40,0\nORD0002,02/10/2026,Sneha Kulkarni,9123456780,COD,Multivitamin,Vitamins,1,180,40");
$("clr").onclick=()=>{if(confirm("Delete all orders saved in this browser? Export a CSV first if you need a backup.")){store([]);render();toast("Orders cleared")}};
document.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.close!==undefined)$("dlg").close();
  if(t.dataset.del&&confirm("Delete order "+t.dataset.del+"?")){store(load(KEY,[]).filter(o=>o.id!==t.dataset.del));render()}
});
matchMedia("(prefers-color-scheme:dark)").addEventListener("change",render);
if(!load(KEY,[]).length)$("src").value="demo";
render();
