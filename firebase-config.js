// Feature scripts (username login, statistics). They are loaded from here because index.html imports this file on every start.
for (const f of ["auth.js", "stats.js"]) {
  const s = document.createElement("script");
  s.src = f + "?v=2";
  document.body.appendChild(s);
}

// Fill in from Firebase console > Project settings > Your apps > Web app.
// These web config values are not secrets. Access is protected by firestore.rules.
// While apiKey is empty, the app runs in local-only mode with no login.
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  appId: ""
};
