require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const admin   = require("firebase-admin");
const path    = require("path");
const fetch   = require("node-fetch");

// ========================
// VERIFICA VARIÁVEIS
// ========================
const requiredEnvVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_DATABASE_URL",
  "FIREBASE_API_KEY"
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Variável de ambiente faltando: ${varName}`);
    process.exit(1);
  }
});

// ========================
// FIREBASE ADMIN
// ========================
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db  = admin.database();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/images", express.static(path.join(__dirname, "image")));

// ========================
// ROTA: LOGIN
// ========================
app.post("/api/login", async (req, res) => {
  const { user, password } = req.body;
  if (!user || !password)
    return res.status(400).json({ error: "Dados incompletos." });

  try {
    const email  = `${user.toLowerCase()}@forja.rp`;
    const apiKey = process.env.FIREBASE_API_KEY;

    const authRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password, returnSecureToken: true })
      }
    );

    const authData = await authRes.json();

    if (!authRes.ok) {
      console.error("Erro auth Firebase:", authData);
      return res.status(401).json({ error: "Usuário ou senha incorretos." });
    }

    const uid         = authData.localId;
    const profileSnap = await db.ref(`smiths/${uid}`).once("value");

    if (!profileSnap.exists())
      return res.status(404).json({ error: "Perfil não encontrado. Contate o administrador." });

    const profile     = { id: uid, ...profileSnap.val() };
    const customToken = await admin.auth().createCustomToken(uid);

    await db.ref("logs").push({
      type:      "login",
      message:   `Forjador "${profile.displayName}" fez login.`,
      timestamp: new Date().toLocaleString("pt-BR"),
      iso:       new Date().toISOString()
    });

    res.json({ token: customToken, smith: profile });

  } catch (e) {
    console.error("Erro login:", e);
    res.status(500).json({ error: "Erro interno." });
  }
});

// ========================
// ROTA: REGISTRO
// ========================
app.post("/api/register", async (req, res) => {
  const { displayName, passport, user, password, token } = req.body;

  if (!displayName || !passport || !user || !password || !token)
    return res.status(400).json({ error: "Preencha todos os campos." });

  try {
    const tokenSnap = await db.ref("config/registerToken").once("value");
    const tokenData = tokenSnap.exists() ? tokenSnap.val() : null;

    if (!tokenData)
      return res.status(401).json({ error: "Nenhuma chave ativa." });
    if (tokenData.used)
      return res.status(401).json({ error: "Chave já utilizada." });
    if (token.toUpperCase() !== tokenData.token.toUpperCase())
      return res.status(401).json({ error: "Chave inválida." });

    const smithsSnap = await db.ref("smiths").once("value");
    if (smithsSnap.exists()) {
      let userExists     = false;
      let passportExists = false;
      smithsSnap.forEach(child => {
        const s = child.val();
        if (s.user && s.user.toLowerCase() === user.toLowerCase()) userExists = true;
        if (s.passport && s.passport.trim() === passport) passportExists = true;
      });
      if (userExists)     return res.status(409).json({ error: "Usuário já cadastrado." });
      if (passportExists) return res.status(409).json({ error: `Passaporte "${passport}" já cadastrado.` });
    }

    const email    = `${user.toLowerCase()}@forja.rp`;
    const userRec  = await admin.auth().createUser({ email, password });
    const uid      = userRec.uid;
    const fullName = `Forjador ${displayName}`;

    await db.ref(`smiths/${uid}`).set({
      user:        user.toLowerCase(),
      displayName: fullName,
      passport,
      createdAt:   new Date().toISOString()
    });

    await db.ref("config/registerToken").update({ used: true });

    await db.ref("logs").push({
      type:      "register",
      message:   `Novo forjador: "${fullName}" (${user})`,
      timestamp: new Date().toLocaleString("pt-BR"),
      iso:       new Date().toISOString()
    });

    res.json({ success: true, displayName: fullName, user: user.toLowerCase() });

  } catch (e) {
    if (e.code === "auth/email-already-exists")
      return res.status(409).json({ error: "Usuário já cadastrado no sistema." });
    console.error("Erro registro:", e);
    res.status(500).json({ error: "Erro ao cadastrar." });
  }
});

// ========================
// ROTA: ALTERAR SENHA
// ========================
app.post("/api/change-password", async (req, res) => {
  const { uid, newPassword } = req.body;
  if (!uid || !newPassword)
    return res.status(400).json({ error: "Dados incompletos." });
  if (newPassword.length < 6)
    return res.status(400).json({ error: "Senha deve ter ao menos 6 caracteres." });
  try {
    await admin.auth().updateUser(uid, { password: newPassword });
    res.json({ success: true });
  } catch (e) {
    console.error("Erro alterar senha:", e);
    res.status(500).json({ error: "Erro ao alterar senha." });
  }
});

// ========================
// ROTA: PERFIL DO FORJADOR
// ========================
app.get("/api/smith/:uid", async (req, res) => {
  try {
    const snap = await db.ref(`smiths/${req.params.uid}`).once("value");
    if (!snap.exists())
      return res.status(404).json({ error: "Forjador não encontrado." });
    res.json({ id: req.params.uid, ...snap.val() });
  } catch (e) {
    res.status(500).json({ error: "Erro interno." });
  }
});

// ========================
// ROTA: LOGIN ADMIN
// ========================
app.post("/api/admin/login", async (req, res) => {
  const { user, pass } = req.body;
  if (!user || !pass)
    return res.status(400).json({ error: "Preencha usuário e senha." });

  try {
    const snap      = await db.ref("config/admin").once("value");
    const adminUser = snap.exists() ? (snap.val().user || "admin")    : "admin";
    const adminPass = snap.exists() ? (snap.val().pass || "admin123") : "admin123";

    if (user !== adminUser || pass !== adminPass)
      return res.status(401).json({ error: "Credenciais inválidas." });

    await db.ref("logs").push({
      type:      "login",
      message:   `Admin "${user}" fez login.`,
      timestamp: new Date().toLocaleString("pt-BR"),
      iso:       new Date().toISOString()
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Erro interno." });
  }
});

// ========================
// ROTA: ROTACIONAR TOKEN
// ========================
app.post("/api/rotate-token", async (req, res) => {
  try {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < 8; i++)
      token += chars.charAt(Math.floor(Math.random() * chars.length));

    await db.ref("config/registerToken").set({
      token, used: false, createdAt: new Date().toISOString()
    });

    const TOKEN_WEBHOOK = "https://discord.com/api/webhooks/1510332405754499142/IegWcsQp-JSkI1aBJH08B3fN-yifPXdRwmXt1n_cXUwn9L0cCTr905UffrhBxjr9HRum";
    const now     = new Date().toLocaleString("pt-BR");
    const payload = {
      username:   "⚔️ Forja de Armas",
      avatar_url: "https://i.imgur.com/AfFp7pu.png",
      embeds: [{
        title:       "🔄 Chave de Cadastro Atualizada",
        description: `A chave anterior foi utilizada e uma nova foi gerada automaticamente.\n\n**🗝️ Chave atual:**\n\`\`\`\n${token}\n\`\`\`\n> Use esta chave para cadastrar um novo forjador.\n> A chave é de **uso único**.`,
        color:       0xf59e0b,
        footer:      { text: `Gerada em: ${now}` },
        timestamp:   new Date().toISOString()
      }]
    };

    const msgSnap = await db.ref("config/tokenMessageId").once("value");
    const msgId   = msgSnap.exists() ? msgSnap.val() : null;

    if (msgId) {
      const editRes = await fetch(`${TOKEN_WEBHOOK}/messages/${msgId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      if (editRes.ok) { res.json({ success: true, token }); return; }
    }

    const postRes = await fetch(`${TOKEN_WEBHOOK}?wait=true`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    if (postRes.ok) {
      const data = await postRes.json();
      await db.ref("config/tokenMessageId").set(data.id);
    }

    res.json({ success: true, token });
  } catch (e) {
    console.error("Erro rotate-token:", e);
    res.status(500).json({ error: "Erro ao rotacionar token." });
  }
});

// ========================
// ROTA PADRÃO — FRONTEND
// ========================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// ========================
// INICIA SERVIDOR
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Servidor rodando na porta ${PORT}`));
