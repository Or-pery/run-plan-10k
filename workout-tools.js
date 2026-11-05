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

async function prep(f){
  const b=await createImageBitmap(f),s=Math.min(2,2200/Math.max(b.width,b.height)),cv=document.createElement("canvas");
  cv.width=Math.round(b.width*s);cv.height=Math.round(b.height*s);
  const x=cv.getContext("2d");x.drawImage(b,0,0,cv.width,cv.height);
  const im=x.getImageData(0,0,cv.width,cv.height),d=im.data;let sum=0;
  for(let i=0;i<d.length;i+=4)sum+=Math.max(d[i],d[i+1],d[i+2]);
  const dark=sum/(d.length/4)<110;
  for(let i=0;i<d.length;i+=4){
    const o=dark?(255-Math.max(d[i],d[i+1],d[i+2])>170?255:0):((d[i]*.3+d[i+1]*.59+d[i+2]*.11)>140?255:0);
    d[i]=d[i+1]=d[i+2]=o;
  }
  x.putImageData(im,0,0);return cv;
}

async function ocr(f){
  if(!window.Tesseract)await new Promise((ok,no)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";s.onload=ok;s.onerror=no;document.head.appendChild(s)});
  const {data:{text}}=await Tesseract.recognize(await prep(f),"heb+eng");
  window.LAST_OCR=text;
  const hr=(text.match(/(\d{2,3})\s*(?:פע|bpm)/i)||text.match(/קצב לב[^\d]{0,25}(\d{2,3})/)||[])[1];
  const km=(text.match(/(\d+[.,]\d+)\s*(?:ק|km)/i)||text.match(/מרחק[^\d]{0,12}(\d+[.,]?\d*)/)||[])[1];
  const tm=(text.match(/(?:^|[^\d:])(\d{1,2}:\d{2}:\d{2})(?![\d:])/)||[])[1];
  return{hr:hr?+hr:0,km:km?+km.replace(",","."):0,time:tm?tm.replace(/^0:/,""):"",notes:"נקרא מתמונה (זיהוי טקסט), יש לבדוק את הערכים"};
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
  }catch(err){st.textContent="לא הצלחתי לקרוא את הקובץ. אפשר למלא ידנית."}
});
$("#dbtn").onclick=()=>{const f=$("#fd");f.hidden=false;try{f.showPicker()}catch(e){f.focus()}};
$("#fd").onchange=()=>{$("#dtx").textContent=$("#fd").value.split("-").reverse().join("/")};

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
