(function(){
const $=s=>document.querySelector(s),U="https://www.gstatic.com/firebasejs/10.14.1/";
const ERR={"auth/email-already-in-use":"שם המשתמש תפוס","auth/invalid-credential":"שם משתמש או סיסמה שגויים","auth/wrong-password":"שם משתמש או סיסמה שגויים","auth/user-not-found":"שם משתמש או סיסמה שגויים","auth/weak-password":"הסיסמה חייבת להכיל לפחות 6 תווים","auth/invalid-email":"שם משתמש לא תקין","auth/operation-not-allowed":"כניסה עם שם משתמש לא הופעלה ב-Firebase","auth/too-many-requests":"יותר מדי ניסיונות, נסה שוב מאוחר יותר"};
// A username is mapped to a private address: "u" + SHA-256 prefix, so any characters are allowed. A real email is used as-is.
async function mail(u){
  u=u.trim().toLowerCase();if(u.includes("@"))return u;
  const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(u));
  return "u"+[...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,40)+"@users.runplan.app";
}
function open(){
  const dl=document.createElement("dialog");
  dl.innerHTML='<b>כניסה או הרשמה</b><label>שם משתמש (או אימייל)<input id="au_u" autocomplete="username" autocapitalize="none"></label><label>סיסמה (לפחות 6 תווים)<input id="au_p" type="password" autocomplete="current-password"></label><div id="au_e" class="desc"></div><div class="act"><button class="p" id="au_in">כניסה</button><button id="au_up">הרשמה</button><button id="au_x">סגור</button></div><div class="desc">בלי אימייל אי אפשר לשחרר סיסמה שנשכחה.</div>';
  document.body.appendChild(dl);dl.showModal();
  const q=s=>dl.querySelector(s),err=m=>{q("#au_e").textContent=m};
  const go=async reg=>{
    const u=q("#au_u").value.trim(),p=q("#au_p").value;
    if(!u||u.length>40)return err("יש להזין שם משתמש (עד 40 תווים)");
    err("רגע…");
    try{
      const A=await import(U+"firebase-auth.js"),auth=A.getAuth(),m=await mail(u);
      if(reg){const c=await A.createUserWithEmailAndPassword(auth,m,p);if(!u.includes("@")){await A.updateProfile(c.user,{displayName:u});$("#usr").textContent=u}}
      else await A.signInWithEmailAndPassword(auth,m,p);
      dl.close();dl.remove();
    }catch(e){err(ERR[e.code]||"שגיאה: "+(e.code||e.message))}
  };
  q("#au_in").onclick=()=>go(false);q("#au_up").onclick=()=>go(true);q("#au_x").onclick=()=>{dl.close();dl.remove()};
}
let n=0;
const t=setInterval(()=>{
  let ok=false;try{ok=!!CL}catch(e){}
  if(!ok){if(++n>60)clearInterval(t);return}
  clearInterval(t);
  const b=document.createElement("button");b.textContent="כניסה עם שם משתמש";b.onclick=open;
  $("#auth").insertBefore(b,$("#lg"));
  setInterval(()=>{let u=false;try{u=!!USER}catch(e){}b.hidden=u},500);
},500);
})();
