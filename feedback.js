(function(){
const $=s=>document.querySelector(s);
const sec=t=>{const p=String(t||"").split(":").map(Number);return !p.length||p.some(isNaN)?0:p.length===3?p[0]*3600+p[1]*60+p[2]:p.length===2?p[0]*60+p[1]:0};
const pc=s=>Math.floor(s/60)+":"+String(Math.round(s%60)).padStart(2,"0");
const dm=d=>d.slice(8)+"/"+d.slice(5,7);
let FB={};
// Feedback written by Claude lives in results.json under the "fb" key of each workout.
fetch("results.json",{cache:"no-cache"}).then(r=>r.json()).then(o=>{for(const [k,v] of Object.entries(o))if(v.fb)FB[k]=v.fb}).catch(()=>{});
const box=document.createElement("div");
box.style.cssText="background:var(--card);border-radius:8px;padding:8px;margin:8px 0;font-size:14px;white-space:pre-line";box.hidden=true;
$("#fk").closest("label").before(box);
const run=w=>{const r=w.res||{},km=+String(r.km||"").replace(",","."),s=sec(r.time);return{km,pace:km&&s?s/km:0,hr:+r.hr||0}};

// Automatic feedback (used when there is no feedback from Claude): compares the run with the plan's pace and heart-rate range.
function auto(id){
  const w=W[id],a=run(w);if(!(a.km>0))return"";
  const pm=(w.desc||"").match(/קצב: (\d+:\d{2})[–-](\d+:\d{2})/),hm=(w.desc||"").match(/דופק רצוי: (\d+)[–-](\d+)/);
  const L=[];let score=0;
  if(pm&&a.pace){const lo=sec(pm[1]),hi=sec(pm[2]);
    if(a.pace<lo-20){L.push("קצב "+pc(a.pace)+": מהיר מהמתוכנן ("+pm[1]+"–"+pm[2]+")");score+=a.pace<lo-40?2:1}
    else if(a.pace>hi+30)L.push("קצב "+pc(a.pace)+": איטי מהמתוכנן, וזה בסדר כשהדופק בטוח");
    else L.push("קצב "+pc(a.pace)+": בטווח המתוכנן");}
  if(hm&&a.hr){const lo=+hm[1],hi=+hm[2];
    if(a.hr>hi+3){L.push("דופק "+a.hr+": גבוה מהתקרה ("+hi+")");score+=a.hr>hi+6?2:1}
    else if(a.hr<lo)L.push("דופק "+a.hr+": נמוך מהטווח, הריצה הייתה קלה מהמתוכנן");
    else L.push("דופק "+a.hr+": בטווח");}
  if(+w.km)L.push("מרחק: "+a.km+" מתוך "+w.km+" ק״מ מתוכננים");
  const prev=Object.entries(W).filter(([k,x])=>k!==id&&x.done&&x.date<w.date&&run(x).pace&&run(x).hr).sort((p,q)=>q[1].date.localeCompare(p[1].date))[0];
  if(prev&&a.pace&&a.hr){const b=run(prev[1]),dp=Math.round(a.pace-b.pace),dh=a.hr-b.hr;
    L.push("לעומת הריצה הקודמת ("+dm(prev[1].date)+"): קצב "+(dp>=0?"+":"")+dp+" שנ׳, דופק "+(dh>=0?"+":"")+dh);}
  return(score>=3?"🟠 ריצה מאומץת מהמתוכנן":score>=1?"🟡 ריצה סבירה":"✅ ריצה טובה")+"\n"+L.join("\n");
}
function show(){
  const id=typeof sel!=="undefined"?sel:null,w=id&&W[id];
  if(!w||!w.done){box.hidden=true;return}
  let t="";
  if(FB[id])t="המשוב של Claude\n"+FB[id];
  else{const x=auto(id);if(x)t="משוב אוטומטי\n"+x}
  box.textContent=t;box.hidden=!t;
}
new MutationObserver(show).observe($("#dt"),{childList:true,characterData:true,subtree:true});
})();
