(function(){
const $=s=>document.querySelector(s),z=n=>String(n).padStart(2,"0");
const sec=t=>{const p=String(t||"").split(":").map(Number);if(!p.length||p.some(isNaN))return 0;return p.length===3?p[0]*3600+p[1]*60+p[2]:p.length===2?p[0]*60+p[1]:0};
const fm=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?h+":"+z(m)+":"+z(s%60):m+":"+z(s%60)};
const pc=s=>Math.floor(s/60)+":"+z(Math.round(s%60));
const iso=d=>d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate());
const dm=s=>s.slice(8)+"/"+s.slice(5,7);
const card=(l,v)=>'<div style="background:var(--card);border-radius:8px;padding:8px"><div style="font-size:12px;color:var(--mut)">'+l+'</div><b>'+v+'</b></div>';

function view(from,to){
  const rows=Object.values(W).filter(w=>w.date>=from&&w.date<=to);
  const runs=rows.filter(w=>w.done&&w.res&&+String(w.res.km).replace(",",".")>0).map(w=>{const km=+String(w.res.km).replace(",","."),s=sec(w.res.time);return{date:w.date,km,s,hr:+w.res.hr||0,pace:s?s/km:0}});
  if(!runs.length)return'<div class="desc">אין עדיין ריצות מתועדות בתקופה זו.</div>';
  const km=runs.reduce((a,r)=>a+r.km,0),tm=runs.filter(r=>r.s),tk=tm.reduce((a,r)=>a+r.km,0),ts=tm.reduce((a,r)=>a+r.s,0);
  const ps=tm.map(r=>r.pace),hs=runs.filter(r=>r.hr),hw=hs.length?hs.reduce((a,r)=>a+r.hr*(r.s||1),0)/hs.reduce((a,r)=>a+(r.s||1),0):0;
  const pk=rows.reduce((a,w)=>a+(+w.km||0),0),dn=rows.filter(w=>w.done).length;
  let h='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0">';
  h+=card('ק״מ סה״כ',km.toFixed(1))+card('ריצות',runs.length)+card('ממוצע לריצה',(km/runs.length).toFixed(1)+' ק״מ')+card('הארוכה ביותר',Math.max(...runs.map(r=>r.km)).toFixed(1)+' ק״מ');
  if(tm.length)h+=card('זמן ריצה כולל',fm(ts))+card('קצב ממוצע',pc(ts/tk)+' לק״מ')+card('טווח קצבים',pc(Math.min(...ps))+'–'+pc(Math.max(...ps)));
  if(hs.length)h+=card('דופק ממוצע',Math.round(hw))+card('טווח דופק',Math.min(...hs.map(r=>r.hr))+'–'+Math.max(...hs.map(r=>r.hr)));
  h+=card('ביצוע מהתכנית',dn+' מתוך '+rows.length+(pk?' · '+Math.round(km/pk*100)+'% מהק״מ':''))+'</div>';
  const wk={};runs.forEach(r=>{const d=new Date(r.date+'T12:00');d.setDate(d.getDate()-d.getDay());const k=iso(d);wk[k]=(wk[k]||0)+r.km});
  const ks=Object.keys(wk).sort(),mx=Math.max(...ks.map(k=>wk[k]));
  h+='<b>ק״מ לפי שבוע</b>'+ks.map(k=>'<div style="display:flex;align-items:center;gap:6px;margin:4px 0;font-size:12px"><span style="width:42px">'+dm(k)+'</span><div style="height:12px;border-radius:4px;background:var(--acc);width:'+Math.max(2,wk[k]/mx*60)+'%"></div><span>'+wk[k].toFixed(1)+'</span></div>').join('');
  return h;
}

function open(){
  const dl=document.createElement("dialog");
  dl.innerHTML='<b>סטטיסטיקות</b><label>תקופה<select id="sp"><option value="7">7 ימים אחרונים</option><option value="30" selected>30 ימים אחרונים</option><option value="90">90 ימים אחרונים</option><option value="all">הכל</option><option value="c">בחירה ידנית</option></select></label><div class="row" id="sc" hidden><label>מתאריך<input type="date" id="sf"></label><label>עד תאריך<input type="date" id="se"></label></div><div id="sb"></div><div class="act"><button id="sx">סגור</button></div>';
  document.body.appendChild(dl);dl.showModal();
  const q=s=>dl.querySelector(s);
  const upd=()=>{
    const v=q("#sp").value;q("#sc").hidden=v!=="c";
    const t=new Date(),to=iso(t);let from="0000-01-01",end="9999-12-31";
    if(v==="c"){from=q("#sf").value||from;end=q("#se").value||end}
    else if(v!=="all"){const f=new Date();f.setDate(f.getDate()-(+v-1));from=iso(f);end=to}
    q("#sb").innerHTML=view(from,end);
  };
  q("#sp").onchange=upd;q("#sf").onchange=upd;q("#se").onchange=upd;
  q("#sx").onclick=()=>{dl.close();dl.remove()};upd();
}
const b=document.createElement("button");b.id="st";b.textContent="סטטיסטיקות";b.onclick=open;
$("#im").after(b);
})();
