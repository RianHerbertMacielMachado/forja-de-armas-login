// ============================================================
// FORGE — server.js
// ============================================================

const express = require("express");
const path    = require("path");
const fs      = require("fs");
const admin   = require("firebase-admin");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Firebase Admin SDK (inicialização segura) ─────────────────
let firebaseReady = false;

function initFirebaseAdmin() {
  if (admin.apps.length) { firebaseReady = true; return; }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw || raw.trim() === "" || raw.trim() === "{}") {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT não configurada ou vazia.");
    console.error("   Tamanho da variável:", raw ? raw.length : 0);
    console.error("   Servidor iniciará mas /api/firebase-token não funcionará.");
    return;
  }

  let serviceAccount;
  try {
    const normalized = raw.replace(/\\n/g, "\n");
    serviceAccount   = JSON.parse(normalized);
  } catch (e) {
    console.error("❌ JSON.parse falhou:", e.message);
    console.error("   Primeiros 100 chars:", raw.substring(0, 100));
    return;
  }

  const required = ["project_id", "client_email", "private_key"];
  const missing  = required.filter(k => !serviceAccount[k]);
  if (missing.length) {
    console.error(`❌ Service account faltando campos: ${missing.join(", ")}`);
    return;
  }

  try {
    admin.initializeApp({
      credential:  admin.credential.cert(serviceAccount),
      databaseURL: "https://forjadores-1a9ce-default-rtdb.firebaseio.com",
    });
    firebaseReady = true;
    console.log(`✅ Firebase Admin inicializado — projeto: ${serviceAccount.project_id}`);
  } catch (e) {
    console.error("❌ Erro ao inicializar Firebase Admin:", e.message);
  }
}

initFirebaseAdmin();

// ── Middlewares ───────────────────────────────────────────────
app.use(express.json());

// ── Diagnóstico (remover após confirmar funcionamento) ────────
app.get("/api/check-env", (req, res) => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  let parsed = null;
  let parseError = null;
  try {
    if (raw) parsed = JSON.parse(raw.replace(/\\n/g, "\n"));
  } catch (e) {
    parseError = e.message;
  }
  res.json({
    variavelExiste:  !!raw,
    tamanho:         raw ? raw.length : 0,
    primeiros50:     raw ? raw.substring(0, 50) : "VAZIO",
    firebaseReady,
    temProjectId:    parsed ? !!parsed.project_id   : false,
    temClientEmail:  parsed ? !!parsed.client_email  : false,
    temPrivateKey:   parsed ? !!parsed.private_key   : false,
    parseError,
  });
});

// ── Rota de imagens (case-insensitive) ────────────────────────
app.get("/image/:filename", (req, res) => {
  const imgDir    = path.join(__dirname, "frontend", "image");
  const requested = req.params.filename;
  try {
    const files = fs.readdirSync(imgDir);
    const match = files.find(f => f.toLowerCase() === requested.toLowerCase());
    if (match) return res.sendFile(path.join(imgDir, match));
    return res.status(404).send("Imagem não encontrada.");
  } catch {
    return res.status(500).send("Erro ao carregar imagem.");
  }
});

// ── Debug de imagens ──────────────────────────────────────────
app.get("/api/debug-images", (req, res) => {
  const imgDir = path.join(__dirname, "frontend", "image");
  try {
    const files = fs.readdirSync(imgDir).sort();
    res.json({ total: files.length, files });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Gerar token Firebase para forjador ────────────────────────
app.post("/api/firebase-token", async (req, res) => {
  if (!firebaseReady) {
    return res.status(503).json({
      error: "Firebase Admin não inicializado. Verifique a variável FIREBASE_SERVICE_ACCOUNT no Railway."
    });
  }
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "uid obrigatório" });
  try {
    const customToken = await admin.auth().createCustomToken(uid);
    res.json({ customToken });
  } catch (e) {
    console.error("Erro ao gerar token:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Static (frontend) ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, "frontend")));

// ── SPA fallback ──────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
  console.log(`🔥 Firebase pronto: ${firebaseReady}`);
});
