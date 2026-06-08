// ============================================================
// FORGE — webhook.js
// ============================================================

const DISCORD_WEBHOOK =
  "https://discord.com/api/webhooks/1510332405754499142/IegWcsQp-JSkI1aBJH08B3fN-yifPXdRwmXt1n_cXUwn9L0cCTr905UffrhBxjr9HRum";

// ── Cores por status ──────────────────────────────────────────
const STATUS_COLORS = {
  queue:      0xf59e0b,
  collecting: 0x3b82f6,
  producing:  0x8b5cf6,
  done:       0x22c55e,
};

const STATUS_LABELS = {
  queue:      "⏳ Na Fila",
  collecting: "🔩 Coletando Materiais",
  producing:  "⚒️ Produzindo",
  done:       "✅ Pronto para Retirada",
};

// ── Montar embed base ─────────────────────────────────────────
function buildOrderEmbed(order, smithData, isTransfer = false) {
  const weaponLines = (order.weapons || [])
    .map(w => `• **${w.qty}x** ${w.name} *(${w.category})*`)
    .join("\n");

  const arrowLine = order.arrows > 0 ? `\n🏹 **Flechas:** ${order.arrows}` : "";

  const transferNote = isTransfer
    ? `\n\n> 🔄 **Pedido transferido de ${order.transferredFrom}**${order.transferNote ? `\n> 📝 ${order.transferNote}` : ""}`
    : "";

  return {
    title:       `📦 Pedido #${order.id?.slice(-6)?.toUpperCase() || "------"}${isTransfer ? " 🔄" : ""}`,
    description: `${weaponLines}${arrowLine}${transferNote}`,
    color:       STATUS_COLORS[order.status] || 0x7b2fff,
    fields: [
      { name: "👤 Cliente",    value: order.clientName,     inline: true },
      { name: "🪪 Passaporte", value: order.clientPassport, inline: true },
      { name: "⚒️ Forjador",   value: smithData?.displayName || smithData?.user || order.smithName, inline: true },
      { name: "📊 Status",     value: STATUS_LABELS[order.status] || order.status, inline: true },
      { name: "💰 Total",      value: formatCurrency(order.total || 0), inline: true },
    ],
    footer: { text: `ID: ${order.id} • ${new Date(order.createdAt).toLocaleString("pt-BR")}` },
    timestamp: new Date().toISOString(),
  };
}

// ── Enviar pedido para Discord ────────────────────────────────
async function sendOrderToDiscord(order, smithData) {
  try {
    const payload = {
      content: `<@${smithData?.discordId || ""}> Novo pedido recebido!`,
      embeds:  [buildOrderEmbed(order, smithData, false)],
    };
    const res  = await fetch(`${DISCORD_WEBHOOK}?wait=true`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.id || null;
  } catch (e) {
    console.warn("Erro ao enviar para Discord:", e);
    return null;
  }
}

// ── Atualizar embed no Discord ────────────────────────────────
async function updateDiscordEmbed(orderId, orderData) {
  try {
    if (!orderData.discordMessageId) return;
    const payload = { embeds: [buildOrderEmbed(orderData, null, false)] };
    await fetch(`${DISCORD_WEBHOOK}/messages/${orderData.discordMessageId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn("Erro ao atualizar Discord:", e);
  }
}

// ── Deletar mensagem no Discord ───────────────────────────────
async function deleteDiscordMessage(webhookUrl, messageId) {
  try {
    const url = `${webhookUrl}/messages/${messageId}`;
    await fetch(url, { method: "DELETE" });
  } catch (e) {
    console.warn("Erro ao deletar mensagem Discord:", e);
  }
}

// ── Enviar embed de transferência ─────────────────────────────
async function sendTransferEmbed(order, targetSmith, note) {
  try {
    const transferOrder = { ...order, transferredFrom: order.transferredFrom || order.smithName };
    const payload = {
      content: `<@${targetSmith?.discordId || ""}> 🔄 Pedido transferido para você!`,
      embeds:  [buildOrderEmbed(transferOrder, targetSmith, true)],
    };
    const res  = await fetch(`${DISCORD_WEBHOOK}?wait=true`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.id || null;
  } catch (e) {
    console.warn("Erro ao enviar transferência Discord:", e);
    return null;
  }
}
