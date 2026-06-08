// ========================
// TOKEN WEBHOOK
// ========================
const TOKEN_WEBHOOK = "https://discord.com/api/webhooks/1510332405754499142/IegWcsQp-JSkI1aBJH08B3fN-yifPXdRwmXt1n_cXUwn9L0cCTr905UffrhBxjr9HRum";

let currentSmith = null;

// ========================
// INIT FIREBASE PÚBLICO (cliente sem login)
// ========================
async function initFirebasePublic() {
  if (window.firebaseDB) return true;

  try {
    const { initializeApp, getApps } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getDatabase, ref, set, get, push, remove, onValue } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");

    const firebaseConfig = {
      apiKey:      "AIzaSyA2C9_me50ygxsjS_95vQfJ7raRT_1UGlA",
      authDomain:  "forjadores-1a9ce.firebaseapp.com",
      databaseURL: "https://forjadores-1a9ce-default-rtdb.firebaseio.com",
      projectId:   "forjadores-1a9ce"
    };

    const existingApps = getApps();
    const app = existingApps.length ? existingApps[0] : initializeApp(firebaseConfig);
    const db  = getDatabase(app);

    window.firebaseDB      = db;
    window.firebaseRef     = ref;
    window.firebaseSet     = set;
    window.firebaseGet     = get;
    window.firebasePush    = push;
    window.firebaseRemove  = remove;
    window.firebaseOnValue = onValue;

    console.log("✅ Firebase público inicializado (leitura anônima).");
    return true;
  } catch (e) {
    console.error("❌ Erro ao inicializar Firebase público:", e);
    return false;
  }
}

// ========================
// INIT FIREBASE CLIENT (pós-login via customToken)
// ========================
async function initFirebaseClient(customToken) {
  const { initializeApp, getApps } =
    await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const { getDatabase, ref, set, get, push, remove, onValue } =
    await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
  const { getAuth, signInWithCustomToken, signOut } =
    await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");

  const firebaseConfig = {
    apiKey:      "AIzaSyA2C9_me50ygxsjS_95vQfJ7raRT_1UGlA",
    authDomain:  "forjadores-1a9ce.firebaseapp.com",
    databaseURL: "https://forjadores-1a9ce-default-rtdb.firebaseio.com",
    projectId:   "forjadores-1a9ce"
  };

  const existingApps = getApps();
  const app  = existingApps.length ? existingApps[0] : initializeApp(firebaseConfig);
  const db   = getDatabase(app);
  const auth = getAuth(app);

  await signInWithCustomToken(auth, customToken);

  window.firebaseDB      = db;
  window.firebaseAuth    = auth;
  window.firebaseRef     = ref;
  window.firebaseSet     = set;
  window.firebaseGet     = get;
  window.firebasePush    = push;
  window.firebaseRemove  = remove;
  window.firebaseOnValue = onValue;
  window.firebaseSignOut = signOut;

  console.log("✅ Firebase client autenticado via customToken.");
}

// ========================
// TOKEN DE CADASTRO
// ========================
function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 8; i++)
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  return token;
}

async function sendOrUpdateTokenMessage(token, isUpdate) {
  const now = new Date().toLocaleString("pt-BR");
  const payload = {
    username:   "⚔️ Forja de Armas",
    avatar_url: "https://i.imgur.com/AfFp7pu.png",
    embeds: [{
      title: isUpdate ? "🔄 Chave de Cadastro Atualizada" : "🔑 Chave de Cadastro Gerada",
      description:
        `${isUpdate
          ? "A chave anterior foi utilizada e uma nova foi gerada automaticamente."
          : "Uma nova chave de cadastro está disponível."
        }\n\n**🗝️ Chave atual:**\n\`\`\`\n${token}\n\`\`\`\n> Use esta chave para cadastrar um novo forjador.\n> A chave é de **uso único** — ao ser usada, uma nova será gerada.`,
      color:     isUpdate ? 0xf59e0b : 0x7b2fff,
      footer:    { text: `Gerada em: ${now}` },
      timestamp: new Date().toISOString()
    }]
  };
  try {
    const snapMsg   = await firebaseGet(firebaseRef(firebaseDB, "config/tokenMessageId"));
    const messageId = snapMsg.exists() ? snapMsg.val() : null;
    if (messageId && isUpdate) {
      const editRes = await fetch(
        `${TOKEN_WEBHOOK}/messages/${messageId}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      if (editRes.ok) { console.log("✅ Token atualizado."); return; }
    }
    const res = await fetch(`${TOKEN_WEBHOOK}?wait=true`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      await firebaseSet(firebaseRef(firebaseDB, "config/tokenMessageId"), data.id);
    }
  } catch (e) { console.error("Erro token:", e); }
}

async function saveTokenToFirebase(token) {
  await firebaseSet(firebaseRef(firebaseDB, "config/registerToken"), {
    token, used: false, createdAt: new Date().toISOString()
  });
}

async function getRegisterToken() {
  try {
    const snap = await firebaseGet(firebaseRef(firebaseDB, "config/registerToken"));
    return snap.exists() ? snap.val() : null;
  } catch (e) { return null; }
}

async function initToken() {
  if (!window.firebaseDB) return;
  const data = await getRegisterToken();
  if (!data) {
    const token = generateToken();
    await saveTokenToFirebase(token);
    await sendOrUpdateTokenMessage(token, false);
  }
}

async function rotateToken() {
  const newToken = generateToken();
  await saveTokenToFirebase(newToken);
  await sendOrUpdateTokenMessage(newToken, true);
}

// ========================
// PERFIL
// ========================
async function getSmithProfile(uid) {
  try {
    const snap = await firebaseGet(firebaseRef(firebaseDB, `smiths/${uid}`));
    return snap.exists() ? { id: uid, ...snap.val() } : null;
  } catch (e) { return null; }
}

async function getAllSmiths() {
  try {
    const snap = await firebaseGet(firebaseRef(firebaseDB, "smiths"));
    if (!snap.exists()) return [];
    return Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
  } catch (e) { return []; }
}

async function getSmiths() { return getAllSmiths(); }

// ========================
// NAVEGAÇÃO
// ========================
function showScreen(screenId) {
  const all = [
    "screen-selector", "screen-login", "screen-register",
    "screen-client", "screen-smith", "screen-admin-login", "screen-admin"
  ];
  all.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const target = document.getElementById(screenId);
  if (!target) { console.error("Tela não encontrada:", screenId); return; }
  const flexScreens = [
    "screen-selector", "screen-login", "screen-register", "screen-admin-login"
  ];
  target.style.display = flexScreens.includes(screenId) ? "flex" : "block";
}

function goTo(screen) {
  const editModal = document.getElementById("editSmithModal");
  if (editModal) editModal.style.display = "none";

  switch (screen) {
    case "selector":
      showScreen("screen-selector");
      break;
    case "login": {
      const u = document.getElementById("loginUser");
      const p = document.getElementById("loginPass");
      const e = document.getElementById("loginError");
      if (u) u.value = "";
      if (p) p.value = "";
      if (e) { e.textContent = ""; e.classList.add("hidden"); e.style.display = "none"; }
      showScreen("screen-login");
      break;
    }
    case "register":
      clearRegisterForm();
      showScreen("screen-register");
      break;
    case "client":
      showScreen("screen-client");
      // ✅ Garante Firebase inicializado antes de clientInit
      initFirebasePublic().then(() => {
        if (typeof clientInit === "function") clientInit();
      });
      break;
    case "smith":
      showScreen("screen-smith");
      if (typeof smithInit === "function") smithInit();
      break;
    case "admin-login": {
      const au = document.getElementById("adminLoginUser");
      const ap = document.getElementById("adminLoginPass");
      const ae = document.getElementById("adminLoginError");
      if (au) au.value = "";
      if (ap) ap.value = "";
      if (ae) { ae.textContent = ""; ae.classList.add("hidden"); ae.style.display = "none"; }
      showScreen("screen-admin-login");
      break;
    }
    case "admin":
      showScreen("screen-admin");
      if (typeof adminInit === "function") adminInit();
      break;
    default:
      showScreen("screen-selector");
  }
}

// ========================
// LOGIN FORJADOR
// ========================
function clearLoginForm() {
  const u = document.getElementById("loginUser");
  const p = document.getElementById("loginPass");
  const e = document.getElementById("loginError");
  if (u) u.value = "";
  if (p) p.value = "";
  if (e) { e.textContent = ""; e.classList.add("hidden"); e.style.display = "none"; }
}

async function doLogin() {
  const btn  = document.querySelector("#screen-login .btn-primary");
  const uEl  = document.getElementById("loginUser");
  const pEl  = document.getElementById("loginPass");
  const eEl  = document.getElementById("loginError");
  const user = uEl ? uEl.value.trim() : "";
  const pass = pEl ? pEl.value.trim() : "";

  if (eEl) { eEl.classList.add("hidden"); eEl.style.display = "none"; }

  if (!user || !pass) {
    if (eEl) {
      eEl.textContent = "Preencha usuário e senha.";
      eEl.classList.remove("hidden");
      eEl.style.display = "";
    }
    return;
  }

  setLoading(btn, true, "Entrando...");

  try {
    const res  = await fetch(`${window.API_URL}/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ user, password: pass })
    });
    const data = await res.json();

    if (!res.ok) {
      if (eEl) {
        eEl.textContent = data.error || "Usuário ou senha incorretos.";
        eEl.classList.remove("hidden");
        eEl.style.display = "";
      }
      setLoading(btn, false, "🔨 Entrar");
      return;
    }

    await initFirebaseClient(data.token);

    currentSmith = data.smith;
    if (eEl) { eEl.classList.add("hidden"); eEl.style.display = "none"; }
    setLoading(btn, false, "🔨 Entrar");
    goTo("smith");

  } catch (err) {
    console.error("Erro login:", err);
    if (eEl) {
      eEl.textContent = "Erro ao conectar. Tente novamente.";
      eEl.classList.remove("hidden");
      eEl.style.display = "";
    }
    setLoading(btn, false, "🔨 Entrar");
  }
}

// ========================
// ALTERAR SENHA
// ========================
function openChangePassModal() {
  const modal = document.getElementById("changePassModal");
  if (!modal) return;
  ["cpOldPass", "cpNewPass", "cpNewPassConfirm"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const errEl = document.getElementById("cpError");
  const sucEl = document.getElementById("cpSuccess");
  if (errEl) { errEl.textContent = ""; errEl.classList.add("hidden"); errEl.style.display = "none"; }
  if (sucEl) { sucEl.textContent = ""; sucEl.classList.add("hidden"); sucEl.style.display = "none"; }
  modal.style.display = "block";
  const overlay = document.getElementById("changePassOverlay");
  if (overlay) overlay.onclick = e => { if (e.target === overlay) closeChangePassModal(); };
  setTimeout(() => { const f = document.getElementById("cpOldPass"); if (f) f.focus(); }, 80);
}

function closeChangePassModal() {
  const modal = document.getElementById("changePassModal");
  if (modal) modal.style.display = "none";
}

async function doChangePassword() {
  const oldPass    = document.getElementById("cpOldPass")?.value.trim();
  const newPass    = document.getElementById("cpNewPass")?.value.trim();
  const newConfirm = document.getElementById("cpNewPassConfirm")?.value.trim();
  const btn        = document.getElementById("cpSaveBtn");
  const errEl      = document.getElementById("cpError");
  const sucEl      = document.getElementById("cpSuccess");

  if (errEl) { errEl.textContent = ""; errEl.classList.add("hidden"); errEl.style.display = "none"; }
  if (sucEl) { sucEl.textContent = ""; sucEl.classList.add("hidden"); sucEl.style.display = "none"; }

  if (!oldPass)               { showCpError("Preencha a senha atual."); return; }
  if (!newPass)               { showCpError("Preencha a nova senha."); return; }
  if (newPass.length < 6)     { showCpError("A nova senha deve ter ao menos 6 caracteres."); return; }
  if (newPass !== newConfirm) { showCpError("As senhas não coincidem."); return; }
  if (oldPass === newPass)    { showCpError("A nova senha deve ser diferente da atual."); return; }

  setLoading(btn, true, "Salvando...");

  try {
    const checkRes = await fetch(`${window.API_URL}/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ user: currentSmith.user, password: oldPass })
    });
    if (!checkRes.ok) {
      showCpError("Senha atual incorreta.");
      setLoading(btn, false, "💾 Salvar Nova Senha");
      return;
    }

    const res  = await fetch(`${window.API_URL}/change-password`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ uid: currentSmith.id, newPassword: newPass })
    });
    const data = await res.json();

    if (!res.ok) {
      showCpError(data.error || "Erro ao alterar senha.");
      setLoading(btn, false, "💾 Salvar Nova Senha");
      return;
    }

    if (typeof addLog === "function")
      addLog("edit", `Forjador "${currentSmith.displayName}" alterou a própria senha.`);

    if (sucEl) {
      sucEl.textContent = "✅ Senha alterada com sucesso!";
      sucEl.classList.remove("hidden");
      sucEl.style.display = "";
    }
    setLoading(btn, false, "💾 Salvar Nova Senha");
    setTimeout(() => closeChangePassModal(), 2000);

  } catch (err) {
    console.error(err);
    showCpError("Erro ao conectar. Tente novamente.");
    setLoading(btn, false, "💾 Salvar Nova Senha");
  }
}

function showCpError(msg) {
  const el = document.getElementById("cpError");
  if (el) { el.textContent = msg; el.classList.remove("hidden"); el.style.display = ""; }
}

// ========================
// REGISTRO
// ========================
function clearRegisterForm() {
  ["regDisplayName","regPassport","regUser","regPass","regPassConfirm","regToken"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  const e = document.getElementById("regError");
  const s = document.getElementById("regSuccess");
  if (e) { e.textContent = ""; e.classList.add("hidden"); e.style.display = "none"; }
  if (s) { s.textContent = ""; s.classList.add("hidden"); s.style.display = "none"; }
}

async function doRegister() {
  const displayName = document.getElementById("regDisplayName").value.trim();
  const passport    = document.getElementById("regPassport").value.trim();
  const user        = document.getElementById("regUser").value.trim();
  const pass        = document.getElementById("regPass").value.trim();
  const passConfirm = document.getElementById("regPassConfirm").value.trim();
  const token       = document.getElementById("regToken").value.trim().toUpperCase();
  const btn         = document.getElementById("regBtn");

  hideRegMessages();

  if (!displayName)         { showRegError("Preencha o nome na cidade.");               return; }
  if (!passport)            { showRegError("Preencha o ID / Passaporte.");              return; }
  if (!user)                { showRegError("Preencha o usuário de login.");             return; }
  if (user.length < 3)      { showRegError("Usuário deve ter ao menos 3 caracteres."); return; }
  if (!pass)                { showRegError("Preencha a senha.");                        return; }
  if (pass.length < 4)      { showRegError("Senha deve ter ao menos 4 caracteres.");   return; }
  if (pass !== passConfirm) { showRegError("As senhas não coincidem.");                 return; }
  if (!token)               { showRegError("Preencha a chave de cadastro.");            return; }

  setLoading(btn, true, "Cadastrando...");

  try {
    const res  = await fetch(`${window.API_URL}/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ displayName, passport, user, password: pass, token })
    });
    const data = await res.json();

    if (!res.ok) {
      showRegError(data.error || "Erro ao cadastrar.");
      setLoading(btn, false, "📝 Cadastrar");
      return;
    }

    await fetch(`${window.API_URL}/rotate-token`, { method: "POST" });

    const sEl = document.getElementById("regSuccess");
    if (sEl) {
      sEl.textContent = `✅ Forjador "${data.displayName}" cadastrado com sucesso!`;
      sEl.classList.remove("hidden");
      sEl.style.display = "";
    }
    setLoading(btn, false, "📝 Cadastrar");

    setTimeout(() => {
      goTo("login");
      const lu = document.getElementById("loginUser");
      if (lu) lu.value = data.user;
    }, 2000);

  } catch (err) {
    console.error(err);
    showRegError("Erro ao conectar. Tente novamente.");
    setLoading(btn, false, "📝 Cadastrar");
  }
}

function showRegError(msg) {
  const el = document.getElementById("regError");
  if (el) { el.textContent = msg; el.classList.remove("hidden"); el.style.display = ""; }
}

function hideRegMessages() {
  const e = document.getElementById("regError");
  const s = document.getElementById("regSuccess");
  if (e) { e.textContent = ""; e.classList.add("hidden"); e.style.display = "none"; }
  if (s) { s.textContent = ""; s.classList.add("hidden"); s.style.display = "none"; }
}

function toggleRegPassword(fieldId, btnId) {
  const input = document.getElementById(fieldId);
  const btn   = document.getElementById(btnId);
  if (!input || !btn) return;
  input.type      = input.type === "password" ? "text" : "password";
  btn.textContent = input.type === "password" ? "👁️" : "🙈";
}

// ========================
// LOGOUT
// ========================
async function doLogout() {
  try {
    if (window.firebaseAuth && window.firebaseSignOut)
      await window.firebaseSignOut(window.firebaseAuth);
  } catch (e) { console.error(e); }
  currentSmith = null;
  if (window._queueListener) {
    window._queueListener();
    window._queueListener = null;
  }
  goTo("selector");
}

// ========================
// LOADING
// ========================
function setLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled      = loading;
  btn.textContent   = text;
  btn.style.opacity = loading ? "0.7" : "1";
}

// ========================
// INIT
// ========================
function authInit() {
  console.log("🔐 authInit rodando...");

  [
    "loginError", "adminLoginError", "regError", "regSuccess",
    "editSmithError", "adminPassError", "adminPassSuccess",
    "cpError", "cpSuccess"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.add("hidden"); el.style.display = "none"; }
  });

  ["editSmithModal", "changePassModal"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display = "none"; }
  });

  const lp = document.getElementById("loginPass");
  const lu = document.getElementById("loginUser");
  if (lp) lp.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
  if (lu) lu.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });

  showScreen("screen-selector");
}

if (document.readyState === "complete") {
  authInit();
} else {
  window.addEventListener("load", authInit);
}

// ========================
// API URL + FIREBASE READY
// ========================
window.API_URL = "/api";

window._firebaseReady = true;
document.dispatchEvent(new Event("firebaseReady"));
window._appLoaded = true;

// ========================
// DATA - RECEITAS
// ========================
const MATERIALS_RECIPE = {
  "Espadas e Machados Encantados": {
    "Pó Estelar": 3, "Elemento Primordial": 1, "Cristal": 3,
    "Pedra da Lua": 3, "Essência de Luz": 1, "Pedra Rúnica": 1, "Ferro Mágico": 1
  },
  "Espadas e Machados Básicos": {
    "Cristal": 3, "Ferro Mágico": 1, "Pedra Rúnica": 1, "Elemento Primordial": 1
  },
  "Lanças Encantadas": {
    "Pérola Abissal": 3, "Elemento Primordial": 1, "Cristal": 3,
    "Pedra da Lua": 3, "Madeira Mágica": 1, "Pó Estelar": 1, "Ferro Mágico": 1
  },
  "Lanças Básicas": {
    "Pérola Abissal": 3, "Elemento Primordial": 1, "Cristal": 3,
    "Pedra da Lua": 3, "Madeira Mágica": 1
  },
  "Adagas e Leques Encantados": {
    "Pó Estelar": 3, "Elemento Primordial": 1, "Cristal": 3,
    "Pedra da Lua": 3, "Essência de Luz": 1, "Pedra Rúnica": 1, "Ferro Mágico": 1
  },
  "Adagas e Leques Básicos": {
    "Elemento Primordial": 1, "Cristal": 3, "Pedra Rúnica": 1, "Ferro Mágico": 1
  },
  "Foices Encantadas": {
    "Pó Estelar": 3, "Elemento Primordial": 1, "Cristal": 3,
    "Pedra da Lua": 3, "Essência de Luz": 1, "Pedra Rúnica": 1, "Ferro Mágico": 1
  },
  "Foices Básicas": {
    "Elemento Primordial": 1, "Cristal": 3, "Pedra Rúnica": 1, "Ferro Mágico": 1
  },
  "Tridentes Encantados": {
    "Pérola Abissal": 3, "Elemento Primordial": 1, "Cristal": 3,
    "Pedra da Lua": 3, "Madeira Mágica": 1, "Pó Estelar": 1, "Ferro Mágico": 1
  },
  "Tridentes Básicos": {
    "Pérola Abissal": 3, "Elemento Primordial": 1, "Cristal": 3,
    "Pedra da Lua": 3, "Madeira Mágica": 1
  },
  "Arcos Encantados": {
    "Pena de Anjo": 3, "Elemento Primordial": 3, "Cristal": 3,
    "Madeira Mágica": 3, "Essência de Luz": 1, "Meteorito": 1,
    "Ferro Mágico": 1
  },
  "Arcos Básicos": {
    "Pena de Anjo": 3, "Elemento Primordial": 2, "Cristal": 3,
    "Madeira Mágica": 3
  },
  "Flechas": {
    "Pena de Anjo": 10, "Pedra Rúnica": 10, "Linha Mágica": 10
  }
};

const WEAPON_DATA = [
  { name: "Skulldragonbow",  category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  { name: "Tryandebow",      category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  { name: "Leviatabow",      category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  { name: "Wingbow",         category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  { name: "Vulkanbow",       category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  { name: "Bloodbow",        category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  { name: "Colorbow",        category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  { name: "Glowybow",        category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Crystalbow",      category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Fantasybow",      category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Elegybow",        category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Eternalbow",      category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Harpbow",         category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Rambow",          category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Dragonbow",       category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Evilskullbow",    category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Holystaff",       category: "Lanças Encantadas",             icon: "🔱", price: 27000 },
  { name: "Gungnir",         category: "Lanças Encantadas",             icon: "🔱", price: 27000 },
  { name: "Chastiefolgear",  category: "Lanças Encantadas",             icon: "🔱", price: 27000 },
  { name: "Skyspear",        category: "Lanças Encantadas",             icon: "🔱", price: 27000 },
  { name: "Spear",           category: "Lanças Básicas",                icon: "🔱", price: 15000 },
  { name: "Bident",          category: "Lanças Básicas",                icon: "🔱", price: 15000 },
  { name: "Heavenlyspear",   category: "Lanças Básicas",                icon: "🔱", price: 15000 },
  { name: "Bloodspear",      category: "Lanças Básicas",                icon: "🔱", price: 15000 },
  { name: "Mortalfan",       category: "Adagas e Leques Básicos",       icon: "🗡️", price: 15000 },
  { name: "Fantasyknife",    category: "Adagas e Leques Encantados",    icon: "🗡️", price: 27000 },
  { name: "Killerdagger",    category: "Adagas e Leques Encantados",    icon: "🗡️", price: 27000 },
  { name: "Motherfan",       category: "Adagas e Leques Encantados",    icon: "🗡️", price: 27000 },
  { name: "Bluefan",         category: "Adagas e Leques Encantados",    icon: "🗡️", price: 27000 },
  { name: "Purplefan",       category: "Adagas e Leques Encantados",    icon: "🗡️", price: 27000 },
  { name: "Warglaive",       category: "Adagas e Leques Encantados",    icon: "🗡️", price: 27000 },
  { name: "Scifiscyther",    category: "Foices Básicas",                icon: "⚔️", price: 15000 },
  { name: "Crimsonmoon",     category: "Foices Básicas",                icon: "⚔️", price: 15000 },
  { name: "Bellscyther",     category: "Foices Encantadas",             icon: "⚔️", price: 27000 },
  { name: "Naturescyther",   category: "Foices Encantadas",             icon: "⚔️", price: 27000 },
  { name: "Deathscyther",    category: "Foices Encantadas",             icon: "⚔️", price: 27000 },
  { name: "Venthyrscyther",  category: "Foices Encantadas",             icon: "⚔️", price: 27000 },
  { name: "Tridentberilion", category: "Tridentes Encantados",          icon: "🔱", price: 27000 },
  { name: "Goldentrident",   category: "Tridentes Encantados",          icon: "🔱", price: 27000 },
  { name: "Levitrident",     category: "Tridentes Encantados",          icon: "🔱", price: 27000 },
  { name: "Verticeabissal",  category: "Tridentes Encantados",          icon: "🔱", price: 27000 },
  { name: "Greentrident",    category: "Tridentes Básicos",             icon: "🔱", price: 15000 },
  { name: "Ancient Blade",   category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "Scifi",           category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "Blood King",      category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "Astral Blade",    category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "Haran Blade",     category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "Sekira Axe",      category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "Naha",            category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "RWolf",           category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "Guts",            category: "Espadas e Machados Básicos",    icon: "⚔️", price: 15000 },
  { name: "Guts2",           category: "Espadas e Machados Básicos",    icon: "⚔️", price: 15000 },
  { name: "Acheron",         category: "Espadas e Machados Básicos",    icon: "⚔️", price: 15000 },
  { name: "Gryphon",         category: "Espadas e Machados Básicos",    icon: "⚔️", price: 15000 },
];

const CATEGORIES = [...new Set(WEAPON_DATA.map(w => w.category))];

// ========================
// SHARED UTILS
// ========================
function openWeaponPreview(name, imgSrc, icon) {
  const existing = document.getElementById("weaponPreviewModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "weaponPreviewModal";
  modal.innerHTML = `
    <div class="wp-backdrop" id="wpBackdrop"></div>
    <div class="wp-box">
      <button class="wp-close" id="wpCloseBtn">✕</button>
      <div class="wp-img-wrap">
        <img
          id="wpMainImg"
          src="${imgSrc}"
          alt="${name}"
          class="wp-img"
          onerror="
            this.style.display='none';
            document.getElementById('wpImgFallback').style.display='flex';
          "
        />
        <div id="wpImgFallback" class="wp-img-fallback" style="display:none;">${icon}</div>
      </div>
      <div class="wp-name">${name}</div>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("wp-visible"));
  document.getElementById("wpBackdrop").addEventListener("click", closeWeaponPreview);
  document.getElementById("wpCloseBtn").addEventListener("click", closeWeaponPreview);
  document._wpEscHandler = function(e) {
    if (e.key === "Escape") closeWeaponPreview();
  };
  document.addEventListener("keydown", document._wpEscHandler);
}

function closeWeaponPreview() {
  const modal = document.getElementById("weaponPreviewModal");
  if (!modal) return;
  modal.classList.remove("wp-visible");
  modal.classList.add("wp-hiding");
  setTimeout(() => {
    modal.remove();
    document.removeEventListener("keydown", document._wpEscHandler);
  }, 250);
}

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function sanitizeId(name) {
  return name.replace(/[^a-zA-Z0-9]/g, "_");
}

function showNotif(msg, color) {
  const el = document.getElementById("notif");
  el.textContent = msg;
  el.style.background = color || "#7b2fff";
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2800);
}

function calculateMaterials(entries, arrows) {
  const totals = {};
  const add = (recipe, mult) => {
    Object.entries(recipe).forEach(([mat, qty]) => {
      totals[mat] = (totals[mat] || 0) + qty * mult;
    });
  };
  entries.forEach(([name, qty]) => {
    const w = WEAPON_DATA.find(x => x.name === name);
    if (w && MATERIALS_RECIPE[w.category]) add(MATERIALS_RECIPE[w.category], qty);
  });
  if (arrows > 0) {
    const sets = Math.ceil(arrows / 100);
    add(MATERIALS_RECIPE["Flechas"], sets);
  }
  return totals;
}

function buildResumeText(entries, arrows, clientInfo) {
  let text = "=== PEDIDO DE ARMAS ===\n";
  if (clientInfo) {
    text += `👤 Cliente: ${clientInfo.name}\n`;
    text += `🪪 Passaporte: ${clientInfo.passport}\n`;
  }
  text += "\n📦 ITENS:\n";
  let total = 0;
  entries.forEach(([name, qty]) => {
    const w = WEAPON_DATA.find(x => x.name === name);
    if (!w) return;
    const sub = w.price * qty;
    total += sub;
    text += `  • ${name} ×${qty} — ${formatCurrency(sub)}\n`;
  });
  if (arrows > 0) {
    const sets  = Math.ceil(arrows / 100);
    const cost  = sets * 10000;
    total      += cost;
    text       += `  • Flechas ×${arrows} — ${formatCurrency(cost)}\n`;
  }
  const mats = calculateMaterials(entries, arrows);
  text += "\n⚗️ MATERIAIS NECESSÁRIOS:\n";
  Object.entries(mats).sort((a,b) => b[1]-a[1])
    .forEach(([mat, qty]) => { text += `  • ${mat}: ${qty}x\n`; });
  text += `\n💰 TOTAL: ${formatCurrency(total)}`;
  return text;
}

function renderSummary(prefix, selectedWeapons, arrowQty, showMaterials = true) {
  const listEl     = document.getElementById(`${prefix}SelectedList`);
  const matSection = document.getElementById(`${prefix}MaterialsSection`);
  const matGrid    = document.getElementById(`${prefix}MaterialGrid`);
  const entries    = Object.entries(selectedWeapons);
  const hasArrows  = arrowQty > 0;
  const hasItems   = entries.length > 0 || hasArrows;

  if (!hasItems) {
    listEl.innerHTML = `
      <div class="empty-state">
        Nenhum item selecionado.<br/>Clique nas armas para adicionar.
      </div>`;
    if (matSection) matSection.style.display = "none";
    document.getElementById(`${prefix}TotalValue`).textContent = "R$ 0,00";
    document.getElementById(`${prefix}ItemCount`).textContent  = "0 itens selecionados";
    return;
  }

  let total = 0, count = 0, html = "";

  entries.forEach(([name, qty]) => {
    const w = WEAPON_DATA.find(x => x.name === name);
    if (!w) return;
    const sub = w.price * qty;
    total += sub; count += qty;
    html += `
      <div class="selected-item-row">
        <span class="item-name">${w.icon} ${name} ×${qty}</span>
        <span style="display:flex;align-items:center;gap:6px;">
          <span class="item-price">${formatCurrency(sub)}</span>
          <button class="remove-btn" onclick="${prefix}RemoveItem('${name.replace(/'/g, "\\'")}')">✕</button>
        </span>
      </div>`;
  });

  if (hasArrows) {
    const sets = Math.ceil(arrowQty / 100);
    const cost = sets * 10000;
    total += cost; count += arrowQty;
    html += `
      <div class="selected-item-row">
        <span class="item-name">🏹 Flechas ×${arrowQty}</span>
        <span class="item-price">${formatCurrency(cost)}</span>
      </div>`;
  }

  listEl.innerHTML = html;

  if (matSection) {
    if (showMaterials) {
      const mats = calculateMaterials(entries, arrowQty);
      matSection.style.display = "block";
      if (matGrid) {
        matGrid.innerHTML = Object.entries(mats)
          .sort((a, b) => b[1] - a[1])
          .map(([mat, qty]) => `
            <div class="material-item">
              <span class="mat-name">${mat}</span>
              <span class="mat-qty">${qty}x</span>
            </div>`).join("");
      }
    } else {
      matSection.style.display = "none";
    }
  }

  document.getElementById(`${prefix}TotalValue`).textContent = formatCurrency(total);
  document.getElementById(`${prefix}ItemCount`).textContent  =
    `${entries.length + (hasArrows ? 1 : 0)} tipo(s) — ${count} unidade(s)`;
}

function buildWeaponGrid(prefix, selectedWeapons, activeCategory, searchVal) {
  const grid = document.getElementById(`${prefix}WeaponsGrid`);
  const list = WEAPON_DATA.filter(w => {
    const matchCat    = activeCategory === "Todos" || w.category === activeCategory;
    const matchSearch = w.name.toLowerCase().includes(searchVal.toLowerCase());
    return matchCat && matchSearch;
  });

  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#4a4a7a;padding:30px;">Nenhuma arma encontrada.</div>`;
    return;
  }

  grid.innerHTML = list.map(w => {
    const qty         = selectedWeapons[w.name] || 0;
    const isEnchanted = w.category.toLowerCase().includes("encantad");
    const imgSrc      = `image/${w.name}.png`;
    const imgId       = `${prefix}img-${sanitizeId(w.name)}`;
    const safeName    = w.name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

    return `
      <div class="weapon-card ${qty > 0 ? "selected" : ""}" id="${prefix}card-${sanitizeId(w.name)}">
        ${isEnchanted ? '<div class="enchanted-badge"></div>' : ""}
        <div class="weapon-img-wrap"
          onclick="openWeaponPreview('${safeName}', '${imgSrc}', '${w.icon}')"
          title="Clique para ampliar">
          <img
            id="${imgId}"
            src="${imgSrc}"
            alt="${w.name}"
            class="weapon-img"
            onerror="this.style.display='none';document.getElementById('${imgId}-fallback').style.display='flex';"
          />
          <div
            id="${imgId}-fallback"
            class="weapon-img-fallback"
            style="display:none;"
          >${w.icon}</div>
        </div>
        <div class="name">${w.name}</div>
        <div class="category-tag">${w.category}</div>
        <div class="price-tag">${formatCurrency(w.price)}</div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="${prefix}ChangeQty('${safeName}', -1, event)">−</button>
          <span class="qty-display">${qty}</span>
          <button class="qty-btn" onclick="${prefix}ChangeQty('${safeName}', 1, event)">+</button>
        </div>
      </div>`;
  }).join("");
}

function buildCategoryTabs(prefix, activeCategory) {
  const container = document.getElementById(`${prefix}CategoryTabs`);
  const all = ["Todos", ...CATEGORIES];
  container.innerHTML = all.map(cat => `
    <button class="tab-btn ${cat === activeCategory ? "active" : ""}"
      onclick="${prefix}SetCategory('${cat.replace(/'/g,"\\'")}')">
      ${cat}
    </button>`).join("");
}
