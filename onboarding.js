(function(){
const DN=["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];
const F=[
["name","שם","text"],
["age","גיל (18 ומעלה)","number"],
["layoff","כמה זמן עבר מאז שרצת באופן קבוע?","select",["עד 3 חודשים","3–12 חודשים","יותר משנה","מעולם לא רצתי"]],
["weekKm","כמה ק״מ ריצה בשבוע כרגע?","select",["0","1–5","6–15","16–30","מעל 30"]],
["longest","הריצה הרציפה הארוכה ביותר לאחרונה (ק״מ, 0 אם אין)","number"],
["goalKm","מרחק היעד (ק״מ)","select",["5","10","21.1"]],
["goalTime","זמן יעד בדקות, למשל 60 (אפשר להשאיר ריק, והזמן יוערך מריצת המדדים)","number"],
["raceDate","תאריך מירוץ, אם יש","date"],
["maxHR","דופק מקסימלי ידוע, אם יש (אחרת נערוך מהגיל)","number"],
["strength","אימוני כוח או ספורט אחר בשבוע?","select",["כן","לא"]],
["injury","פציעות או כאבים קיימים (אופציונלי)","text"]
];
const Q=["כאב או לחץ בחזה בזמן מאמץ","סחרחור או התעלפות","רופא אמר שיש בעיה בלב או לחץ דם גבוה","בעיה בעצמות או במפרקים שמתחמרת מריצה","הריון או חודשים ספורים אחרי לידה"];
const pc=s=>Math.floor(s/60)+":"+String(Math.round(s%60)).padStart(2,"0");
const ms=t=>{const p=String(t||"").split(":").map(Number);return p.some(isNaN)?0:p.length===3?p[0]*3600+p[1]*60+p[2]:p.length===2?p[0]*60+p[1]:0};
const BD="ריצת מדדים: הצעד הראשון לתכנית שמותאמת אליך.\nחימום: 5 דק׳ הליכה מהירה.\nעיקר: 12 דק׳ ריצה רציפה בקצב שאפשר להחזיק בנוחות מאתגרת (מאמץ 6–7 מתוך 10, אפשר לומר רק משפטים קצרים). לא מתחילים מהר מדי. מותר לעבור להליכה אם צריך, ורושמים את המרחק הכולל שהתקבל ב-12 הדקות.\nשחרור: 5 דק׳ הליכה.\nאחרי האימון: לחץ על האימון, מלא ק״מ בפועל, זמן (12:00) ודופק ממוצע, ושמור. אחר כך לחץ על הכפתור לבניית התכנית.\nכאב בחזה, סחרחור או כאב חד: עוצרים.";

function gen(p){
  const mx=p.maxHR||Math.round(208-0.7*p.age),H=(a,b)=>Math.round(mx*a)+"–"+Math.round(mx*b);
  const g=p.goalTime?p.goalTime*60/p.goalKm:0,P=(a,b)=>g?pc(g+a)+"–"+pc(g+b):"לפי תחושה";
  const ep=g?g+70:420,D=864e5,t=new Date();t.setHours(12,0,0,0);
  const st=new Date(t.getTime()+D),gk=p.goalKm,peak={5:8,10:10,21.1:18}[gk];
  const weeks=p.raceDate?Math.max(4,Math.min(24,Math.ceil((new Date(p.raceDate+"T12:00")-st)/(7*D)))):{5:8,10:10,21.1:14}[gk];
  const L0=Math.min(Math.max(Math.round(p.longest*0.8),3),peak-1),beg=p.weekKmIdx<=1&&p.layoffIdx>=2;
  const days=p.days.slice().sort((a,b)=>a-b),ld=p.longDay,rest=days.filter(d=>d!==ld);
  const qd=days.length>=3?rest[Math.floor((rest.length-1)/2)]:-1;
  const ws=new Date(st.getTime()-st.getDay()*D),out={};let n=0;
  const L=(km,pace,hr,z)=>"מרחק: "+km+" ק״מ\nקצב: "+pace+"\nדופק רצוי: "+hr+"\nאזורים: "+z;
  const add=(date,o)=>{out["g"+String(++n).padStart(2,"0")]=Object.assign({date:ymd(date),done:false},o)};
  for(let w=0;w<weeks;w++){
    let lg=L0+(peak-L0)*Math.min(1,w/Math.max(1,weeks-3));
    if(w%4===3)lg*=0.75;if(w===weeks-2)lg*=0.85;
    lg=Math.round(lg*2)/2;const E=Math.min(8,Math.max(3,Math.round(lg*0.55))),last=w===weeks-1;
    for(const d of days){
      const date=new Date(ws.getTime()+(w*7+d)*D);
      if(date<st||(p.raceDate&&ymd(date)>p.raceDate))continue;
      const nt=(w<2&&beg)?"\nאפשר לשלב הליכה כל 5–8 דק׳":"";
      if(d===ld&&last&&!p.raceDate||p.raceDate&&ymd(date)===p.raceDate){
        add(date,{title:gk+" ק״מ מירוץ",type:"race",km:gk,desc:L(gk,g?pc(g):"לפי תחושה",H(.82,.92),"מתחילים לאט, לא יוצאים מהר בק״מ הראשון")});
      }else if(d===ld){
        add(date,{title:lg+" ק״מ ארוך",type:"long",km:lg,desc:L(lg,P(75,105),H(.7,.82),"אזור 2 רוב הדרך, אזור 3 בחצי השני")+nt});
      }else if(d===qd&&!last&&w>=2&&w%4!==3){
        if(w%2===0){const m=Math.min(25,10+Math.floor(w/2)*5),k=Math.round((15+m)*60/ep*2)/2;
          add(date,{title:"טמפו "+m+" דק׳",type:"quality",km:k,desc:L(k,"חימום 10 דק׳, "+m+" דק׳ בקצב "+P(15,30)+", שחרור 5 דק׳","בטמפו "+H(.85,.92),"חימום ושחרור באזורים 1–2, טמפו באזור 4")});
        }else{const r=Math.min(6,3+Math.floor(w/3)),k=Math.round((15+r*4)*60/ep*2)/2;
          add(date,{title:"אינטרוולים "+r+"×2",type:"quality",km:k,desc:L(k,"חימום 10 דק׳, "+r+"×(2 דק׳ מהיר בקצב "+P(-30,-15)+" + 2 דק׳ התאוששות), שחרור 5 דק׳","במהירות "+H(.9,.95),"בהתאוששות יורדים לאזור 2")});}
      }else{
        const s=d===qd&&!last&&w<2||d===qd&&last,ek=w<2&&beg?Math.max(2,E-1):E;
        add(date,{title:ek+" ק״מ קל"+(s?" + האצות":""),type:"easy",km:ek,desc:L(ek,P(60,90),H(.7,.8),"אזור 2 רוב הזמן, אזור 3 עד רבע, אזורים 4–5: לא")+(s?"\nבסוף: 4 האצות של 15–20 שנ׳, הליכה בין האצות":"")+nt});
      }
    }
  }
  if(p.raceDate&&!Object.values(out).some(o=>o.type==="race"))add(new Date(p.raceDate+"T12:00"),{title:gk+" ק״מ מירוץ",type:"race",km:gk,desc:"יום המירוץ"});
  if(p.injury){const f=Object.values(out)[0];if(f)f.desc+="\nציינת כאב או פציעה: בכאב חד עוצרים"}
  return out;
}

function useplan(plan,ds){
  BASE=JSON.parse(JSON.stringify(plan));W=JSON.parse(JSON.stringify(plan));
  try{const ov=JSON.parse(ds||"{}");for(const [id,o] of Object.entries(ov)){const w=W[id];if(!w)continue;w.done=o.done;w.res=o.res||undefined;if(o.moved){w.date=o.date;w.moved=true}}}catch(e){}
  const f=Object.values(W).map(w=>w.date).sort()[0];
  if(f){const y=+f.slice(0,4),m=+f.slice(5,7)-1;for(let i=0;i<MONTHS.length;i++)if(MONTHS[i][0]===y&&MONTHS[i][1]===m)mi=i}
  persist();render();
}

// After the baseline run: calibrate the goal time from the measured pace and build the full plan.
function banner(profile){
  if(document.getElementById("bn"))return;
  const b=document.createElement("div");b.id="bn";b.className="top";
  b.innerHTML='<span class="desc">הצעד הראשון: ריצת מדדים. אחריה מולאים את התוצאות באימון ולוחצים כאן.</span><button class="p" id="bn_go">בנה לי תכנית</button>';
  $("#msg").after(b);
  document.getElementById("bn_go").onclick=async()=>{
    const t=W.b01,r=(t&&t.res)||{},km=+String(r.km||"").replace(",","."),s=ms(r.time);
    if(!(km>0&&s>0))return alert("מלא קודם את הק״מ והזמן של ריצת המדדים (לחץ על האימון בלוח)");
    const p=Object.assign({},profile);delete p.stage;p.testKm=km;p.testSec=s;if(+r.hr)p.testHr=+r.hr;
    if(!p.goalTime)p.goalTime=Math.round(s/km*1.06*p.goalKm/60);
    const plan=Object.assign({b01:Object.assign({},t,{done:true})},gen(p));
    try{await CL.raw(USER.uid,{profile:JSON.stringify(p),plan:JSON.stringify(plan),data:"{}",updated:Date.now()})}catch(e){return alert("השמירה נכשלה, נסה שוב")}
    useplan(plan,"{}");b.remove();
  };
}

function form(){
  const dl=document.createElement("dialog");
  let h='<b>ברוך הבא! כמה שאלות כדי להתחיל</b><div class="desc">התשובות נשמרות בחשבון שלך. אחריהן תקבל ריצת מדדים קצרה, ומהתוצאות נבנה את התכנית. התכנית היא הכוונה כללית ואינה ייעוץ רפואי.</div>';
  F.forEach(([k,l,t,o])=>{
    h+='<label>'+l+(o?'<select id="ob_'+k+'">'+o.map((x,i)=>'<option value="'+i+'">'+x+'</option>').join("")+'</select>':'<input id="ob_'+k+'" type="'+t+'">')+'</label>';
  });
  h+='<label>באילו ימים אפשר לרוץ (2–5)?</label><div class="row">'+DN.map((d,i)=>'<label><input type="checkbox" class="obd" value="'+i+'" style="width:auto"> '+d+'</label>').join("")+'</div>';
  h+='<label>יום הריצה הארוכה<select id="ob_ld">'+DN.map((d,i)=>'<option value="'+i+'">'+d+'</option>').join("")+'</select></label>';
  h+='<label>בריאות: סמן אם יש אחד מהבאים</label>'+Q.map(q=>'<label><input type="checkbox" class="obq" style="width:auto"> '+q+'</label>').join("");
  h+='<div id="ob_err" class="desc"></div><div class="act"><button class="p" id="ob_ok">המשך לריצת מדדים</button><button id="ob_skip">דלג (תכנית כללית)</button></div>';
  dl.innerHTML=h;document.body.appendChild(dl);dl.showModal();
  const v=k=>document.getElementById("ob_"+k).value,err=m=>{document.getElementById("ob_err").textContent=m};
  document.getElementById("ob_skip").onclick=async()=>{try{await CL.raw(USER.uid,{profile:'{"skipped":true}'})}catch(e){}dl.close()};
  document.getElementById("ob_ok").onclick=async()=>{
    const ds=[...dl.querySelectorAll(".obd:checked")].map(x=>+x.value);
    if(!(+v("age")>=18))return err("האפליקציה מיועדת לבני 18 ומעלה");
    if(ds.length<2||ds.length>5)return err("סמן בין 2 ל-5 ימים");
    if(dl.querySelector(".obq:checked")&&!confirm("סימנת שיש בעיה רפואית שעלולה להשפיע על ריצה. מומלץ להתייעץ עם רופא לפני שמתחילים. להמשיך בכל זאת?"))return;
    const ld=+v("ld");
    const p={name:v("name"),age:+v("age"),layoffIdx:+v("layoff"),weekKmIdx:+v("weekKm"),longest:+v("longest")||0,goalKm:[5,10,21.1][+v("goalKm")],goalTime:+v("goalTime")||0,raceDate:v("raceDate"),maxHR:+v("maxHR")||0,strength:v("strength")=="0",injury:v("injury").trim(),days:ds,longDay:ds.includes(ld)?ld:ds[ds.length-1],stage:"baseline"};
    const t=new Date();t.setHours(12,0,0,0);const tm=new Date(t.getTime()+864e5);
    const plan={b01:{date:ymd(tm),title:"ריצת מדדים 12 דק׳",type:"quality",km:2,done:false,desc:BD}};
    try{await CL.raw(USER.uid,{profile:JSON.stringify(p),plan:JSON.stringify(plan),data:"{}",updated:Date.now()})}catch(e){return err("השמירה נכשלה, נסה שוב")}
    useplan(plan,"{}");dl.close();banner(p);
  };
}

window.afterLogin=function(){
  const d=window.CLOUD_DOC;
  if(d&&d.plan){
    useplan(JSON.parse(d.plan),d.data);
    try{const p=JSON.parse(d.profile||"{}");if(p.stage==="baseline")banner(p)}catch(e){}
  }else if(!d||!d.profile)form();
};
})();
