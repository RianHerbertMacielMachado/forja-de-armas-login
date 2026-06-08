// ============================================================
// FORGE — auth.js  (somente UI de autenticação)
// ============================================================

// ── Tela de Seleção ───────────────────────────────────────────
function selectRole(role) {
  if (role === "client")  goTo("client");
  if (role === "smith")   goTo("login");
  if (role === "admin") {
    showScreen("screen-admin-login");
  }
}

// ── Mostrar/Ocultar senha ─────────────────────────────────────
function togglePasswordVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const show = input.type === "password";
  input.type  = show ? "text" : "password";
  if (btnEl) btnEl.textContent = show ? "🙈" : "👁️";
}

// ── Loading helpers ───────────────────────────────────────────
function showLoading(msg = "Carregando...") {
  const el = document.getElementById("global-loading");
  if (!el) return;
  el.querySelector(".loading-text").textContent = msg;
  el.style.display = "flex";
}
function hideLoading() {
  const el = document.getElementById("global-loading");
  if (el) el.style.display = "none";
}

// ── Inicialização ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (typeof authInit === "function") authInit();
});
