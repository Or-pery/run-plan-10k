// Applies schedule.json date overrides after the app has loaded its workouts.
(async()=>{
  for(let i=0;i<40;i++){try{if(Object.keys(W).length)break}catch(e){}await new Promise(r=>setTimeout(r,250))}
  try{
    const s=await (await fetch("schedule.json",{cache:"no-cache"})).json();
    let ch=false;
    for(const [id,d] of Object.entries(s.dates||{})){const w=W[id];if(w&&!w.moved&&w.date!==d){w.date=d;ch=true}}
    if(ch){persist();render()}
  }catch(e){}
})();
