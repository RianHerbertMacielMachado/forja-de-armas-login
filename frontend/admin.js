// ========================
// ADMIN CREDENTIALS
// Salvas no Firebase em config/admin
// ========================
const DEFAULT_ADMIN_USER = "admin";
const DEFAULT_ADMIN_PASS = "admin123";

let currentAdmin = null;

// ========================
// LOGIN ADMIN
// ========================
async function doAdminLogin() {
  const btn  = document.querySelector("#screen-admin-login .btn-primary");
  const user = document.getElementById("adminLoginUser").value.trim();
  const pass = document.getElementById("adminLoginPass").value.trim();
  const errEl = document.getElementById("adminLoginError");

  if (!user || !pass) {
    errEl.textContent = "Preencha usuário e senha.";
    errEl.classList.remove("hidden");
    return;
  }

  setLoading(btn, true, "Verificando...");

  try {
    const snap = await firebaseGet(firebaseRef(firebaseDB, "config/admin"));
    let adminUser = DEFAULT_ADMIN_USER;
    let adminPass = DEFAULT_ADMIN_PASS;

    if (snap.exists()) {
      adminUser = snap.val().user || DEFAULT_ADMIN_USER;
      adminPass = snap.val().pass || DEFAULT_ADMIN_PASS;
    }

    if (user === adminUser && pass === adminPass) {
      currentAdmin = { user: adminUser };
      errEl.classList.add("hidden");
      setLoading(btn, false, "Entrar");
      await addLog("login", `Admin "${user}" fez login.`);
      goTo("admin");
    } else {
      errEl.textContent = "Credenciais inválidas.";
      errEl.classList.remove("hidden");
      setLoading(btn, false, "Entrar");
    }
  } catch (e) {
    errEl.textContent = "Erro ao verificar credenciais.";
    errEl.classList.remove("hidden");
    setLoading(btn, false, "Entrar");
    console.error(e);
  }
}

const _adminPass = document.getElementById("adminLoginPass");
const _adminUser = document.getElementById("adminLoginUser");
if (_adminPass) _adminPass.addEventListener("keydown", e => { if (e.key === "Enter") doAdminLogin(); });
if (_adminUser) _adminUser.addEventListener("keydown", e => { if (e.key === "Enter") doAdminLogin(); });

// ========================
// LOGOUT ADMIN
// ========================
function doAdminLogout() {
  currentAdmin = null;
  goTo("selector");
}

// ========================
// SWITCH TABS
// ========================
function switchAdminTab(tab) {
  ["smiths", "orders", "logs", "settings"].forEach(t => {
    document.getElementById(`admin-panel-${t}`).classList.add("hidden");
    document.getElementById(`tab-${t}`).classList.remove("active");
  });
  document.getElementById(`admin-panel-${tab}`).classList.remove("hidden");
  document.getElementById(`tab-${tab}`).classList.add("active");

  if (tab === "smiths")   loadAdminSmiths();
  if (tab === "orders")   loadAdminOrders();
  if (tab === "logs")     loadAdminLogs();
  if (tab === "settings") loadAdminSettings();
}

// ========================
// ADMIN INIT
// ========================
function adminInit() {
  switchAdminTab("smiths");
}

// ========================
// FORJADORES
// ========================
let allAdminSmiths = [];

async function loadAdminSmiths() {
  const container = document.getElementById("adminSmithsList");
  container.innerHTML = `<div class="empty-state">Carregando...</div>`;

  try {
    const snap = await firebaseGet(firebaseRef(firebaseDB, "smiths"));
    allAdminSmiths = [];

    if (snap.exists()) {
      snap.forEach(child => {
        allAdminSmiths.push({ id: child.key, ...child.val() });
      });
    }

    renderAdminSmiths();
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Erro ao carregar forjadores.</div>`;
    console.error(e);
  }
}

function renderAdminSmiths() {
  const container = document.getElementById("adminSmithsList");
  const search    = (document.getElementById("smithSearchAdmin").value || "").toLowerCase();

  const filtered = allAdminSmiths.filter(s =>
    s.displayName.toLowerCase().includes(search) ||
    s.user.toLowerCase().includes(search) ||
    (s.passport || "").toLowerCase().includes(search)
  );

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">Nenhum forjador encontrado.</div>`;
    return;
  }

  container.innerHTML = filtered.map(s => `
    <div class="admin-smith-card">
      <div class="smith-card-info">
        <div class="smith-card-name">${s.displayName}</div>
        <div class="smith-card-meta">
          <span>👤 ${s.user}</span>
          <span>🪪 ${s.passport || "—"}</span>
          <span>📅 ${s.createdAt ? new Date(s.createdAt).toLocaleDateString("pt-BR") : "—"}</span>
        </div>
      </div>
      <div class="smith-card-actions">
        <button class="admin-edit-btn"   onclick="openEditSmithModal('${s.id}')">✏️ Editar</button>
        <button class="admin-delete-btn" onclick="deleteSmith('${s.id}', '${escapeQuotes(s.displayName)}')">🗑️ Deletar</button>
      </div>
    </div>
  `).join("");
}

// ========================
// DELETAR FORJADOR
// ========================
async function deleteSmith(id, displayName) {
  if (!confirm(`Tem certeza que deseja deletar "${displayName}"?\nEsta ação não pode ser desfeita.`)) return;

  try {
    await firebaseRemove(firebaseRef(firebaseDB, `smiths/${id}`));
    await addLog("delete", `Admin deletou forjador: "${displayName}" (ID: ${id})`);
    showNotif(`🗑️ Forjador "${displayName}" deletado.`, "#f87171");
    loadAdminSmiths();
  } catch (e) {
    showNotif("❌ Erro ao deletar forjador.", "#f87171");
    console.error(e);
  }
}

// ========================
// EDITAR FORJADOR — MODAL
// ========================
function openEditSmithModal(id) {
  const smith = allAdminSmiths.find(s => s.id === id);
  if (!smith) return;

  document.getElementById("editSmithId").value          = smith.id;
  document.getElementById("editSmithDisplayName").value = smith.displayName;
  document.getElementById("editSmithUser").value        = smith.user;
  document.getElementById("editSmithPassport").value    = smith.passport || "";
  document.getElementById("editSmithPass").value        = "";
  document.getElementById("editSmithError").classList.add("hidden");

  document.getElementById("editSmithModal").style.display = "block";

  document.getElementById("editSmithOverlay").onclick = function (e) {
    if (e.target === this) closeEditSmithModal();
  };
}

function closeEditSmithModal() {
  document.getElementById("editSmithModal").style.display = "none";
}

async function saveEditSmith() {
  const id          = document.getElementById("editSmithId").value;
  const displayName = document.getElementById("editSmithDisplayName").value.trim();
  const user        = document.getElementById("editSmithUser").value.trim();
  const passport    = document.getElementById("editSmithPassport").value.trim();
  const errEl       = document.getElementById("editSmithError");
  const btn         = document.querySelector("#editSmithModal .modal-confirm-btn");

  errEl.classList.add("hidden");

  if (!displayName) { errEl.textContent = "Preencha o nome.";       errEl.classList.remove("hidden"); return; }
  if (!user)        { errEl.textContent = "Preencha o usuário.";    errEl.classList.remove("hidden"); return; }
  if (!passport)    { errEl.textContent = "Preencha o passaporte."; errEl.classList.remove("hidden"); return; }

  const duplicate = allAdminSmiths.find(
    s => s.id !== id && s.user.toLowerCase() === user.toLowerCase()
  );
  if (duplicate) {
    errEl.textContent = "Esse usuário já está em uso por outro forjador.";
    errEl.classList.remove("hidden");
    return;
  }

  const dupPassport = allAdminSmiths.find(
    s => s.id !== id && s.passport && s.passport.trim() === passport
  );
  if (dupPassport) {
    errEl.textContent = `Passaporte "${passport}" já está em uso.`;
    errEl.classList.remove("hidden");
    return;
  }

  setLoading(btn, true, "Salvando...");

  try {
    const current = allAdminSmiths.find(s => s.id === id);
    const updated = {
      ...current,
      displayName,
      user,
      passport,
      updatedAt: new Date().toISOString()
    };
    // ⚠️ Senha não é editável pelo admin — fica no Firebase Auth
    // Para redefinir senha de um forjador, use o Firebase Console
    delete updated.pass; // remove campo legado se ainda existir

    await firebaseSet(firebaseRef(firebaseDB, `smiths/${id}`), updated);
    await addLog("edit", `Admin editou forjador: "${current.displayName}" → "${displayName}" (ID: ${id})`);

    showNotif(`✅ Forjador "${displayName}" atualizado!`, "#059669");
    closeEditSmithModal();
    loadAdminSmiths();

  } catch (e) {
    errEl.textContent = "Erro ao salvar. Tente novamente.";
    errEl.classList.remove("hidden");
    console.error(e);
  }

  setLoading(btn, false, "💾 Salvar Alterações");
}

// ========================
// PEDIDOS
// ========================
async function loadAdminOrders() {
  const container = document.getElementById("adminOrdersList");
  container.innerHTML = `<div class="empty-state">Carregando...</div>`;

  try {
    const snap = await firebaseGet(firebaseRef(firebaseDB, "orders"));

    if (!snap.exists()) {
      container.innerHTML = `<div class="empty-state">Nenhum pedido na fila.</div>`;
      return;
    }

    const orders = [];
    snap.forEach(child => orders.push({ id: child.key, ...child.val() }));
    orders.reverse();

    container.innerHTML = orders.map(order => {
      const weaponLines = Object.entries(order.weapons || {})
        .map(([n, q]) => `${n} ×${q}`).join(", ");
      const arrowLine = order.arrows > 0 ? ` | Flechas ×${order.arrows}` : "";
      const total = (order.total || 0).toLocaleString("pt-BR", {
        style: "currency", currency: "BRL"
      });

      return `
        <div class="admin-order-card">
          <div class="admin-order-header">
            <div>
              <span class="admin-order-client">👤 ${order.clientName}</span>
              <span style="font-size:0.78rem;color:#6d6d9a;margin-left:8px;">🪪 ${order.passport}</span>
            </div>
            <span class="admin-order-time">🕐 ${order.timestamp}</span>
          </div>
          <div class="admin-order-items">${weaponLines}${arrowLine}</div>
          <div class="admin-order-total">💰 ${total}</div>
          <div class="order-actions">
            <button class="order-dismiss-btn" onclick="adminDeleteOrder('${order.id}', '${escapeQuotes(order.clientName)}')">
              🗑️ Remover Pedido
            </button>
          </div>
        </div>`;
    }).join("");

  } catch (e) {
    container.innerHTML = `<div class="empty-state">Erro ao carregar pedidos.</div>`;
    console.error(e);
  }
}

async function adminDeleteOrder(id, clientName) {
  if (!confirm(`Remover pedido de "${clientName}"?`)) return;
  try {
    await firebaseRemove(firebaseRef(firebaseDB, `orders/${id}`));
    await addLog("delete", `Admin removeu pedido do cliente "${clientName}" (ID: ${id})`);
    showNotif("🗑️ Pedido removido.", "#f87171");
    loadAdminOrders();
  } catch (e) {
    showNotif("❌ Erro ao remover pedido.", "#f87171");
    console.error(e);
  }
}

// ========================
// LOGS
// ========================
async function addLog(type, message) {
  try {
    const logRef = firebasePush(firebaseRef(firebaseDB, "logs"));
    await firebaseSet(logRef, {
      type:      type,
      message:   message,
      timestamp: new Date().toLocaleString("pt-BR"),
      iso:       new Date().toISOString()
    });
  } catch (e) {
    console.error("Erro ao salvar log:", e);
  }
}

async function loadAdminLogs() {
  const container = document.getElementById("adminLogsList");
  container.innerHTML = `<div class="empty-state">Carregando...</div>`;

  try {
    const snap = await firebaseGet(firebaseRef(firebaseDB, "logs"));

    if (!snap.exists()) {
      container.innerHTML = `<div class="empty-state">Nenhum log registrado.</div>`;
      return;
    }

    const logs = [];
    snap.forEach(child => logs.push({ id: child.key, ...child.val() }));
    logs.reverse();

    const icons = {
      register: "✅",
      login:    "🔐",
      order:    "🛒",
      delete:   "🗑️",
      token:    "🔑",
      edit:     "✏️"
    };

    container.innerHTML = logs.map(log => `
      <div class="admin-log-card log-${log.type}">
        <span class="log-message">${icons[log.type] || "📋"} ${log.message}</span>
        <span class="log-time">${log.timestamp}</span>
      </div>
    `).join("");

  } catch (e) {
    container.innerHTML = `<div class="empty-state">Erro ao carregar logs.</div>`;
    console.error(e);
  }
}

async function clearAllLogs() {
  if (!confirm("Limpar todos os logs? Esta ação não pode ser desfeita.")) return;
  try {
    await firebaseRemove(firebaseRef(firebaseDB, "logs"));
    showNotif("🗑️ Logs limpos.", "#f87171");
    loadAdminLogs();
  } catch (e) {
    showNotif("❌ Erro ao limpar logs.", "#f87171");
    console.error(e);
  }
}

// ========================
// SETTINGS
// ========================
async function loadAdminSettings() {
  try {
    const snap = await firebaseGet(
      firebaseRef(firebaseDB, "config/registerToken")
    );
    const tokenDisplay = document.getElementById("adminTokenDisplay");
    if (snap.exists() && snap.val().token) {
      tokenDisplay.textContent = snap.val().token;
    } else {
      tokenDisplay.textContent = "—";
    }
  } catch (e) {
    console.error(e);
  }
}

async function adminRotateToken() {
  if (!confirm("Gerar um novo token de cadastro? O token atual será invalidado.")) return;
  await rotateToken();
  await addLog("token", "Admin gerou novo token de cadastro manualmente.");
  showNotif("🔑 Novo token gerado e enviado ao Discord!", "#059669");
  loadAdminSettings();
}

async function adminChangePassword() {
  const oldPass    = document.getElementById("adminOldPass").value.trim();
  const newPass    = document.getElementById("adminNewPass").value.trim();
  const newConfirm = document.getElementById("adminNewPassConfirm").value.trim();
  const errEl      = document.getElementById("adminPassError");
  const sucEl      = document.getElementById("adminPassSuccess");

  errEl.classList.add("hidden");
  sucEl.classList.add("hidden");

  if (!oldPass || !newPass || !newConfirm) {
    errEl.textContent = "Preencha todos os campos.";
    errEl.classList.remove("hidden");
    return;
  }

  if (newPass.length < 4) {
    errEl.textContent = "Nova senha deve ter ao menos 4 caracteres.";
    errEl.classList.remove("hidden");
    return;
  }

  if (newPass !== newConfirm) {
    errEl.textContent = "As senhas não coincidem.";
    errEl.classList.remove("hidden");
    return;
  }

  try {
    const snap = await firebaseGet(firebaseRef(firebaseDB, "config/admin"));
    const currentPass = snap.exists() ? (snap.val().pass || DEFAULT_ADMIN_PASS) : DEFAULT_ADMIN_PASS;
    const currentUser = snap.exists() ? (snap.val().user || DEFAULT_ADMIN_USER) : DEFAULT_ADMIN_USER;

    if (oldPass !== currentPass) {
      errEl.textContent = "Senha atual incorreta.";
      errEl.classList.remove("hidden");
      return;
    }

    await firebaseSet(firebaseRef(firebaseDB, "config/admin"), {
      user: currentUser,
      pass: newPass
    });

    await addLog("edit", "Admin alterou a senha do painel administrativo.");

    sucEl.textContent = "✅ Senha alterada com sucesso!";
    sucEl.classList.remove("hidden");
    document.getElementById("adminOldPass").value    = "";
    document.getElementById("adminNewPass").value    = "";
    document.getElementById("adminNewPassConfirm").value = "";

  } catch (e) {
    errEl.textContent = "Erro ao salvar senha. Tente novamente.";
    errEl.classList.remove("hidden");
    console.error(e);
  }
}
