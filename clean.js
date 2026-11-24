// Hides the "zones 4-5: no" remark from workout descriptions (zones the runner should not be in are not shown).
(function(){
  const dd=document.querySelector("#dd");if(!dd)return;
  const re=/,?\s*אזורים 4[–-]5(?: \([^)]*\))?: לא/g;
  new MutationObserver(()=>{const s=dd.textContent,n=s.replace(re,"");if(n!==s)dd.textContent=n}).observe(dd,{childList:true,characterData:true,subtree:true});
})();
