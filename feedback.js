// Shows Claude's feedback (results.json -> fb) inside the workout dialog of a completed run.
(function(){
  const $=s=>document.querySelector(s),dd=$("#dd"),dt=$("#dt");
  if(!dd||!dt)return;
  let FB={};
  const box=document.createElement("div");box.id="fb";box.className="desc";box.hidden=true;dd.after(box);
  function show(){
    let id;try{id=sel}catch(e){}
    const f=id&&FB[id];
    if(!f){box.hidden=true;return}
    const c={good:"var(--easy)",ok:"var(--q)",bad:"var(--race)"}[f.s]||"var(--acc)";
    box.hidden=false;
    box.style.cssText="border-right:4px solid "+c+";padding:6px 10px;background:var(--card);border-radius:6px";
    box.textContent="פידבק מ-Claude\n"+f.t;
  }
  fetch("results.json",{cache:"no-cache"}).then(r=>r.json()).then(r=>{for(const [id,o] of Object.entries(r))if(o.fb)FB[id]=o.fb;show()}).catch(()=>{});
  new MutationObserver(show).observe(dt,{childList:true,characterData:true,subtree:true});
})();
