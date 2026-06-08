// ========================
// WEBHOOK — salva no Firebase por forjador
// ========================

async function loadWebhook() {
  try {
    const snap = await firebaseGet(
      firebaseRef(firebaseDB, `webhooks/${currentSmith.id}`)
    );
    const val = snap.exists() ? snap.val() : "";
    document.getElementById("webhookInput").value    = val;
    document.getElementById("webhookStatus").textContent  = val ? "✅ Webhook salva." : "";
    document.getElementById("webhookStatus").className    = val ? "webhook-status ok" : "webhook-status";
  } catch (e) {
    console.error("Erro ao carregar webhook:", e);
  }
}

async function getWebhook() {
  try {
    const snap = await firebaseGet(
      firebaseRef(firebaseDB, `webhooks/${currentSmith.id}`)
    );
    return snap.exists() ? snap.val() : "";
  } catch { return ""; }
}

async function saveWebhook() {
  const val      = document.getElementById("webhookInput").value.trim();
  const statusEl = document.getElementById("webhookStatus");
  const btn      = document.querySelector(".webhook-save-btn");

  if (
    !val.startsWith("https://discord.com/api/webhooks/") &&
    !val.startsWith("https://discordapp.com/api/webhooks/")
  ) {
    statusEl.textContent = "❌ URL inválida. Use uma webhook do Discord.";
    statusEl.className   = "webhook-status err";
    return;
  }

  setLoading(btn, true, "Salvando...");

  try {
    await firebaseSet(
      firebaseRef(firebaseDB, `webhooks/${currentSmith.id}`),
      val
    );
    statusEl.textContent = "✅ Webhook salva com sucesso!";
    statusEl.className   = "webhook-status ok";
    showNotif("✅ Webhook salva!", "#059669");
  } catch (e) {
    statusEl.textContent = "❌ Erro ao salvar. Tente novamente.";
    statusEl.className   = "webhook-status err";
    console.error(e);
  }

  setLoading(btn, false, "💾 Salvar");
}

// ========================
// SEND TO DISCORD
// ========================
function sendToDiscord(webhookUrl, text, onSuccess) {
  const payload = {
    username:   "⚔️ Forja de Armas",
    avatar_url: "https://i.imgur.com/AfFp7pu.png",
    embeds: [{
      title:       "📦 Novo Pedido de Armas",
      description: "```\n" + text + "\n```",
      color:       0x7b2fff,
      footer:      { text: `Forjador: ${currentSmith.displayName}` },
      timestamp:   new Date().toISOString()
    }]
  };

  fetch(webhookUrl, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload)
  })
  .then(res => {
    if (res.ok || res.status === 204) {
      if (onSuccess) onSuccess();
    } else {
      showNotif("❌ Erro ao enviar. Verifique a webhook.", "#f87171");
    }
  })
  .catch(() => {
    showNotif("❌ Falha de conexão ao enviar.", "#f87171");
  });
}

// ========================
// SMITH SEND MANUAL (com modal)
// ========================
function smithSendToDiscord() {
  const entries = Object.entries(smithSelectedWeapons);

  if (entries.length === 0 && smithArrowQtyVal === 0) {
    showNotif("⚠️ Selecione ao menos uma arma!", "#f59e0b");
    return;
  }

  getWebhook().then(webhook => {
    if (!webhook) {
      showNotif("⚠️ Defina sua Webhook antes de enviar!", "#f59e0b");
      return;
    }

    openSendModal(function (clientInfo) {
      const text = buildResumeText(entries, smithArrowQtyVal, clientInfo);
      sendToDiscord(webhook, text, () => {
        showNotif("✅ Pedido enviado ao Discord!", "#059669");
      });
    });
  });
}

// ========================
// MODAL
// ========================
function openSendModal(onConfirm) {
  const existing = document.getElementById("sendModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "sendModal";
  modal.innerHTML = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal-box">
        <h3>📨 Enviar Pedido ao Discord</h3>
        <p class="modal-subtitle">Informe os dados do jogador antes de enviar.</p>
        <div class="modal-form" id="modalFormFields">
          <div class="form-group">
            <label>Nome na cidade (RP) <span class="required">*</span></label>
            <input type="text" id="modalClientName" placeholder="Ex: João Silva" autocomplete="off"/>
          </div>
          <div class="form-group">
            <label>Passaporte <span class="required">*</span></label>
            <input type="text" id="modalClientPassport" placeholder="Ex: 123456" autocomplete="off"/>
          </div>
        </div>
        <label class="modal-skip-label">
          <input type="checkbox" id="modalSkipInfo" onchange="toggleModalFields()"/>
          <span>Informações não necessárias</span>
        </label>
        <div class="modal-error" id="modalError" style="display:none;">
          ⚠️ Preencha o nome e o passaporte para continuar.
        </div>
        <div class="modal-actions">
          <button class="modal-cancel-btn" onclick="closeSendModal()">Cancelar</button>
          <button class="modal-confirm-btn" id="modalConfirmBtn">📨 Enviar ao Discord</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);

  document.getElementById("modalOverlay").addEventListener("click", function (e) {
    if (e.target === this) closeSendModal();
  });

  modal.addEventListener("keydown", function (e) {
    if (e.key === "Enter")  document.getElementById("modalConfirmBtn").click();
    if (e.key === "Escape") closeSendModal();
  });

  document.getElementById("modalConfirmBtn").addEventListener("click", function () {
    const skip     = document.getElementById("modalSkipInfo").checked;
    const name     = document.getElementById("modalClientName").value.trim();
    const passport = document.getElementById("modalClientPassport").value.trim();
    const errorEl  = document.getElementById("modalError");

    if (!skip && (!name || !passport)) {
      errorEl.style.display = "block";
      if (!name) document.getElementById("modalClientName").focus();
      else document.getElementById("modalClientPassport").focus();
      return;
    }

    errorEl.style.display = "none";
    closeSendModal();
    onConfirm(skip ? null : { name, passport });
  });

  setTimeout(() => {
    const nameInput = document.getElementById("modalClientName");
    if (nameInput) nameInput.focus();
  }, 80);
}


function toggleModalFields() {
  const skip   = document.getElementById("modalSkipInfo").checked;
  const fields = document.getElementById("modalFormFields");
  const errorEl = document.getElementById("modalError");
  fields.style.opacity       = skip ? "0.35" : "1";
  fields.style.pointerEvents = skip ? "none"  : "auto";
  if (skip) errorEl.classList.add("hidden");
}

function closeSendModal() {
  const modal = document.getElementById("sendModal");
  if (modal) {
    modal.querySelector(".modal-box").style.animation = "modalOut 0.18s ease forwards";
    setTimeout(() => modal.remove(), 180);
  }
}
