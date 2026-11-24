// Applies schedule.json after the app has loaded its workouts: date overrides and extra workouts.
(async()=>{
  for(let i=0;i<40;i++){try{if(Object.keys(W).length)break}catch(e){}await new Promise(r=>setTimeout(r,250))}
  try{
    const s=await (await fetch("schedule.json",{cache:"no-cache"})).json();
    let ch=false;
    for(const [id,d] of Object.entries(s.dates||{})){const w=W[id];if(w&&!w.moved&&w.date!==d){w.date=d;ch=true}}
    for(const [id,x] of Object.entries(s.extra||{})){
      const w=W[id];
      if(!w){W[id]=Object.assign({done:false},x);ch=true}
      else{
        const n=Object.assign({},w,x,{date:w.moved?w.date:x.date,done:w.done,res:w.res,moved:w.moved});
        if(JSON.stringify(n)!==JSON.stringify(w)){W[id]=n;ch=true}
      }
    }
    if(ch){persist();render()}
  }catch(e){}
})();
