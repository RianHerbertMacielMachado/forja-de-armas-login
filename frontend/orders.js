// ========================
// WEBHOOK DE NOTIFICAÇÃO DE NOVOS PEDIDOS
// ========================
const NEW_ORDER_WEBHOOK = "https://discord.com/api/webhooks/1510332190666264618/esWmnpTzmGwEeOXWIEyM7xLUvaAO7URThObTqQ1k24ZwpK3xzMG6w55P9vqjokHZ9m-O";

// ========================
// STATUS CONFIG
// ========================
const ORDER_STATUSES = [
  { key: "queue",      label: "Na fila",            emoji: "🟡", color: 0xf59e0b },
  { key: "collecting", label: "Coletando Materiais", emoji: "🔵", color: 0x3b82f6 },
  { key: "producing",  label: "Em Produção",         emoji: "🟠", color: 0xf97316 },
  { key: "done",       label: "Concluído",           emoji: "✅", color: 0x10b981 }
];

function getStatusInfo(key) {
  return ORDER_STATUSES.find(s => s.key === key) || ORDER_STATUSES[0];
}

// ========================
// NOTIFICAR NOVO PEDIDO
// ========================
function notifyNewOrder(order) {
  console.log("📨 Notificando Discord novo pedido...", order);

  const weaponLines = Object.entries(order.weapons || {})
    .map(([n, q]) => `• ${n} ×${q}`)
    .join("\n") || "Nenhuma arma";

  const arrowLine = order.arrows > 0 ? `• Flechas ×${order.arrows}\n` : "";

  const totalFormatted = order.total.toLocaleString("pt-BR", {
    style: "currency", currency: "BRL"
  });

  const payload = {
    username:   "⚔️ Forja de Armas",
    avatar_url: "https://i.imgur.com/AfFp7pu.png",
    embeds: [{
      title:       "🛒 Novo Pedido de Cliente!",
      description: `Um novo pedido foi adicionado à fila.\n\n**👤 Cliente:** ${order.clientName}\n**🪪 Passaporte:** ${order.passport}\n\n**📦 Itens:**\n${weaponLines}\n${arrowLine}\n**💰 Total:** ${totalFormatted}`,
      color:       0x10b981,
      footer:      { text: `Pedido recebido em: ${order.timestamp}` },
      timestamp:   new Date().toISOString()
    }]
  };

  fetch(NEW_ORDER_WEBHOOK, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload)
  })
  .then(res => {
    console.log("Discord novo pedido status:", res.status);
  })
  .catch(err => console.error("❌ Erro ao notificar Discord:", err));
}

// ========================
// DELETAR MENSAGEM DO DISCORD VIA WEBHOOK
// ========================
async function deleteDiscordMessage(webhookUrl, messageId) {
  if (!webhookUrl || !messageId) return;
  try {
    const res = await fetch(`${webhookUrl}/messages/${messageId}`, {
      method: "DELETE"
    });
    if (res.ok || res.status === 204) {
      console.log("🗑️ Mensagem do Discord deletada:", messageId);
    } else {
      console.warn("⚠️ Não foi possível deletar mensagem do Discord. Status:", res.status);
    }
  } catch (e) {
    console.error("❌ Erro ao deletar mensagem do Discord:", e);
  }
}

// ========================
// ENVIAR/EDITAR MENSAGEM DE STATUS NO DISCORD DO FORJADOR
// ========================
async function sendOrUpdateStatusMessage(order, webhookUrl) {
  const statusInfo  = getStatusInfo(order.status);
  const weaponLines = Object.entries(order.weapons || {})
    .map(([n, q]) => `• ${n} ×${q}`)
    .join("\n") || "Nenhuma arma";
  const arrowLine = order.arrows > 0 ? `• Flechas ×${order.arrows}\n` : "";
  const totalFormatted = order.total.toLocaleString("pt-BR", {
    style: "currency", currency: "BRL"
  });

  const entries  = Object.entries(order.weapons || {});
  const mats     = calculateMaterials(entries, order.arrows || 0);
  const matsLines = Object.entries(mats).length
    ? Object.entries(mats).map(([m, q]) => `• ${m} ×${q}`).join("\n")
    : "Nenhum material calculado";

  const statusHistory = (order.statusHistory || [])
    .map(h => `${h.emoji} **${h.label}** — ${h.time}`)
    .join("\n") || `${statusInfo.emoji} **${statusInfo.label}**`;

  // Badge de transferência no título e na descrição
  const transferBadge = order.transferredFrom
    ? `\n\n> 🔄 **Pedido Transferido** — recebido de **${order.transferredFrom}**`
    : "";

  const payload = {
    username:   "⚔️ Forja de Armas",
    avatar_url: "https://i.imgur.com/AfFp7pu.png",
    embeds: [{
      title: `${statusInfo.emoji} Pedido #${order.shortId} — ${statusInfo.label}${order.transferredFrom ? "  🔄" : ""}`,
      description:
        `**👤 Cliente:** ${order.clientName}\n` +
        `**🪪 Passaporte:** ${order.passport}\n` +
        `${transferBadge}\n\n` +
        `**📦 Itens do Pedido:**\n${weaponLines}\n${arrowLine}\n` +
        `**⚗️ Materiais Necessários:**\n${matsLines}\n\n` +
        `**💰 Total:** ${totalFormatted}\n\n` +
        `**📋 Histórico de Status:**\n${statusHistory}`,
      color:     statusInfo.color,
      footer:    { text: `Forjador: ${order.smithName} | Pedido: #${order.shortId}` },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    if (order.discordMessageId) {
      const editRes = await fetch(
        `${webhookUrl}/messages/${order.discordMessageId}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      if (editRes.ok) {
        console.log("✅ Mensagem de status editada no Discord.");
        return order.discordMessageId;
      }
    }

    const res = await fetch(`${webhookUrl}?wait=true`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      console.log("✅ Mensagem criada no Discord. ID:", data.id);
      return data.id;
    }
  } catch (e) {
    console.error("❌ Erro ao enviar status Discord:", e);
  }
  return null;
}

// ========================
// CLIENT STATE
// ========================
let clientSelectedWeapons = {};
let clientArrowQtyVal     = 0;
let clientActiveCategory  = "Todos";

function clientInit() {
  clientSelectedWeapons = {};
  clientArrowQtyVal     = 0;
  clientActiveCategory  = "Todos";
  document.getElementById("clientArrowQty").value        = 0;
  document.getElementById("clientArrowInfo").textContent = "Insira a quantidade desejada de flechas (múltiplos de 100)";
  document.getElementById("clientName").value            = "";
  document.getElementById("clientPassport").value        = "";

  const srEl = document.getElementById("statusResult");
  const spEl = document.getElementById("statusPassportInput");
  if (srEl) srEl.innerHTML = "";
  if (spEl) spEl.value = "";

  buildCategoryTabs("client", clientActiveCategory);
  buildWeaponGrid("client", clientSelectedWeapons, clientActiveCategory, "");
  renderSummary("client", clientSelectedWeapons, clientArrowQtyVal, false);
}

function clientSetCategory(cat) {
  clientActiveCategory = cat;
  buildCategoryTabs("client", clientActiveCategory);
  buildWeaponGrid("client", clientSelectedWeapons, clientActiveCategory,
    document.getElementById("clientSearchInput").value);
  renderSummary("client", clientSelectedWeapons, clientArrowQtyVal, false);
}

function clientFilterWeapons() {
  buildWeaponGrid("client", clientSelectedWeapons, clientActiveCategory,
    document.getElementById("clientSearchInput").value);
  renderSummary("client", clientSelectedWeapons, clientArrowQtyVal, false);
}

function clientChangeQty(name, delta, event) {
  event.stopPropagation();
  const cur = clientSelectedWeapons[name] || 0;
  const nxt = Math.max(0, cur + delta);
  if (nxt === 0) delete clientSelectedWeapons[name];
  else clientSelectedWeapons[name] = nxt;
  buildWeaponGrid("client", clientSelectedWeapons, clientActiveCategory,
    document.getElementById("clientSearchInput").value);
  renderSummary("client", clientSelectedWeapons, clientArrowQtyVal, false);
}

function clientRemoveItem(name) {
  delete clientSelectedWeapons[name];
  buildWeaponGrid("client", clientSelectedWeapons, clientActiveCategory,
    document.getElementById("clientSearchInput").value);
  renderSummary("client", clientSelectedWeapons, clientArrowQtyVal, false);
}

function clientUpdateArrows() {
  clientArrowQtyVal = Math.max(0,
    parseInt(document.getElementById("clientArrowQty").value) || 0);
  const sets = Math.ceil(clientArrowQtyVal / 100);
  const cost = sets * 10000;
  document.getElementById("clientArrowInfo").textContent =
    clientArrowQtyVal > 0
      ? `${clientArrowQtyVal} flechas = ${sets} conjunto(s) de 100 → ${cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
      : "Insira a quantidade desejada de flechas (múltiplos de 100)";
  renderSummary("client", clientSelectedWeapons, clientArrowQtyVal, false);
}

function clientIncreaseArrows() {
  clientArrowQtyVal += 100;
  document.getElementById("clientArrowQty").value = clientArrowQtyVal;
  clientUpdateArrows();
}

function clientDecreaseArrows() {
  clientArrowQtyVal = Math.max(0, clientArrowQtyVal - 100);
  document.getElementById("clientArrowQty").value = clientArrowQtyVal;
  clientUpdateArrows();
}

function clientClearAll() {
  clientSelectedWeapons = {};
  clientArrowQtyVal     = 0;
  document.getElementById("clientArrowQty").value        = 0;
  document.getElementById("clientArrowInfo").textContent = "Insira a quantidade desejada de flechas (múltiplos de 100)";
  buildWeaponGrid("client", clientSelectedWeapons, clientActiveCategory, "");
  renderSummary("client", clientSelectedWeapons, clientArrowQtyVal, false);
  showNotif("Seleção limpa!");
}

// ========================
// CONSULTAR STATUS DO PEDIDO (CLIENTE)
// ========================
async function consultarStatusPedido() {
  const passport = document.getElementById("statusPassportInput")?.value.trim();
  const resultEl = document.getElementById("statusResult");

  if (!resultEl) return;
  if (!passport) {
    resultEl.innerHTML = `<div class="status-result-error">⚠️ Digite seu passaporte.</div>`;
    return;
  }

  resultEl.innerHTML = `<div class="empty-state">🔍 Buscando...</div>`;

  try {
    const snap = await firebaseGet(firebaseRef(firebaseDB, "orders"));
    if (!snap.exists()) {
      resultEl.innerHTML = `<div class="status-result-empty">Nenhum pedido encontrado para este passaporte.</div>`;
      return;
    }

    const orders = [];
    snap.forEach(child => {
      const val = child.val();
      if (val.passport === passport) {
        orders.push({ id: child.key, ...val });
      }
    });

    if (!orders.length) {
      resultEl.innerHTML = `<div class="status-result-empty">🔍 Nenhum pedido encontrado para o passaporte <strong>${passport}</strong>.</div>`;
      return;
    }

    orders.sort((a, b) => (b.takenAt || "").localeCompare(a.takenAt || ""));

    resultEl.innerHTML = orders.map(order => {
      const statusInfo = getStatusInfo(order.status || "queue");
      const weaponLines = Object.entries(order.weapons || {})
        .map(([n, q]) => `<span class="status-item">${n} ×${q}</span>`)
        .join("");
      const arrowLine = order.arrows > 0
        ? `<span class="status-item">Flechas ×${order.arrows}</span>`
        : "";
      const totalFormatted = (order.total || 0).toLocaleString("pt-BR", {
        style: "currency", currency: "BRL"
      });
      const smithLine = order.smithName
        ? `<div class="status-smith">🔨 Forjador: <strong>${order.smithName}</strong></div>`
        : `<div class="status-smith">⏳ Aguardando forjador...</div>`;

      // ✅ Filtra transferências — cliente só vê status relevantes
      const historyHtml = (order.statusHistory || [])
        .filter(h => h.key !== "transfer")
        .map(h =>
          `<div class="status-history-item">${h.emoji} <strong>${h.label}</strong> <span>${h.time}</span></div>`
        ).join("");

      return `
        <div class="status-result-card">
          <div class="status-result-header">
            <span class="status-badge" style="background:${statusInfo.color}22;color:#fff;border:1px solid ${statusInfo.color}55;">
              ${statusInfo.emoji} ${statusInfo.label}
            </span>
            <span class="status-order-id">#${order.shortId || order.id.slice(-6).toUpperCase()}</span>
          </div>
          ${smithLine}
          <div class="status-items-row">${weaponLines}${arrowLine}</div>
          <div class="status-total">💰 ${totalFormatted}</div>
          ${historyHtml ? `<div class="status-history">${historyHtml}</div>` : ""}
          <div class="status-time">📅 Pedido em: ${order.timestamp}</div>
        </div>`;
    }).join("");

  } catch (e) {
    console.error(e);
    resultEl.innerHTML = `<div class="status-result-error">❌ Erro ao buscar pedido. Tente novamente.</div>`;
  }
}

// ========================
// CLIENT SEND ORDER
// ========================
async function clientSendOrder() {
  const entries  = Object.entries(clientSelectedWeapons);
  const name     = document.getElementById("clientName").value.trim();
  const passport = document.getElementById("clientPassport").value.trim();
  const btn      = document.querySelector("#screen-client .send-btn");

  if (!name) {
    showNotif("⚠️ Preencha seu nome na cidade!", "#f59e0b");
    document.getElementById("clientName").focus();
    return;
  }
  if (!passport) {
    showNotif("⚠️ Preencha seu passaporte!", "#f59e0b");
    document.getElementById("clientPassport").focus();
    return;
  }
  if (entries.length === 0 && clientArrowQtyVal === 0) {
    showNotif("⚠️ Selecione pelo menos uma arma!", "#f59e0b");
    return;
  }

  const resumeText = buildResumeText(entries, clientArrowQtyVal, { name, passport });
  const total      = calcTotal(entries, clientArrowQtyVal);
  const shortId    = Date.now().toString(36).toUpperCase().slice(-6);

  if (btn) { btn.disabled = true; btn.textContent = "Enviando..."; btn.style.opacity = "0.7"; }

  try {
    const order = {
      clientName:    name,
      passport:      passport,
      weapons:       { ...clientSelectedWeapons },
      arrows:        clientArrowQtyVal,
      resumeText:    resumeText,
      total:         total,
      timestamp:     new Date().toLocaleString("pt-BR"),
      status:        "queue",
      shortId:       shortId,
      statusHistory: [{ key: "queue", label: "Na fila", emoji: "🟡", time: new Date().toLocaleString("pt-BR") }]
    };

    const newRef = firebasePush(firebaseRef(firebaseDB, "orders"));
    await firebaseSet(newRef, order);

    notifyNewOrder(order);
    showNotif("✅ Pedido enviado! Consulte o status pelo passaporte.", "#059669");

    clientClearAll();
    document.getElementById("clientName").value     = "";
    document.getElementById("clientPassport").value = "";

  } catch (e) {
    console.error("❌ Erro ao salvar pedido:", e);
    showNotif("❌ Erro ao enviar pedido. Tente novamente.", "#f87171");
  }

  if (btn) { btn.disabled = false; btn.textContent = "📨 Enviar Pedido"; btn.style.opacity = "1"; }
}

function calcTotal(entries, arrows) {
  let total = 0;
  entries.forEach(([name, qty]) => {
    const w = WEAPON_DATA.find(x => x.name === name);
    if (w) total += w.price * qty;
  });
  if (arrows > 0) total += Math.ceil(arrows / 100) * 10000;
  return total;
}

// ========================
// SMITH STATE
// ========================
let smithSelectedWeapons = {};
let smithArrowQtyVal     = 0;
let smithActiveCategory  = "Todos";

function smithInit() {
  smithSelectedWeapons = {};
  smithArrowQtyVal     = 0;
  smithActiveCategory  = "Todos";
  document.getElementById("smithArrowQty").value        = 0;
  document.getElementById("smithArrowInfo").textContent = "Insira a quantidade desejada de flechas (múltiplos de 100)";
  document.getElementById("smithName").textContent      = currentSmith.displayName;

  loadWebhook();
  buildCategoryTabs("smith", smithActiveCategory);
  buildWeaponGrid("smith", smithSelectedWeapons, smithActiveCategory, "");
  renderSummary("smith", smithSelectedWeapons, smithArrowQtyVal);
  listenOrders();
  loadMyOrders();
}

function smithSetCategory(cat) {
  smithActiveCategory = cat;
  buildCategoryTabs("smith", smithActiveCategory);
  buildWeaponGrid("smith", smithSelectedWeapons, smithActiveCategory,
    document.getElementById("smithSearchInput").value);
}

function smithFilterWeapons() {
  buildWeaponGrid("smith", smithSelectedWeapons, smithActiveCategory,
    document.getElementById("smithSearchInput").value);
}

function smithChangeQty(name, delta, event) {
  event.stopPropagation();
  const cur = smithSelectedWeapons[name] || 0;
  const nxt = Math.max(0, cur + delta);
  if (nxt === 0) delete smithSelectedWeapons[name];
  else smithSelectedWeapons[name] = nxt;
  buildWeaponGrid("smith", smithSelectedWeapons, smithActiveCategory,
    document.getElementById("smithSearchInput").value);
  renderSummary("smith", smithSelectedWeapons, smithArrowQtyVal);
}

function smithRemoveItem(name) {
  delete smithSelectedWeapons[name];
  buildWeaponGrid("smith", smithSelectedWeapons, smithActiveCategory,
    document.getElementById("smithSearchInput").value);
  renderSummary("smith", smithSelectedWeapons, smithArrowQtyVal);
}

function smithUpdateArrows() {
  smithArrowQtyVal = Math.max(0,
    parseInt(document.getElementById("smithArrowQty").value) || 0);
  const sets = Math.ceil(smithArrowQtyVal / 100);
  const cost = sets * 10000;
  document.getElementById("smithArrowInfo").textContent =
    smithArrowQtyVal > 0
      ? `${smithArrowQtyVal} flechas = ${sets} conjunto(s) de 100 → ${cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
      : "Insira a quantidade desejada de flechas (múltiplos de 100)";
  renderSummary("smith", smithSelectedWeapons, smithArrowQtyVal);
}

function smithIncreaseArrows() {
  smithArrowQtyVal += 100;
  document.getElementById("smithArrowQty").value = smithArrowQtyVal;
  smithUpdateArrows();
}

function smithDecreaseArrows() {
  smithArrowQtyVal = Math.max(0, smithArrowQtyVal - 100);
  document.getElementById("smithArrowQty").value = smithArrowQtyVal;
  smithUpdateArrows();
}

function smithClearAll() {
  smithSelectedWeapons = {};
  smithArrowQtyVal     = 0;
  document.getElementById("smithArrowQty").value        = 0;
  document.getElementById("smithArrowInfo").textContent = "Insira a quantidade desejada de flechas (múltiplos de 100)";
  buildWeaponGrid("smith", smithSelectedWeapons, smithActiveCategory, "");
  renderSummary("smith", smithSelectedWeapons, smithArrowQtyVal);
  showNotif("Seleção limpa!");
}

function smithCopyResume() {
  const entries = Object.entries(smithSelectedWeapons);
  if (entries.length === 0 && smithArrowQtyVal === 0) {
    showNotif("Nenhum item para copiar!"); return;
  }
  const text = buildResumeText(entries, smithArrowQtyVal, null);
  navigator.clipboard.writeText(text)
    .then(()  => showNotif("✅ Resumo copiado!", "#059669"))
    .catch(()  => showNotif("Erro ao copiar."));
}

// ========================
// FILA DE PEDIDOS (TEMPO REAL)
// ========================
function listenOrders() {
  if (window._queueListener) {
    window._queueListener();
    window._queueListener = null;
  }

  const ordersRef = firebaseRef(firebaseDB, "orders");

  window._queueListener = firebaseOnValue(ordersRef, (snapshot) => {
    const container = document.getElementById("ordersQueue");
    if (!container) return;

    if (!snapshot.exists()) {
      container.innerHTML = `<div class="empty-state">Nenhum pedido na fila no momento.</div>`;
      return;
    }

    // Só mostra pedidos sem forjador (status = queue e sem smithId)
    const orders = [];
    snapshot.forEach(child => {
      const val = child.val();
      if (!val.smithId) orders.push({ id: child.key, ...val });
    });

    if (!orders.length) {
      container.innerHTML = `<div class="empty-state">Nenhum pedido na fila no momento.</div>`;
      return;
    }

    orders.reverse();

    container.innerHTML = orders.map(order => {
      const weaponLines = Object.entries(order.weapons || {})
        .map(([n, q]) => `${n} ×${q}`).join(", ");
      const arrowLine = order.arrows > 0 ? ` | Flechas ×${order.arrows}` : "";
      const totalFormatted = order.total.toLocaleString("pt-BR", {
        style: "currency", currency: "BRL"
      });

      const transferBadge = order.transferredFrom
        ? `<div class="order-transfer-badge">🔄 Transferido de <strong>${order.transferredFrom}</strong></div>`
        : "";

      return `
        <div class="order-card" id="order-${order.id}">
          <div class="order-header">
            <div>
              <span class="order-client-name">👤 ${order.clientName}</span>
              <span class="order-passport"> — 🪪 ${order.passport}</span>
            </div>
            <span class="order-time">🕐 ${order.timestamp}</span>
          </div>
          ${transferBadge}
          <div class="order-items">${weaponLines}${arrowLine}</div>
          <div class="order-total">💰 ${totalFormatted}</div>
          <div class="order-actions">
            <button class="order-take-btn"
              onclick="smithTakeOrder('${order.id}', '${escapeQuotes(order.resumeText)}', '${escapeQuotes(order.clientName)}')">
              ✅ Pegar Pedido
            </button>
            <button class="order-dismiss-btn" onclick="smithDismissOrder('${order.id}')">
              ✕ Descartar
            </button>
          </div>
        </div>`;
    }).join("");
  });
}

// ========================
// PEGAR PEDIDO
// ========================
async function smithTakeOrder(id, resumeText, clientName) {
  const webhook = await getWebhook();
  if (!webhook) {
    showNotif("⚠️ Defina sua Webhook antes de pegar um pedido!", "#f59e0b");
    return;
  }

  try {
    const snap = await firebaseGet(firebaseRef(firebaseDB, `orders/${id}`));
    if (!snap.exists()) { showNotif("❌ Pedido não encontrado.", "#f87171"); return; }
    const order = { id, ...snap.val() };

    const takenAt = new Date().toLocaleString("pt-BR");
    const updatedOrder = {
      ...order,
      smithId:   currentSmith.id,
      smithName: currentSmith.displayName,
      status:    "collecting",
      takenAt:   takenAt,
      statusHistory: [
        ...(order.statusHistory || []),
        { key: "collecting", label: "Coletando Materiais", emoji: "🔵", time: takenAt }
      ]
    };

    await firebaseSet(firebaseRef(firebaseDB, `orders/${id}`), updatedOrder);

    const msgId = await sendOrUpdateStatusMessage(updatedOrder, webhook);
    if (msgId) {
      await firebaseSet(
        firebaseRef(firebaseDB, `orders/${id}/discordMessageId`), msgId
      );
      updatedOrder.discordMessageId = msgId;
    }

    showNotif(`✅ Pedido de ${clientName} aceito!`, "#059669");
    loadMyOrders();

    if (typeof addLog === "function")
      addLog("order", `Forjador "${currentSmith.displayName}" pegou pedido de "${clientName}".`);

  } catch (e) {
    console.error(e);
    showNotif("❌ Erro ao pegar pedido.", "#f87171");
  }
}

// ========================
// MEUS PEDIDOS — FORJADOR
// ========================
async function loadMyOrders() {
  const container = document.getElementById("myOrdersList");
  if (!container || !currentSmith) return;

  container.innerHTML = `<div class="empty-state">Carregando...</div>`;

  try {
    const snap = await firebaseGet(firebaseRef(firebaseDB, "orders"));
    if (!snap.exists()) {
      container.innerHTML = `<div class="empty-state">Nenhum pedido em andamento.</div>`;
      return;
    }

    const myOrders = [];
    snap.forEach(child => {
      const val = child.val();
      if (val.smithId === currentSmith.id) {
        myOrders.push({ id: child.key, ...val });
      }
    });

    if (!myOrders.length) {
      container.innerHTML = `<div class="empty-state">Nenhum pedido em andamento.</div>`;
      return;
    }

    myOrders.sort((a, b) => (b.takenAt || "").localeCompare(a.takenAt || ""));

    container.innerHTML = myOrders.map(order => {
      const statusInfo  = getStatusInfo(order.status || "collecting");
      const weaponLines = Object.entries(order.weapons || {})
        .map(([n, q]) => `${n} ×${q}`).join(", ");
      const arrowLine   = order.arrows > 0 ? ` | Flechas ×${order.arrows}` : "";
      const totalFormatted = order.total.toLocaleString("pt-BR", {
        style: "currency", currency: "BRL"
      });

      const entries  = Object.entries(order.weapons || {});
      const mats     = calculateMaterials(entries, order.arrows || 0);
      const matsHtml = Object.entries(mats).length
        ? Object.entries(mats).map(([m, q]) =>
            `<span class="mat-tag">⚗️ ${m} ×${q}</span>`
          ).join("")
        : "";

      const statusButtons = ORDER_STATUSES
        .filter(s => s.key !== "queue")
        .map(s => `
          <button
            class="status-btn ${order.status === s.key ? "status-btn-active" : ""}"
            onclick="updateOrderStatus('${order.id}', '${s.key}')"
            ${order.status === s.key ? "disabled" : ""}
          >
            ${s.emoji} ${s.label}
          </button>`
        ).join("");

      const historyHtml = (order.statusHistory || []).map(h =>
        `<div class="my-order-history-item">${h.emoji} <strong>${h.label}</strong> — ${h.time}</div>`
      ).join("");

      // Badge de transferência
      const transferBadge = order.transferredFrom
        ? `<div class="my-order-transfer-badge">🔄 Transferido de <strong>${order.transferredFrom}</strong></div>`
        : "";

      return `
        <div class="my-order-card" id="myorder-${order.id}">
          <div class="my-order-header">
            <div>
              <span class="order-client-name">👤 ${order.clientName}</span>
              <span class="order-passport"> — 🪪 ${order.passport}</span>
            </div>
            <span class="status-badge-sm" style="background:${statusInfo.color}22;border:1px solid ${statusInfo.color}55;">
              ${statusInfo.emoji} ${statusInfo.label}
            </span>
          </div>
          ${transferBadge}
          <div class="order-items">${weaponLines}${arrowLine}</div>
          ${matsHtml ? `<div class="mats-row">${matsHtml}</div>` : ""}
          <div class="order-total">💰 ${totalFormatted}</div>
          ${historyHtml ? `<div class="my-order-history">${historyHtml}</div>` : ""}
          <div class="status-buttons-row">${statusButtons}</div>
          <div class="transfer-actions-row">
            <button class="transfer-btn" onclick="openTransferModal('${order.id}', '${escapeQuotes(order.clientName)}')">
              🔄 Transferir Pedido
            </button>
          </div>
          ${order.status === "done" ? `
            <button class="order-dismiss-btn" style="margin-top:8px;width:100%;"
              onclick="confirmRemoveOrder('${order.id}', '${escapeQuotes(order.clientName)}')">
              🗑️ Remover Pedido Concluído
            </button>` : ""}
        </div>`;
    }).join("");

  } catch (e) {
    console.error(e);
    container.innerHTML = `<div class="empty-state">Erro ao carregar pedidos.</div>`;
  }
}

// ========================
// MODAL DE TRANSFERÊNCIA
// ========================
async function openTransferModal(orderId, clientName) {
  // Remove modal anterior se existir
  const existing = document.getElementById("transferModal");
  if (existing) existing.remove();

  // Busca todos os forjadores exceto o atual
  let smithsList = [];
  try {
    const snap = await firebaseGet(firebaseRef(firebaseDB, "smiths"));
    if (snap.exists()) {
      snap.forEach(child => {
        if (child.key !== currentSmith.id) {
          smithsList.push({ id: child.key, ...child.val() });
        }
      });
    }
  } catch (e) {
    console.error(e);
    showNotif("❌ Erro ao carregar forjadores.", "#f87171");
    return;
  }

  if (!smithsList.length) {
    showNotif("⚠️ Nenhum outro forjador disponível para transferência.", "#f59e0b");
    return;
  }

  const smithOptions = smithsList.map(s => `
    <label class="smith-transfer-option" id="transfer-opt-${s.id}">
      <input type="radio" name="transferTarget" value="${s.id}" data-name="${escapeQuotes(s.displayName)}"/>
      <div class="smith-transfer-info">
        <span class="smith-transfer-name">${s.displayName}</span>
        <span class="smith-transfer-user">👤 ${s.user} · 🪪 ${s.passport || "—"}</span>
      </div>
    </label>`).join("");

  const modal = document.createElement("div");
  modal.id = "transferModal";
  modal.innerHTML = `
    <div class="modal-overlay" id="transferOverlay">
      <div class="modal-box transfer-modal-box">
        <h3>🔄 Transferir Pedido</h3>
        <p class="modal-subtitle">
          Selecione o forjador que receberá o pedido de
          <strong style="color:#c084fc;">${clientName}</strong>.
        </p>
        <div class="transfer-smiths-list" id="transferSmithsList">
          ${smithOptions}
        </div>
        <div class="transfer-note-row">
          <label style="font-size:0.82rem;color:#a78bfa;display:block;margin-bottom:6px;">
            📝 Observação (opcional)
          </label>
          <input
            type="text"
            id="transferNote"
            placeholder="Ex: Saindo agora, você pode continuar."
            style="
              width:100%;padding:9px 12px;
              background:#1a1a3a;border:1px solid #3d3d7a;
              border-radius:8px;color:#e0e0ff;font-size:0.85rem;outline:none;
            "
          />
        </div>
        <div class="login-error hidden" id="transferError" style="display:none;"></div>
        <div class="modal-actions" style="margin-top:18px;">
          <button class="modal-cancel-btn"  onclick="closeTransferModal()">Cancelar</button>
          <button class="modal-confirm-btn transfer-confirm-btn" id="transferConfirmBtn"
            onclick="confirmTransfer('${orderId}', '${escapeQuotes(clientName)}')">
            🔄 Transferir
          </button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);

  // Highlight ao selecionar forjador
  modal.querySelectorAll("input[name='transferTarget']").forEach(radio => {
    radio.addEventListener("change", () => {
      modal.querySelectorAll(".smith-transfer-option").forEach(opt =>
        opt.classList.remove("selected")
      );
      radio.closest(".smith-transfer-option").classList.add("selected");
    });
  });

  document.getElementById("transferOverlay").addEventListener("click", function (e) {
    if (e.target === this) closeTransferModal();
  });

  document.addEventListener("keydown", function escTransfer(e) {
    if (e.key === "Escape") {
      closeTransferModal();
      document.removeEventListener("keydown", escTransfer);
    }
  });
}

function closeTransferModal() {
  const modal = document.getElementById("transferModal");
  if (modal) {
    const box = modal.querySelector(".modal-box");
    if (box) box.style.animation = "modalOut 0.18s ease forwards";
    setTimeout(() => modal.remove(), 180);
  }
}

// ========================
// CONFIRMAR TRANSFERÊNCIA
// ========================
async function confirmTransfer(orderId, clientName) {
  const selected = document.querySelector("input[name='transferTarget']:checked");
  const errEl    = document.getElementById("transferError");
  const btn      = document.getElementById("transferConfirmBtn");
  const note     = document.getElementById("transferNote")?.value.trim() || "";

  if (errEl) { errEl.textContent = ""; errEl.classList.add("hidden"); errEl.style.display = "none"; }

  if (!selected) {
    if (errEl) {
      errEl.textContent = "⚠️ Selecione um forjador para transferir.";
      errEl.classList.remove("hidden");
      errEl.style.display = "";
    }
    return;
  }

  const targetSmithId   = selected.value;
  const targetSmithName = selected.getAttribute("data-name");

  if (btn) { btn.disabled = true; btn.textContent = "Transferindo..."; btn.style.opacity = "0.7"; }

  try {
    // Busca dados completos do pedido
    const snap = await firebaseGet(firebaseRef(firebaseDB, `orders/${orderId}`));
    if (!snap.exists()) {
      showNotif("❌ Pedido não encontrado.", "#f87171");
      closeTransferModal();
      return;
    }

    const order = { id: orderId, ...snap.val() };

    // ── 1. Deleta a mensagem do Discord do forjador atual ──────────────────
    if (order.discordMessageId) {
      const oldWebhook = await getWebhook(); // webhook do forjador ATUAL
      if (oldWebhook) {
        await deleteDiscordMessage(oldWebhook, order.discordMessageId);
      }
    }

    // ── 2. Busca a webhook do forjador de destino ──────────────────────────
    const targetWebhookSnap = await firebaseGet(
      firebaseRef(firebaseDB, `webhooks/${targetSmithId}`)
    );
    const targetWebhook = targetWebhookSnap.exists() ? targetWebhookSnap.val() : "";

    const now = new Date().toLocaleString("pt-BR");

    // ── 3. Monta o pedido atualizado ───────────────────────────────────────
    const transferNote = note
      ? `\n📝 Obs: "${note}"`
      : "";

    const updatedOrder = {
      ...order,
      smithId:         targetSmithId,
      smithName:       targetSmithName,
      discordMessageId: null,           // zera — nova mensagem será criada
      transferredFrom: currentSmith.displayName,
      transferNote:    note || null,
      statusHistory:   [
        ...(order.statusHistory || []),
        {
          key:   "transfer",
          label: `Transferido por ${currentSmith.displayName} → ${targetSmithName}${transferNote}`,
          emoji: "🔄",
          time:  now
        }
      ]
    };

    await firebaseSet(firebaseRef(firebaseDB, `orders/${orderId}`), updatedOrder);

    // ── 4. Cria nova mensagem no Discord do forjador de destino ────────────
    if (targetWebhook) {
      const newMsgId = await sendOrUpdateStatusMessage(updatedOrder, targetWebhook);
      if (newMsgId) {
        await firebaseSet(
          firebaseRef(firebaseDB, `orders/${orderId}/discordMessageId`),
          newMsgId
        );
      }
    } else {
      console.warn("⚠️ Forjador de destino não tem webhook configurada.");
    }

    // ── 5. Log ─────────────────────────────────────────────────────────────
    if (typeof addLog === "function") {
      addLog(
        "order",
        `Forjador "${currentSmith.displayName}" transferiu pedido #${order.shortId} ` +
        `de "${clientName}" para "${targetSmithName}".` +
        (note ? ` Obs: "${note}"` : "")
      );
    }

    closeTransferModal();
    showNotif(`🔄 Pedido transferido para ${targetSmithName}!`, "#7b2fff");
    loadMyOrders();

  } catch (e) {
    console.error("Erro ao transferir pedido:", e);
    showNotif("❌ Erro ao transferir pedido.", "#f87171");
    if (btn) { btn.disabled = false; btn.textContent = "🔄 Transferir"; btn.style.opacity = "1"; }
  }
}

// ========================
// ATUALIZAR STATUS DO PEDIDO
// ========================
async function updateOrderStatus(orderId, newStatusKey) {
  const webhook = await getWebhook();
  if (!webhook) {
    showNotif("⚠️ Webhook não configurada!", "#f59e0b"); return;
  }

  try {
    const snap = await firebaseGet(firebaseRef(firebaseDB, `orders/${orderId}`));
    if (!snap.exists()) { showNotif("❌ Pedido não encontrado.", "#f87171"); return; }

    const order      = { id: orderId, ...snap.val() };
    const statusInfo = getStatusInfo(newStatusKey);
    const now        = new Date().toLocaleString("pt-BR");

    const updatedOrder = {
      ...order,
      status: newStatusKey,
      statusHistory: [
        ...(order.statusHistory || []),
        { key: newStatusKey, label: statusInfo.label, emoji: statusInfo.emoji, time: now }
      ]
    };

    if (newStatusKey === "done") {
      updatedOrder.doneAt      = new Date().toISOString();
      updatedOrder.removeAfter = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    await firebaseSet(firebaseRef(firebaseDB, `orders/${orderId}`), updatedOrder);

    const msgId = await sendOrUpdateStatusMessage(updatedOrder, webhook);
    if (msgId && msgId !== order.discordMessageId) {
      await firebaseSet(firebaseRef(firebaseDB, `orders/${orderId}/discordMessageId`), msgId);
    }

    const statusLabel = statusInfo.label;
    showNotif(`${statusInfo.emoji} Status atualizado: ${statusLabel}`, "#059669");

    if (typeof addLog === "function")
      addLog("order", `Pedido #${order.shortId} de "${order.clientName}" → ${statusLabel}`);

    loadMyOrders();

  } catch (e) {
    console.error(e);
    showNotif("❌ Erro ao atualizar status.", "#f87171");
  }
}

// ========================
// REMOVER PEDIDO CONCLUÍDO
// ========================
function confirmRemoveOrder(id, clientName) {
  const existing = document.getElementById("confirmRemoveModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "confirmRemoveModal";
  modal.style.cssText = "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;";
  modal.innerHTML = `
    <div style="
      position:fixed;inset:0;
      background:rgba(0,0,0,0.75);
      backdrop-filter:blur(4px);
    "></div>
    <div style="
      position:relative;z-index:1;
      background:#12122a;
      border:1px solid #7b2fff55;
      border-radius:18px;
      padding:32px 28px;
      width:100%;max-width:400px;
      box-shadow:0 0 60px rgba(123,47,255,0.35);
      animation:modalIn 0.2s ease;
      text-align:center;
    ">
      <div style="font-size:2.5rem;margin-bottom:12px;">🗑️</div>
      <h3 style="color:#c084fc;font-size:1.2rem;margin-bottom:10px;">Remover Pedido Concluído</h3>
      <p style="color:#a0a0c0;font-size:0.9rem;margin-bottom:24px;">
        Deseja remover o pedido concluído de<br/>
        <strong style="color:#e0e0ff;">${clientName}</strong>?<br/>
        <span style="font-size:0.78rem;color:#6d6d9a;">Esta ação não pode ser desfeita.</span>
      </p>
      <div style="display:flex;gap:10px;">
        <button id="confirmRemoveCancel" style="
          flex:1;padding:11px;
          background:transparent;
          border:1px solid #3d3d7a;
          border-radius:10px;color:#a78bfa;
          font-size:0.88rem;cursor:pointer;
          transition:all 0.2s;
        ">Cancelar</button>
        <button id="confirmRemoveOk" style="
          flex:2;padding:11px;
          background:linear-gradient(135deg,#dc2626,#f87171);
          border:none;border-radius:10px;
          color:#fff;font-size:0.88rem;
          font-weight:700;cursor:pointer;
          transition:all 0.2s;
        ">🗑️ Sim, Remover</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeConfirmRemoveModal();
  });

  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      closeConfirmRemoveModal();
      document.removeEventListener("keydown", escHandler);
    }
  });

  document.getElementById("confirmRemoveCancel").onclick = closeConfirmRemoveModal;

  document.getElementById("confirmRemoveOk").onclick = async function () {
    closeConfirmRemoveModal();
    try {
      await firebaseRemove(firebaseRef(firebaseDB, `orders/${id}`));
      showNotif("🗑️ Pedido removido.", "#f87171");
      loadMyOrders();
    } catch (e) {
      showNotif("❌ Erro ao remover.", "#f87171");
      console.error(e);
    }
  };
}

function closeConfirmRemoveModal() {
  const modal = document.getElementById("confirmRemoveModal");
  if (modal) {
    modal.style.animation = "modalOut 0.18s ease forwards";
    setTimeout(() => modal.remove(), 180);
  }
}

async function smithDismissOrder(id) {
  await firebaseRemove(firebaseRef(firebaseDB, `orders/${id}`));
  showNotif("🗑️ Pedido descartado.");
}

// ========================
// ESCAPE
// ========================
function escapeQuotes(str) {
  return (str || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g,  "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}
