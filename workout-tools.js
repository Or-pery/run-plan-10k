(function(){
const $=s=>document.querySelector(s),set=(id,v)=>{if(v!==""&&v!=null&&v!==0)$(id).value=v};
const p2=n=>String(n).padStart(2,"0");
const fmt=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?h+":"+p2(m)+":"+p2(x):m+":"+p2(x)};
const avg=a=>a.length?a.reduce((x,y)=>x+y)/a.length:0;

function fromXml(t,gpx){
  const d=new DOMParser().parseFromString(t,"application/xml");
  if(d.querySelector("parsererror"))throw 0;
  const all=n=>[...d.getElementsByTagNameNS("*",n)];
  const hr=avg(all(gpx?"hr":"HeartRateBpm").map(e=>+e.textContent.trim()).filter(Boolean));
  if(!gpx){
    let m=0,s=0;
    all("Lap").forEach(l=>{const g=n=>+(l.getElementsByTagNameNS("*",n)[0]?.textContent||0);m+=g("DistanceMeters");s+=g("TotalTimeSeconds")});
    return{km:m/1000,sec:s,hr};
  }
  const pts=all("trkpt");let m=0;
  for(let i=1;i<pts.length;i++){
    const a=pts[i-1],b=pts[i],r=x=>x*Math.PI/180,la=r(+a.getAttribute("lat")),lb=r(+b.getAttribute("lat")),dl=r(+b.getAttribute("lon")-+a.getAttribute("lon"));
    m+=6371000*Math.acos(Math.min(1,Math.sin(la)*Math.sin(lb)+Math.cos(la)*Math.cos(lb)*Math.cos(dl)));
  }
  const tm=pts.map(p=>p.getElementsByTagNameNS("*","time")[0]?.textContent).filter(Boolean).map(x=>Date.parse(x));
  return{km:m/1000,sec:tm.length>1?(tm[tm.length-1]-tm[0])/1000:0,hr};
}

// Screenshot reading: find the Hebrew labels, then read only the number under each label.
async function ocr(f){
  if(!window.Tesseract)await new Promise((ok,no)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";s.onload=ok;s.onerror=no;document.head.appendChild(s)});
  const bm=await createImageBitmap(f),k0=Math.min(1,3000/Math.max(bm.width,bm.height));
  const img=document.createElement("canvas");img.width=Math.round(bm.width*k0);img.height=Math.round(bm.height*k0);
  img.getContext("2d").drawImage(bm,0,0,img.width,img.height);
  const worker=await Tesseract.createWorker("heb+eng");
  try{
    const {data}=await worker.recognize(img);
    const W=(data.words||[]).map(w=>({t:(w.text||"").replace(/[\u200e\u200f]/g,"").trim(),x0:w.bbox.x0,y0:w.bbox.y0,x1:w.bbox.x1,y1:w.bbox.y1})).filter(w=>w.t);
    const row=(a,b)=>Math.abs(a.y0-b.y0)<18,has=(a,t)=>W.some(w=>row(w,a)&&w.t.includes(t));
    const rightOf=a=>Math.max(...W.filter(v=>row(v,a)&&v.x0>=a.x0-5&&v.x1-a.x1<150).map(v=>v.x1));
    const crop=async(x0,y0,x1,y1,wl)=>{
      x0=Math.max(0,Math.round(x0));y0=Math.max(0,Math.round(y0));x1=Math.min(img.width,Math.round(x1));y1=Math.min(img.height,Math.round(y1));
      const w=x1-x0,h=y1-y0;if(w<5||h<5)return"";
      const t=document.createElement("canvas");t.width=w;t.height=h;const tx=t.getContext("2d");tx.drawImage(img,x0,y0,w,h,0,0,w,h);
      const d=tx.getImageData(0,0,w,h),p=d.data;let s=0;
      for(let i=0;i<p.length;i+=4)s+=Math.max(p[i],p[i+1],p[i+2]);
      const dark=s/(p.length/4)<110;
      for(let i=0;i<p.length;i+=4){const v=dark?255-Math.max(p[i],p[i+1],p[i+2]):(p[i]*.3+p[i+1]*.59+p[i+2]*.11);p[i]=p[i+1]=p[i+2]=v}
      tx.putImageData(d,0,0);
      const c=document.createElement("canvas");c.width=w*3+60;c.height=h*3+60;const cx=c.getContext("2d");
      cx.fillStyle="#fff";cx.fillRect(0,0,c.width,c.height);cx.imageSmoothingQuality="high";cx.drawImage(t,0,0,w,h,30,30,w*3,h*3);
      await worker.setParameters({tessedit_pageseg_mode:"7",tessedit_char_whitelist:wl||""});
      return((await worker.recognize(c)).data.text||"").trim();
    };
    const last=(s,re)=>{const m=s.match(re)||[];return m.length?m[m.length-1]:""};
    const below=(right,a,wide,wl)=>{const h=a.y1-a.y0;return crop(right-wide*h,a.y1,right+15,a.y1+3.4*h,wl)};
    let km="",time="",hr="",pace="";
    for(const a of W){
      if(!km&&a.t==="מרחק"){const s=await below(a.x1,a,14,"");km=last(s,/\d+[.,]\d+/g)||last(s,/\d+/g)}
      else if(!time&&a.t==="זמן"&&has(a,"האימון")){const s=await below(rightOf(a),a,14,"");time=last(s,/\d{1,2}:\d{2}(?::\d{2})?/g)}
      else if(!hr&&a.t==="לב"&&has(a,"ממוצע")){const s=await below(rightOf(a),a,14,"");hr=last(s,/\d{2,3}/g)}
      else if(!pace&&a.t==="קצב"&&!has(a,"לב")){
        const nx=W.filter(v=>row(v,a)&&v.x1<=a.x0+5&&a.x0-v.x1<80).sort((p,q)=>q.x1-p.x1)[0];
        if(nx&&nx.t==="ממוצע"){const s=await below(a.x1,a,5,"0123456789'\"");const m=s.match(/(\d)\D?(\d{2})/);if(m)pace=m[1]+":"+m[2]}
      }
    }
    // Fallback to plain text if a label was not found
    const text=data.text||"";
    if(!hr)hr=(text.match(/(\d{2,3})\s*(?:פע|bpm)/i)||[])[1]||"";
    if(!km)km=(text.match(/(\d+[.,]\d+)\s*(?:ק|km)/i)||[])[1]||"";
    if(!time)time=(text.match(/(?:^|[^\d:])(\d{1,2}:\d{2}:\d{2})(?![\d:])/)||[])[1]||"";
    return{hr:+hr||0,km:+String(km).replace(",",".")||0,time:String(time).replace(/^0:/,""),notes:"נקרא מתמונה (זיהוי טקסט), יש לבדוק את הערכים"+(pace?"\nקצב ממוצע "+pace+" לק״מ":"")};
  }finally{await worker.terminate()}
}

document.addEventListener("change",async e=>{
  if(e.target.id!=="ff")return;
  const f=e.target.files[0],st=$("#fs");if(!f)return;
  try{
    const n=f.name.toLowerCase();let r;
    if(/\.(tcx|gpx|json)$/.test(n)){const t=await f.text();r=n.endsWith(".json")?JSON.parse(t):fromXml(t,n.endsWith(".gpx"))}
    else if((f.type||"").startsWith("image/")){st.textContent="קורא את התמונה. בפעם הראשונה זה עשוי ללקת כמה דקות…";r=await ocr(f)}
    else throw 0;
    const km=r.km?Math.round(r.km*100)/100:0,time=r.time||(r.sec?fmt(r.sec):""),hr=r.hr?Math.round(r.hr):0;
    set("#fkm",km);set("#ftm",time);set("#fhr",hr);
    if(r.notes)$("#fn").value=($("#fn").value?$("#fn").value+"\n":"")+r.notes;
    if(km||time||hr)$("#fk").checked=true;
    st.textContent=(km||time||hr)?"מולאו: "+[km&&km+" ק״מ",time,hr&&"דופק "+hr].filter(Boolean).join(" · ")+". בדוק ולחץ שמור.":"לא זוהו נתונים. אפשר למלא ידנית.";
  }catch(err){st.textContent="לא הצלחתי לקרוא את הקובץ: "+((err&&err.message)||"שגיאה")+". אפשר למלא ידנית."}
});
$("#dbtn").onclick=()=>{const f=$("#fd");f.hidden=false;try{f.showPicker()}catch(e){f.focus()}};
$("#fd").onchange=()=>{$("#dtx").textContent=$("#fd").value.split("-").reverse().join("/")};

// Show the exact bpm range next to every heart-rate zone mentioned in a workout.
const ZD=[[null,130],[131,142],[143,155],[156,167],[168,null]];
function zones(){
  try{const d=window.CLOUD_DOC;if(d&&d.profile){const p=JSON.parse(d.profile);if(p&&p.age){
    const mx=p.maxHR||Math.round(208-0.7*p.age),e=[.718,.785,.856,.923].map(x=>Math.round(mx*x));
    return[[null,e[0]],[e[0]+1,e[1]],[e[1]+1,e[2]],[e[2]+1,e[3]],[e[3]+1,null]];
  }}}catch(e){}
  return ZD;
}
const rg=(a,b,Z)=>{const lo=Z[a-1][0],hi=Z[b-1][1];return lo==null?"עד "+hi:hi==null?lo+"+":lo+"–"+hi};
function zt(s){
  const Z=zones();
  return s.replace(/אזורים (\d)[–-](\d)(?! ?\()/g,(m,a,b)=>m+" ("+rg(+a,+b,Z)+")")
    .replace(/(\(?)אזור (\d)(?!\d|[–-]\d|:| ?\()/g,(m,p,a)=>p?m+": "+rg(+a,+a,Z):m+" ("+rg(+a,+a,Z)+")");
}
const dd=$("#dd");
new MutationObserver(()=>{const s=dd.textContent,n=zt(s);if(n!==s)dd.textContent=n}).observe(dd,{childList:true,characterData:true,subtree:true});

// Results logged by Claude in results.json are applied once per version.
(async()=>{
  for(let i=0;i<40;i++){try{if(Object.keys(W).length)break}catch(e){}await new Promise(r=>setTimeout(r,250))}
  try{
    const r=await (await fetch("results.json",{cache:"no-cache"})).json();
    const seen=JSON.parse(localStorage.getItem("runplan_seeded")||"{}");let ch=false;
    for(const [id,o] of Object.entries(r)){
      if(!W[id]||seen[id]===o.v)continue;
      W[id].done=true;W[id].res=Object.assign({},W[id].res||{},o.res);seen[id]=o.v;ch=true;
    }
    if(ch){localStorage.setItem("runplan_seeded",JSON.stringify(seen));persist();render()}
  }catch(e){}
})();
})();
