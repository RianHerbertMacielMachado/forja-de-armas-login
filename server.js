// ============================================================
// FORGE — server.js
// ============================================================

const express = require("express");
const path    = require("path");
const fs      = require("fs");
const admin   = require("firebase-admin");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Firebase Admin SDK ────────────────────────────────────────
function initFirebaseAdmin() {
  if (admin.apps.length) return; // já inicializado

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw || raw.trim() === "" || raw.trim() === "{}") {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT não configurada ou vazia.");
    console.error("   Configure a variável de ambiente no Railway com o conteúdo do serviceAccount.json");
    process.exit(1);
  }

  let serviceAccount;
  try {
    // Corrige chave privada que pode ter \\n ao invés de \n
    const normalized = raw.replace(/\\n/g, "\n");
    serviceAccount   = JSON.parse(normalized);
  } catch (e) {
    console.error("❌ Falha ao fazer JSON.parse do FIREBASE_SERVICE_ACCOUNT:", e.message);
    process.exit(1);
  }

  // Valida campos obrigatórios
  const required = ["project_id", "client_email", "private_key"];
  const missing  = required.filter(k => !serviceAccount[k]);
  if (missing.length) {
    console.error(`❌ Service account faltando campos: ${missing.join(", ")}`);
    console.error("   Verifique se colou o JSON completo na variável FIREBASE_SERVICE_ACCOUNT");
    process.exit(1);
  }

  admin.initializeApp({
    credential:  admin.credential.cert(serviceAccount),
    databaseURL: "https://forjadores-1a9ce-default-rtdb.firebaseio.com",
  });

  console.log(`✅ Firebase Admin inicializado — projeto: ${serviceAccount.project_id}`);
}

initFirebaseAdmin();

// ── Middlewares ───────────────────────────────────────────────
app.use(express.json());

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

// ── Static (frontend) — depois das rotas específicas ─────────
app.use(express.static(path.join(__dirname, "frontend")));

// ── SPA fallback ──────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
});
