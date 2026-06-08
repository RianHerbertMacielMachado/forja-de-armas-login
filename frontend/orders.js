// ============================================================
// FORGE — orders.js
// ============================================================

// ── Estado do pedido atual ────────────────────────────────────
let currentOrder      = null;
let selectedWeapons   = [];
let orderArrows       = 0;
let orderClientName   = "";
let orderClientPass   = "";

// ── Consulta de Status (Cliente) ──────────────────────────────
async function consultarStatusPedido() {
  const passport = document.getElementById("client-passport")?.value.trim();
  const err      = document.getElementById("client-error");
  const result   = document.getElementById("status-result");
  if (!passport) { if (err) err.textContent = "Informe seu passaporte."; return; }
  if (err) err.textContent = "";
  if (result) result.innerHTML = "<p>🔍 Buscando pedido...</p>";
  try {
    await initFirebasePublic();
    const snap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, "orders"));
    if (!snap.exists()) { if (result) result.innerHTML = "<p>Nenhum pedido encontrado.</p>"; return; }
    const orders = snap.val();
    const found  = Object.entries(orders)
      .map(([id, d]) => ({ id, ...d }))
      .filter(o => o.clientPassport === passport);
    if (!found.length) {
      if (result) result.innerHTML = "<p>❌ Nenhum pedido encontrado para este passaporte.</p>";
      return;
    }
    if (result) result.innerHTML = found.map(o => buildClientOrderCard(o)).join("");
  } catch (e) {
    console.error(e);
    if (err) err.textContent = "Erro ao buscar pedido.";
  }
}

function buildClientOrderCard(order) {
  const statusLabels = {
    queue:      "⏳ Na Fila",
    collecting: "🔩 Coletando Materiais",
    producing:  "⚒️ Produzindo",
    done:       "✅ Pronto para Retirada",
  };

  const statusColors = {
    queue:      "#f59e0b",
    collecting: "#3b82f6",
    producing:  "#8b5cf6",
    done:       "#22c55e",
  };

  const statusLabel = statusLabels[order.status] || order.status;
  const statusColor = statusColors[order.status] || "#aaa";

  // Histórico — excluir transferências
  let historyHtml = "";
  if (order.statusHistory && Array.isArray(order.statusHistory)) {
    const filtered = order.statusHistory.filter(h => h.key !== "transfer");
    historyHtml = filtered.map(h => `
      <div class="history-item">
        <span class="history-label">${statusLabels[h.key] || h.key}</span>
        <span class="history-time">${new Date(h.at).toLocaleString("pt-BR")}</span>
      </div>`).join("");
  }

  const weaponsHtml = (order.weapons || []).map(w =>
    `<li>${w.qty}x ${w.name} <span class="weapon-cat-badge">${w.category}</span></li>`
  ).join("");

  return `
    <div class="order-card client-order-card">
      <div class="order-header">
        <strong>Pedido #${order.id?.slice(-6)?.toUpperCase() || "------"}</strong>
        <span class="status-badge" style="background:${statusColor}">${statusLabel}</span>
      </div>
      <div class="order-smith">⚒️ Forjador: <strong>${order.smithName || "Não atribuído"}</strong></div>
      <ul class="order-weapons-list">${weaponsHtml}</ul>
      ${order.arrows > 0 ? `<div>🏹 Flechas: ${order.arrows}</div>` : ""}
      <div class="order-total">💰 Total: ${formatCurrency(order.total || 0)}</div>
      ${historyHtml ? `<div class="order-history"><strong>📜 Histórico:</strong>${historyHtml}</div>` : ""}
    </div>`;
}

// ── Tela do Forjador — Pedidos ────────────────────────────────
let smithOrdersListener = null;

function smithInit() {
  if (!currentSmith) { goTo("selector"); return; }
  document.getElementById("smith-display-name").textContent =
    currentSmith.displayName || currentSmith.user;
  loadSmithOrders();
}

function loadSmithOrders() {
  if (!window.firebaseDB) return;
  const ordersRef = window.firebaseRef(window.firebaseDB, "orders");
  if (smithOrdersListener) smithOrdersListener();
  smithOrdersListener = window.firebaseOnValue(ordersRef, snap => {
    const allOrders = [];
    if (snap.exists()) {
      snap.forEach(child => {
        const d = child.val();
        if (d.smithId === currentSmith.id && d.status !== "done") {
          allOrders.push({ id: child.key, ...d });
        }
      });
    }
    renderSmithOrders(allOrders);
  });
}

function renderSmithOrders(orders) {
  const container = document.getElementById("smith-orders-list");
  if (!container) return;
  if (!orders.length) {
    container.innerHTML = `<div class="empty-state">📭 Nenhum pedido na fila.</div>`;
    return;
  }
  container.innerHTML = orders.map(o => buildSmithOrderCard(o)).join("");
}

function buildSmithOrderCard(order) {
  const statusLabels = {
    queue:      "⏳ Na Fila",
    collecting: "🔩 Coletando",
    producing:  "⚒️ Produzindo",
    done:       "✅ Pronto",
  };
  const nextStatus = { queue: "collecting", collecting: "producing", producing: "done" };
  const nextLabel  = { queue: "Iniciar Coleta", collecting: "Iniciar Produção", producing: "Marcar Pronto" };

  const transferBadge = order.transferredFrom
    ? `<span class="transfer-badge">🔄 Transferido de ${order.transferredFrom}</span>`
    : "";

  const weaponsHtml = (order.weapons || []).map(w =>
    `<li>${w.qty}x ${w.name}</li>`
  ).join("");

  const next = nextStatus[order.status];
  const advBtn = next
    ? `<button class="btn-advance" onclick="advanceOrderStatus('${order.id}','${next}')">
        ${nextLabel[order.status]}
       </button>`
    : "";

  return `
    <div class="order-card smith-order-card" id="soc-${order.id}">
      <div class="order-header">
        <strong>${order.clientName}</strong>
        <span class="status-badge status-${order.status}">${statusLabels[order.status]}</span>
      </div>
      ${transferBadge}
      <div class="order-passport">🪪 ${order.clientPassport}</div>
      <ul class="order-weapons-list">${weaponsHtml}</ul>
      ${order.arrows > 0 ? `<div>🏹 Flechas: ${order.arrows}</div>` : ""}
      <div class="order-total">💰 ${formatCurrency(order.total || 0)}</div>
      <div class="order-actions">
        ${advBtn}
        <button class="btn-transfer" onclick="openTransferModal('${order.id}')">🔄 Transferir</button>
      </div>
    </div>`;
}

// ── Avançar Status ────────────────────────────────────────────
async function advanceOrderStatus(orderId, newStatus) {
  try {
    const orderRef  = window.firebaseRef(window.firebaseDB, `orders/${orderId}`);
    const snap      = await window.firebaseGet(orderRef);
    if (!snap.exists()) return;
    const order     = snap.val();
    const history   = order.statusHistory || [];
    history.push({ key: newStatus, at: Date.now() });
    await window.firebaseSet(
      window.firebaseRef(window.firebaseDB, `orders/${orderId}/status`), newStatus
    );
    await window.firebaseSet(
      window.firebaseRef(window.firebaseDB, `orders/${orderId}/statusHistory`), history
    );
    // Atualizar embed no Discord
    if (order.discordMessageId) {
      await updateDiscordEmbed(orderId, { ...order, status: newStatus, statusHistory: history });
    }
    if (typeof addLog === "function") {
      addLog("order", `Status do pedido ${orderId.slice(-6)} avançado para ${newStatus} por ${currentSmith.displayName}`);
    }
  } catch (e) {
    console.error("Erro ao avançar status:", e);
  }
}

// ── Transferência de Pedido ───────────────────────────────────
let _transferOrderId = null;

async function openTransferModal(orderId) {
  _transferOrderId = orderId;
  const modal   = document.getElementById("modal-transfer");
  const select  = document.getElementById("transfer-target");
  if (!modal || !select) return;
  select.innerHTML = "<option value=''>Selecione o forjador...</option>";
  try {
    const smiths = await getAllSmiths();
    smiths
      .filter(s => s.id !== currentSmith.id)
      .forEach(s => {
        const opt   = document.createElement("option");
        opt.value   = s.id;
        opt.textContent = s.displayName || s.user;
        select.appendChild(opt);
      });
    document.getElementById("transfer-note").value = "";
    document.getElementById("transfer-error").textContent = "";
    modal.style.display = "flex";
  } catch (e) {
    console.error(e);
  }
}

function closeTransferModal() {
  const m = document.getElementById("modal-transfer");
  if (m) m.style.display = "none";
  _transferOrderId = null;
}

async function confirmTransfer() {
  const targetId = document.getElementById("transfer-target")?.value;
  const note     = document.getElementById("transfer-note")?.value.trim();
  const err      = document.getElementById("transfer-error");
  if (!targetId) { if (err) err.textContent = "Selecione um forjador."; return; }
  try {
    const orderRef = window.firebaseRef(window.firebaseDB, `orders/${_transferOrderId}`);
    const snap     = await window.firebaseGet(orderRef);
    if (!snap.exists()) return;
    const order    = snap.val();

    // Buscar forjador destino
    const targetSnap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, `smiths/${targetId}`));
    if (!targetSnap.exists()) return;
    const targetSmith = targetSnap.val();

    // Deletar mensagem do Discord atual
    if (order.discordMessageId && order.discordChannelWebhook) {
      await deleteDiscordMessage(order.discordChannelWebhook, order.discordMessageId);
    }

    // Atualizar histórico
    const history = order.statusHistory || [];
    history.push({
      key:  "transfer",
      at:   Date.now(),
      from: currentSmith.displayName,
      to:   targetSmith.displayName || targetSmith.user,
      note: note || "",
    });

    // Atualizar pedido no Firebase
    await window.firebaseSet(orderRef, {
      ...order,
      smithId:            targetId,
      smithName:          targetSmith.displayName || targetSmith.user,
      discordMessageId:   null,
      transferredFrom:    currentSmith.displayName,
      transferNote:       note || "",
      statusHistory:      history,
    });

    // Enviar nova mensagem no Discord para o forjador destino
    const newMsgId = await sendTransferEmbed(order, targetSmith, note);
    if (newMsgId) {
      await window.firebaseSet(
        window.firebaseRef(window.firebaseDB, `orders/${_transferOrderId}/discordMessageId`), newMsgId
      );
    }

    if (typeof addLog === "function") {
      addLog("transfer", `Pedido ${_transferOrderId.slice(-6)} transferido de ${currentSmith.displayName} para ${targetSmith.displayName || targetSmith.user}`);
    }

    closeTransferModal();
  } catch (e) {
    console.error("Erro ao transferir:", e);
    if (err) err.textContent = "Erro ao transferir. Tente novamente.";
  }
}

// ── Novo Pedido (Cliente → Forjador) ──────────────────────────
let newOrderStep    = 1;
let newOrderWeapons = [];
let newOrderArrows  = 0;

function clientInit() {
  buildCategoryTabs("client-cat-tabs", "client-weapons-grid");
  buildWeaponGrid("client-weapons-grid", null, "client-", addWeaponToOrder);
  renderOrderSummary();
}

function addWeaponToOrder(weapon) {
  const existing = newOrderWeapons.find(w => w.name === weapon.name);
  if (existing) { existing.qty++; }
  else { newOrderWeapons.push({ ...weapon, qty: 1 }); }
  renderOrderSummary();
}

function removeWeaponFromOrder(name) {
  const idx = newOrderWeapons.findIndex(w => w.name === name);
  if (idx === -1) return;
  if (newOrderWeapons[idx].qty > 1) newOrderWeapons[idx].qty--;
  else newOrderWeapons.splice(idx, 1);
  renderOrderSummary();
}

function renderOrderSummary() {
  const container = document.getElementById("order-summary-items");
  const totalEl   = document.getElementById("order-summary-total");
  if (!container) return;
  if (!newOrderWeapons.length) {
    container.innerHTML = "<p class='empty-summary'>Nenhum item selecionado.</p>";
    if (totalEl) totalEl.textContent = "Total: R$ 0,00";
    return;
  }
  let total = 0;
  container.innerHTML = newOrderWeapons.map(w => {
    total += w.price * w.qty;
    return `
      <div class="summary-item">
        <span>${w.qty}x ${w.name}</span>
        <span>${formatCurrency(w.price * w.qty)}</span>
        <button onclick="removeWeaponFromOrder('${w.name.replace(/'/g,"\\'")}')">✕</button>
      </div>`;
  }).join("");
  const arrows = parseInt(document.getElementById("order-arrows")?.value || 0);
  newOrderArrows = isNaN(arrows) ? 0 : Math.max(0, arrows);
  if (newOrderArrows > 0) total += newOrderArrows * 2;
  if (totalEl) totalEl.textContent = `Total: ${formatCurrency(total)}`;
}

async function submitOrder() {
  const name     = document.getElementById("order-client-name")?.value.trim();
  const passport = document.getElementById("order-client-passport")?.value.trim();
  const err      = document.getElementById("order-submit-error");
  if (!name || !passport) { if (err) err.textContent = "Preencha nome e passaporte."; return; }
  if (!newOrderWeapons.length) { if (err) err.textContent = "Adicione ao menos uma arma."; return; }
  if (err) err.textContent = "";

  // Escolher forjador com menos pedidos ativos
  const smiths  = await getAllSmiths();
  if (!smiths.length) { if (err) err.textContent = "Nenhum forjador disponível."; return; }

  const ordersSnap = await window.firebaseGet(window.firebaseRef(window.firebaseDB, "orders"));
  const allOrders  = ordersSnap.exists() ? Object.values(ordersSnap.val()) : [];

  const smithLoad  = smiths.map(s => ({
    ...s,
    active: allOrders.filter(o => o.smithId === s.id && o.status !== "done").length,
  }));
  smithLoad.sort((a, b) => a.active - b.active);
  const assignedSmith = smithLoad[0];

  const arrows   = newOrderArrows;
  let total      = newOrderWeapons.reduce((acc, w) => acc + w.price * w.qty, 0) + arrows * 2;
  const newRef   = window.firebasePush(window.firebaseRef(window.firebaseDB, "orders"));
  const orderId  = newRef.key;
  const order    = {
    id:             orderId,
    clientName:     name,
    clientPassport: passport,
    smithId:        assignedSmith.id,
    smithName:      assignedSmith.displayName || assignedSmith.user,
    weapons:        newOrderWeapons,
    arrows,
    total,
    status:         "queue",
    createdAt:      Date.now(),
    statusHistory:  [{ key: "queue", at: Date.now() }],
    discordMessageId: null,
  };

  await window.firebaseSet(newRef, order);

  // Enviar para Discord
  const msgId = await sendOrderToDiscord(order, assignedSmith);
  if (msgId) {
    await window.firebaseSet(
      window.firebaseRef(window.firebaseDB, `orders/${orderId}/discordMessageId`), msgId
    );
  }

  // Reset
  newOrderWeapons = [];
  newOrderArrows  = 0;
  document.getElementById("order-client-name").value    = "";
  document.getElementById("order-client-passport").value = "";
  if (document.getElementById("order-arrows")) document.getElementById("order-arrows").value = "0";
  renderOrderSummary();
  showOrderSuccessMessage(assignedSmith.displayName || assignedSmith.user);
}

function showOrderSuccessMessage(smithName) {
  const el = document.getElementById("order-success");
  if (!el) return;
  el.innerHTML  = `✅ Pedido enviado! Forjador: <strong>${smithName}</strong>`;
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 4000);
}
