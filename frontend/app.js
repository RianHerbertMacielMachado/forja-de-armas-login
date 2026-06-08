// ============================================================
// FORGE APP — app.js
// ============================================================

const TOKEN_WEBHOOK =
  "https://discord.com/api/webhooks/1510332405754499142/IegWcsQp-JSkI1aBJH08B3fN-yifPXdRwmXt1n_cXUwn9L0cCTr905UffrhBxjr9HRum";

// ── Tema ─────────────────────────────────────────────────────
async function loadSavedTheme() {
  try {
    if (window.firebaseDB && window.firebaseGet && window.firebaseRef) {
      const snap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, "config/theme"));
      const theme = snap.exists() ? snap.val() : "arcana";
      applyThemeLayout(theme);
      console.log("🎨 Tema carregado:", theme);
    } else {
      applyThemeLayout("arcana");
    }
  } catch {
    applyThemeLayout("arcana");
  }
}

function applyThemeLayout(themeId) {
  document.body.setAttribute("data-theme", themeId);
  document.body.className = document.body.className
    .replace(/theme-\S+/g, "")
    .trim();
  document.body.classList.add(`theme-${themeId}`);
  window._currentTheme = themeId;

  // Reordenar DOM por tema
  const layouts = {
    cyberpunk: applyCyberpunkLayout,
    blood:     applyBloodLayout,
    forest:    applyForestLayout,
    gold:      applyGoldLayout,
    ice:       applyIceLayout,
    arcana:    applyArcanaLayout,
  };
  if (layouts[themeId]) layouts[themeId]();
}

function applyArcanaLayout() {
  document.querySelectorAll(".theme-sidebar").forEach(el => el.remove());
  const app = document.getElementById("app");
  if (app) app.className = "app-arcana";
}

function applyCyberpunkLayout() {
  document.querySelectorAll(".theme-sidebar").forEach(el => el.remove());
  const smithScreen = document.getElementById("screen-smith");
  if (!smithScreen) return;
  let sidebar = smithScreen.querySelector(".theme-sidebar");
  if (!sidebar) {
    sidebar = document.createElement("div");
    sidebar.className = "theme-sidebar";
    sidebar.innerHTML = `
      <div class="sidebar-logo">⚔ FORGE</div>
      <nav class="sidebar-nav">
        <button onclick="showSmithTab('tab-orders')" class="sb-btn">📋 PEDIDOS</button>
        <button onclick="showSmithTab('tab-history')" class="sb-btn">📜 HISTÓRICO</button>
        <button onclick="openChangePasswordModal()" class="sb-btn">🔐 SENHA</button>
        <button onclick="doLogout()" class="sb-btn sb-logout">⏻ SAIR</button>
      </nav>`;
    smithScreen.insertBefore(sidebar, smithScreen.firstChild);
  }
}

function applyBloodLayout() {
  document.querySelectorAll(".theme-sidebar").forEach(el => el.remove());
}

function applyForestLayout() {
  document.querySelectorAll(".theme-sidebar").forEach(el => el.remove());
}

function applyGoldLayout() {
  document.querySelectorAll(".theme-sidebar").forEach(el => el.remove());
}

function applyIceLayout() {
  document.querySelectorAll(".theme-sidebar").forEach(el => el.remove());
}

// ── Firebase Público ──────────────────────────────────────────
async function initFirebasePublic() {
  if (window.firebaseDB) return true;
  try {
    const { initializeApp, getApps } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"
    );
    const { getDatabase, ref, set, get, push, remove, onValue } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"
    );
    const firebaseConfig = {
      apiKey: "AIzaSyA2C9_me50ygxsjS_95vQfJ7raRT_1UGlA",
      authDomain: "forjadores-1a9ce.firebaseapp.com",
      databaseURL: "https://forjadores-1a9ce-default-rtdb.firebaseio.com",
      projectId: "forjadores-1a9ce",
    };
    const app =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getDatabase(app);
    window.firebaseDB       = db;
    window.firebaseRef      = ref;
    window.firebaseSet      = set;
    window.firebaseGet      = get;
    window.firebasePush     = push;
    window.firebaseRemove   = remove;
    window.firebaseOnValue  = onValue;
    await loadSavedTheme();
    console.log("✅ Firebase público inicializado (leitura anônima).");
    return true;
  } catch (err) {
    console.error("❌ Erro ao inicializar Firebase público:", err);
    return false;
  }
}

// ── Firebase Cliente (autenticado) ────────────────────────────
async function initFirebaseClient(customToken) {
  try {
    const { initializeApp, getApps } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"
    );
    const { getDatabase, ref, set, get, push, remove, onValue } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"
    );
    const { getAuth, signInWithCustomToken } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"
    );
    const firebaseConfig = {
      apiKey: "AIzaSyA2C9_me50ygxsjS_95vQfJ7raRT_1UGlA",
      authDomain: "forjadores-1a9ce.firebaseapp.com",
      databaseURL: "https://forjadores-1a9ce-default-rtdb.firebaseio.com",
      projectId: "forjadores-1a9ce",
    };
    const app =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db   = getDatabase(app);
    const auth = getAuth(app);
    window.firebaseDB       = db;
    window.firebaseRef      = ref;
    window.firebaseSet      = set;
    window.firebaseGet      = get;
    window.firebasePush     = push;
    window.firebaseRemove   = remove;
    window.firebaseOnValue  = onValue;
    window.firebaseAuth     = auth;
    window.firebaseSignOut  = () => import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js").then(m => m.signOut(auth));
    if (customToken) await signInWithCustomToken(auth, customToken);
    await loadSavedTheme();
    return true;
  } catch (err) {
    console.error("❌ Erro ao inicializar Firebase cliente:", err);
    return false;
  }
}

// ── Token de Cadastro ─────────────────────────────────────────
function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function saveTokenToFirebase(token) {
  await window.firebaseSet(window.firebaseRef(window.firebaseDB, "config/registerToken"), {
    token, usado: false, createdAt: Date.now(),
  });
}

async function getRegisterToken() {
  const snap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, "config/registerToken"));
  return snap.exists() ? snap.val() : null;
}

async function sendOrUpdateTokenMessage(token, isUpdate = false) {
  try {
    const msgIdSnap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, "config/tokenMessageId"));
    const msgId     = msgIdSnap.exists() ? msgIdSnap.val() : null;
    const payload   = {
      embeds: [{
        title: isUpdate ? "🔄 Chave de Cadastro Atualizada" : "🔑 Chave de Cadastro Gerada",
        description: `\`\`\`\n${token}\n\`\`\`\n> Use esta chave para registrar um novo forjador.\n> A chave é de uso único e expira ao ser utilizada.`,
        color: isUpdate ? 0xf59e0b : 0x7b2fff,
        footer: { text: `Gerada em: ${new Date().toLocaleString("pt-BR")}` },
      }],
    };
    if (msgId) {
      const res = await fetch(`${TOKEN_WEBHOOK}/messages/${msgId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("patch failed");
    } else {
      const res  = await fetch(`${TOKEN_WEBHOOK}?wait=true`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      await window.firebaseSet(window.firebaseRef(window.firebaseDB, "config/tokenMessageId"), data.id);
    }
  } catch (err) {
    console.warn("Erro ao enviar token para Discord:", err);
  }
}

async function initToken() {
  const existing = await getRegisterToken();
  if (!existing || existing.usado) {
    const token = generateToken();
    await saveTokenToFirebase(token);
    await sendOrUpdateTokenMessage(token, false);
  }
}

async function rotateToken() {
  const token = generateToken();
  await saveTokenToFirebase(token);
  await sendOrUpdateTokenMessage(token, true);
  return token;
}

// ── Perfis de Forjadores ──────────────────────────────────────
async function getSmithProfile(userId) {
  const snap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, `smiths/${userId}`));
  return snap.exists() ? snap.val() : null;
}

async function getAllSmiths() {
  const snap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, "smiths"));
  if (!snap.exists()) return [];
  const obj = snap.val();
  return Object.entries(obj).map(([id, data]) => ({ id, ...data }));
}

window.getSmiths = getAllSmiths;

// ── Navegação ─────────────────────────────────────────────────
let currentSmith = null;

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

async function goTo(screen) {
  if (screen === "selector") { showScreen("screen-selector"); return; }
  if (screen === "client") {
    showScreen("screen-client");
    await initFirebasePublic();
    if (typeof clientInit === "function") clientInit();
    return;
  }
  if (screen === "smith") {
    showScreen("screen-smith");
    if (typeof smithInit === "function") smithInit();
    return;
  }
  if (screen === "admin") {
    showScreen("screen-admin");
    if (typeof adminInit === "function") adminInit();
    return;
  }
  if (screen === "login") { showScreen("screen-login"); return; }
  if (screen === "register") { showScreen("screen-register"); return; }
}

// ── Auth Init ─────────────────────────────────────────────────
async function authInit() {
  console.log("🔐 authInit rodando...");
  await initFirebasePublic();
  const saved = sessionStorage.getItem("currentSmith");
  if (saved) {
    try {
      currentSmith = JSON.parse(saved);
      await initFirebaseClient(currentSmith.customToken);
      goTo("smith");
      return;
    } catch { sessionStorage.removeItem("currentSmith"); }
  }
  goTo("selector");
}

// ── Login / Logout ────────────────────────────────────────────
async function doLogin() {
  const user = document.getElementById("login-user")?.value.trim();
  const pass = document.getElementById("login-pass")?.value.trim();
  const err  = document.getElementById("login-error");
  if (!user || !pass) { if (err) err.textContent = "Preencha todos os campos."; return; }
  try {
    const snap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, "smiths"));
    if (!snap.exists()) { if (err) err.textContent = "Usuário ou senha incorretos."; return; }
    const smiths = snap.val();
    const entry  = Object.entries(smiths).find(([, v]) => v.user === user && v.pass === pass);
    if (!entry) { if (err) err.textContent = "Usuário ou senha incorretos."; return; }
    const [id, data] = entry;
    const res = await fetch("/api/firebase-token", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid: id }),
    });
    const { customToken } = await res.json();
    currentSmith = { id, ...data, customToken };
    sessionStorage.setItem("currentSmith", JSON.stringify(currentSmith));
    await initFirebaseClient(customToken);
    goTo("smith");
  } catch (e) {
    if (err) err.textContent = "Erro ao fazer login.";
    console.error(e);
  }
}

async function doLogout() {
  sessionStorage.removeItem("currentSmith");
  currentSmith = null;
  if (window.firebaseSignOut) await window.firebaseSignOut();
  goTo("selector");
}

// ── Registro ──────────────────────────────────────────────────
async function doRegister() {
  const name     = document.getElementById("reg-name")?.value.trim();
  const passport = document.getElementById("reg-passport")?.value.trim();
  const user     = document.getElementById("reg-user")?.value.trim();
  const pass     = document.getElementById("reg-pass")?.value.trim();
  const token    = document.getElementById("reg-token")?.value.trim().toUpperCase();
  const err      = document.getElementById("reg-error");
  if (!name || !passport || !user || !pass || !token) {
    if (err) err.textContent = "Preencha todos os campos."; return;
  }
  try {
    const tokenData = await getRegisterToken();
    if (!tokenData || tokenData.token !== token || tokenData.usado) {
      if (err) err.textContent = "Chave de cadastro inválida ou já utilizada."; return;
    }
    const smithsSnap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, "smiths"));
    if (smithsSnap.exists()) {
      const smiths = smithsSnap.val();
      if (Object.values(smiths).some(s => s.user === user)) {
        if (err) err.textContent = "Nome de usuário já existe."; return;
      }
      if (Object.values(smiths).some(s => s.passport === passport)) {
        if (err) err.textContent = "Passaporte já cadastrado."; return;
      }
    }
    const newRef = window.firebasePush(window.firebaseRef(window.firebaseDB, "smiths"));
    await window.firebaseSet(newRef, {
      displayName: name, passport, user, pass, createdAt: Date.now(),
    });
    await window.firebaseSet(window.firebaseRef(window.firebaseDB, "config/registerToken"), {
      ...tokenData, usado: true,
    });
    await rotateToken();
    document.getElementById("reg-success").style.display = "block";
    setTimeout(() => goTo("login"), 2000);
  } catch (e) {
    if (err) err.textContent = "Erro ao registrar.";
    console.error(e);
  }
}

// ── Alterar Senha (Forjador) ──────────────────────────────────
async function doChangePassword() {
  const oldP = document.getElementById("cp-old")?.value.trim();
  const newP = document.getElementById("cp-new")?.value.trim();
  const cnf  = document.getElementById("cp-confirm")?.value.trim();
  const err  = document.getElementById("cp-error");
  const ok   = document.getElementById("cp-success");
  if (!oldP || !newP || !cnf) { if (err) err.textContent = "Preencha todos os campos."; return; }
  if (newP !== cnf)            { if (err) err.textContent = "As senhas não coincidem."; return; }
  if (currentSmith?.pass !== oldP) { if (err) err.textContent = "Senha atual incorreta."; return; }
  try {
    await window.firebaseSet(window.firebaseRef(window.firebaseDB, `smiths/${currentSmith.id}/pass`), newP);
    currentSmith.pass = newP;
    sessionStorage.setItem("currentSmith", JSON.stringify(currentSmith));
    if (ok) { ok.style.display = "block"; setTimeout(() => { ok.style.display = "none"; }, 2500); }
    if (err) err.textContent = "";
    closeChangePasswordModal();
  } catch (e) {
    if (err) err.textContent = "Erro ao alterar senha.";
  }
}

function openChangePasswordModal() {
  const m = document.getElementById("modal-change-password");
  if (m) m.style.display = "flex";
}
function closeChangePasswordModal() {
  const m = document.getElementById("modal-change-password");
  if (m) m.style.display = "none";
  ["cp-old","cp-new","cp-confirm"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  const err = document.getElementById("cp-error"); if (err) err.textContent = "";
}

// ── Dados de Armas ────────────────────────────────────────────
const MATERIALS_RECIPE = {
  Espadas:   { titosFundidos: 15, placasAco: 8,  couroReforçado: 5, cristalMagico: 0, penasFenix: 0  },
  Arcos:     { titosFundidos: 10, placasAco: 5,  couroReforçado: 8, cristalMagico: 2, penasFenix: 3  },
  Lanças:    { titosFundidos: 12, placasAco: 10, couroReforçado: 4, cristalMagico: 0, penasFenix: 0  },
  Cajados:   { titosFundidos: 8,  placasAco: 4,  couroReforçado: 3, cristalMagico: 8, penasFenix: 2  },
  Machados:  { titosFundidos: 18, placasAco: 12, couroReforçado: 6, cristalMagico: 0, penasFenix: 0  },
  Foices:    { titosFundidos: 14, placasAco: 9,  couroReforçado: 5, cristalMagico: 3, penasFenix: 0  },
  Adagas:    { titosFundidos: 8,  placasAco: 6,  couroReforçado: 7, cristalMagico: 1, penasFenix: 0  },
  Tridentes: { titosFundidos: 13, placasAco: 11, couroReforçado: 4, cristalMagico: 0, penasFenix: 0  },
  Leques:    { titosFundidos: 7,  placasAco: 3,  couroReforçado: 9, cristalMagico: 4, penasFenix: 1  },
};

const WEAPON_DATA = [
  { name:"Acheron",         category:"Espadas",   icon:"⚔️",  price:150 },
  { name:"Ancient Blade",   category:"Espadas",   icon:"⚔️",  price:180 },
  { name:"Astral Blade",    category:"Espadas",   icon:"⚔️",  price:200 },
  { name:"Blood King",      category:"Espadas",   icon:"⚔️",  price:220 },
  { name:"Haran Blade",     category:"Espadas",   icon:"⚔️",  price:170 },
  { name:"Warglaive",       category:"Espadas",   icon:"⚔️",  price:190 },
  { name:"Herritt",         category:"Espadas",   icon:"⚔️",  price:160 },
  { name:"Glowybow",        category:"Arcos",     icon:"🏹",  price:140 },
  { name:"Skulldragonbow",  category:"Arcos",     icon:"🏹",  price:160 },
  { name:"Bloodbow",        category:"Arcos",     icon:"🏹",  price:150 },
  { name:"Colorbow",        category:"Arcos",     icon:"🏹",  price:130 },
  { name:"Crystalbow",      category:"Arcos",     icon:"🏹",  price:145 },
  { name:"Dragonbow",       category:"Arcos",     icon:"🏹",  price:170 },
  { name:"Elegybow",        category:"Arcos",     icon:"🏹",  price:155 },
  { name:"Eternalbow",      category:"Arcos",     icon:"🏹",  price:180 },
  { name:"Evilskullbow",    category:"Arcos",     icon:"🏹",  price:165 },
  { name:"Fantasybow",      category:"Arcos",     icon:"🏹",  price:140 },
  { name:"Harpbow",         category:"Arcos",     icon:"🏹",  price:150 },
  { name:"Leviatabow",      category:"Arcos",     icon:"🏹",  price:175 },
  { name:"Rambow",          category:"Arcos",     icon:"🏹",  price:135 },
  { name:"Tryandebow",      category:"Arcos",     icon:"🏹",  price:145 },
  { name:"Vulkanbow",       category:"Arcos",     icon:"🏹",  price:160 },
  { name:"Wingbow",         category:"Arcos",     icon:"🏹",  price:155 },
  { name:"Bluefan",         category:"Leques",    icon:"🌀",  price:120 },
  { name:"Mortalfan",       category:"Leques",    icon:"🌀",  price:135 },
  { name:"Motherfan",       category:"Leques",    icon:"🌀",  price:125 },
  { name:"Purplefan",       category:"Leques",    icon:"🌀",  price:130 },
  { name:"Heavenlyspear",   category:"Lanças",    icon:"🗡️",  price:160 },
  { name:"Skyspear",        category:"Lanças",    icon:"🗡️",  price:145 },
  { name:"Bloodspear",      category:"Lanças",    icon:"🗡️",  price:155 },
  { name:"Spear",           category:"Lanças",    icon:"🗡️",  price:130 },
  { name:"Gungnir",         category:"Lanças",    icon:"🗡️",  price:200 },
  { name:"Holystaff",       category:"Cajados",   icon:"🔮",  price:180 },
  { name:"Scifi",           category:"Cajados",   icon:"🔮",  price:170 },
  { name:"Bellscyther",     category:"Foices",    icon:"☽",   price:165 },
  { name:"Chastiefolgear",  category:"Foices",    icon:"☽",   price:155 },
  { name:"Deathscyther",    category:"Foices",    icon:"☽",   price:175 },
  { name:"Naturescyther",   category:"Foices",    icon:"☽",   price:160 },
  { name:"Scifiscyther",    category:"Foices",    icon:"☽",   price:170 },
  { name:"Venthyrscyther",  category:"Foices",    icon:"☽",   price:180 },
  { name:"Fantasyknife",    category:"Adagas",    icon:"🗡️",  price:110 },
  { name:"Killerdagger",    category:"Adagas",    icon:"🗡️",  price:120 },
  { name:"Bident",          category:"Tridentes", icon:"🔱",  price:150 },
  { name:"Goldentrident",   category:"Tridentes", icon:"🔱",  price:180 },
  { name:"Greentrident",    category:"Tridentes", icon:"🔱",  price:160 },
  { name:"Levitrident",     category:"Tridentes", icon:"🔱",  price:170 },
  { name:"Tridentberilion", category:"Tridentes", icon:"🔱",  price:175 },
  { name:"Gryphon",         category:"Machados",  icon:"🪓",  price:190 },
  { name:"Guts",            category:"Machados",  icon:"🪓",  price:200 },
  { name:"Guts2",           category:"Machados",  icon:"🪓",  price:210 },
  { name:"Naha",            category:"Machados",  icon:"🪓",  price:185 },
  { name:"RWolf",           category:"Machados",  icon:"🪓",  price:195 },
  { name:"Sekira Axe",      category:"Machados",  icon:"🪓",  price:188 },
  { name:"Verticeabissal",  category:"Machados",  icon:"🪓",  price:205 },
];

const CATEGORIES = [...new Set(WEAPON_DATA.map(w => w.category))];

// ── Utilitários de Pedido ─────────────────────────────────────
function formatCurrency(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function sanitizeId(str) {
  return str.replace(/[^a-zA-Z0-9]/g, "_");
}

function calculateMaterials(entries, arrows) {
  const totals = { titosFundidos: 0, placasAco: 0, couroReforçado: 0, cristalMagico: 0, penasFenix: 0 };
  entries.forEach(({ category, qty }) => {
    const recipe = MATERIALS_RECIPE[category];
    if (!recipe) return;
    Object.keys(totals).forEach(m => { totals[m] += (recipe[m] || 0) * qty; });
  });
  if (arrows > 0) {
    totals.couroReforçado += Math.ceil(arrows / 10) * 2;
    totals.penasFenix     += Math.ceil(arrows / 10);
  }
  return totals;
}

function buildResumeText(entries, arrows, clientInfo) {
  const lines   = [];
  let totalVal  = 0;
  entries.forEach(({ name, category, qty, price }) => {
    lines.push(`• ${qty}x ${name} (${category}) — ${formatCurrency(price * qty)}`);
    totalVal += price * qty;
  });
  if (arrows > 0) lines.push(`• ${arrows}x Flechas — ${formatCurrency(arrows * 2)}`);
  const mats = calculateMaterials(entries, arrows);
  const matLines = Object.entries(mats)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `  ${k}: ${v}`);
  return [
    `👤 Cliente: ${clientInfo.name} | Passaporte: ${clientInfo.passport}`,
    `📦 Itens:`,
    ...lines,
    `💰 Total: ${formatCurrency(totalVal + arrows * 2)}`,
    `🔩 Materiais necessários:`,
    ...matLines,
  ].join("\n");
}

// ── Grid de Armas ─────────────────────────────────────────────
function buildCategoryTabs(containerId, gridId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  const all = document.createElement("button");
  all.className   = "cat-tab active";
  all.textContent = "Todas";
  all.onclick     = () => filterWeapons(null, gridId, containerId);
  container.appendChild(all);
  CATEGORIES.forEach(cat => {
    const btn    = document.createElement("button");
    btn.className = "cat-tab";
    btn.textContent = cat;
    btn.onclick   = () => filterWeapons(cat, gridId, containerId);
    container.appendChild(btn);
  });
}

function filterWeapons(cat, gridId, tabsId) {
  document.querySelectorAll(`#${tabsId} .cat-tab`).forEach(b => b.classList.remove("active"));
  const activeBtn = cat
    ? [...document.querySelectorAll(`#${tabsId} .cat-tab`)].find(b => b.textContent === cat)
    : document.querySelector(`#${tabsId} .cat-tab`);
  if (activeBtn) activeBtn.classList.add("active");
  buildWeaponGrid(gridId, cat);
}

function buildWeaponGrid(containerId, filterCat = null, prefix = "", onSelect = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  const weapons = filterCat ? WEAPON_DATA.filter(w => w.category === filterCat) : WEAPON_DATA;
  weapons.forEach(w => {
    const imgSrc   = `image/${w.name}.png`;
    const imgId    = `${prefix}img-${sanitizeId(w.name)}`;
    const safeName = w.name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const card     = document.createElement("div");
    card.className = "weapon-card";
    card.innerHTML = `
      <div class="weapon-img-wrap" onclick="openWeaponPreview('${safeName}','${imgSrc}','${w.icon}')">
        <img id="${imgId}" src="${imgSrc}" alt="${w.name}"
          onerror="this.style.display='none';document.getElementById('${imgId}-fb').style.display='flex';">
        <div id="${imgId}-fb" class="weapon-img-fallback" style="display:none">${w.icon}</div>
      </div>
      <div class="weapon-info">
        <span class="weapon-name">${w.name}</span>
        <span class="weapon-cat">${w.category}</span>
        <span class="weapon-price">${formatCurrency(w.price)}</span>
      </div>`;
    if (onSelect) {
      const btn    = document.createElement("button");
      btn.className = "btn-select-weapon";
      btn.textContent = "Selecionar";
      btn.onclick  = () => onSelect(w);
      card.appendChild(btn);
    }
    container.appendChild(card);
  });
}

// ── Preview de Arma ───────────────────────────────────────────
function openWeaponPreview(name, imgSrc, icon) {
  const modal = document.getElementById("modal-weapon-preview");
  if (!modal) return;
  document.getElementById("preview-title").textContent  = name;
  const img = document.getElementById("preview-img");
  img.src = imgSrc;
  img.onerror = () => {
    img.style.display = "none";
    document.getElementById("preview-fallback").textContent = icon;
  };
  img.style.display = "block";
  document.getElementById("preview-fallback").textContent = "";
  modal.style.display = "flex";
}
function closeWeaponPreview() {
  const m = document.getElementById("modal-weapon-preview");
  if (m) m.style.display = "none";
}

window._appLoaded = true;
