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
