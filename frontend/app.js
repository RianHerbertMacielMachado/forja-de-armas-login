window._appLoaded = true;
// ========================
// DATA - RECEITAS
// ========================
const MATERIALS_RECIPE = {
  "Espadas e Machados Encantados": {
    "Pó Estelar": 3, "Elemento Primordial": 1, "Cristal": 3,
    "Pedra da Lua": 3, "Essência de Luz": 1, "Pedra Rúnica": 1, "Ferro Mágico": 1
  },
  "Espadas e Machados Básicos": {
    "Cristal": 3, "Ferro Mágico": 1, "Pedra Rúnica": 1, "Elemento Primordial": 1
  },
  "Lanças Encantadas": {
    "Pérola Abissal": 3, "Elemento Primordial": 1, "Cristal": 3,
    "Pedra da Lua": 3, "Madeira Mágica": 1, "Pó Estelar": 1, "Ferro Mágico": 1
  },
  "Lanças Básicas": {
    "Pérola Abissal": 3, "Elemento Primordial": 1, "Cristal": 3,
    "Pedra da Lua": 3, "Madeira Mágica": 1
  },
  "Adagas e Leques Encantados": {
    "Pó Estelar": 3, "Elemento Primordial": 1, "Cristal": 3,
    "Pedra da Lua": 3, "Essência de Luz": 1, "Pedra Rúnica": 1, "Ferro Mágico": 1
  },
  "Adagas e Leques Básicos": {
    "Elemento Primordial": 1, "Cristal": 3, "Pedra Rúnica": 1, "Ferro Mágico": 1
  },
  "Foices Encantadas": {
    "Pó Estelar": 3, "Elemento Primordial": 1, "Cristal": 3,
    "Pedra da Lua": 3, "Essência de Luz": 1, "Pedra Rúnica": 1, "Ferro Mágico": 1
  },
  "Foices Básicas": {
    "Elemento Primordial": 1, "Cristal": 3, "Pedra Rúnica": 1, "Ferro Mágico": 1
  },
  "Tridentes Encantados": {
    "Pérola Abissal": 3, "Elemento Primordial": 1, "Cristal": 3,
    "Pedra da Lua": 3, "Madeira Mágica": 1, "Pó Estelar": 1, "Ferro Mágico": 1
  },
  "Tridentes Básicos": {
    "Pérola Abissal": 3, "Elemento Primordial": 1, "Cristal": 3,
    "Pedra da Lua": 3, "Madeira Mágica": 1
  },
  "Arcos Encantados": {
    "Pena de Anjo": 3, "Elemento Primordial": 3, "Cristal": 3,
    "Madeira Mágica": 3, "Essência de Luz": 1, "Meteorito": 1,
    "Ferro Mágico": 1
  },
  "Arcos Básicos": {
    "Pena de Anjo": 3, "Elemento Primordial": 2, "Cristal": 3,
    "Madeira Mágica": 3
  },
  "Flechas": {
    "Pena de Anjo": 10, "Pedra Rúnica": 10, "Linha Mágica": 10
  }
};

const WEAPON_DATA = [
  { name: "Skulldragonbow",  category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  { name: "Tryandebow",      category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  { name: "Leviatabow",      category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  { name: "Wingbow",         category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  { name: "Vulkanbow",       category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  // { name: "Herritt",         category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  { name: "Bloodbow",        category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  { name: "Colorbow",        category: "Arcos Encantados",              icon: "🏹", price: 37000 },
  { name: "Glowybow",        category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Crystalbow",      category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Fantasybow",      category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Elegybow",        category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Eternalbow",      category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Harpbow",         category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Rambow",          category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Dragonbow",       category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Evilskullbow",    category: "Arcos Básicos",                 icon: "🏹", price: 25000 },
  { name: "Holystaff",       category: "Lanças Encantadas",             icon: "🔱", price: 27000 },
  { name: "Gungnir",         category: "Lanças Encantadas",             icon: "🔱", price: 27000 },
  { name: "Chastiefolgear",  category: "Lanças Encantadas",             icon: "🔱", price: 27000 },
  { name: "Skyspear",        category: "Lanças Encantadas",             icon: "🔱", price: 27000 },
  { name: "Spear",           category: "Lanças Básicas",                icon: "🔱", price: 15000 },
  { name: "Bident",          category: "Lanças Básicas",                icon: "🔱", price: 15000 },
  { name: "Heavenlyspear",   category: "Lanças Básicas",                icon: "🔱", price: 15000 },
  { name: "Bloodspear",      category: "Lanças Básicas",                icon: "🔱", price: 15000 },
  { name: "Mortalfan",       category: "Adagas e Leques Básicos",       icon: "🗡️", price: 15000 },
  { name: "Fantasyknife",    category: "Adagas e Leques Encantados",    icon: "🗡️", price: 27000 },
  { name: "Killerdagger",    category: "Adagas e Leques Encantados",    icon: "🗡️", price: 27000 },
  { name: "Motherfan",       category: "Adagas e Leques Encantados",    icon: "🗡️", price: 27000 },
  { name: "Bluefan",         category: "Adagas e Leques Encantados",    icon: "🗡️", price: 27000 },
  { name: "Purplefan",       category: "Adagas e Leques Encantados",    icon: "🗡️", price: 27000 },
  { name: "Warglaive",       category: "Adagas e Leques Encantados",    icon: "🗡️", price: 27000 },
  { name: "Scifiscyther",    category: "Foices Básicas",                icon: "⚔️", price: 15000 },
  { name: "Crimsonmoon",     category: "Foices Básicas",                icon: "⚔️", price: 15000 },
  { name: "Bellscyther",     category: "Foices Encantadas",             icon: "⚔️", price: 27000 },
  { name: "Naturescyther",   category: "Foices Encantadas",             icon: "⚔️", price: 27000 },
  { name: "Deathscyther",    category: "Foices Encantadas",             icon: "⚔️", price: 27000 },
  { name: "Venthyrscyther",  category: "Foices Encantadas",             icon: "⚔️", price: 27000 },
  { name: "Tridentberilion", category: "Tridentes Encantados",          icon: "🔱", price: 27000 },
  { name: "Goldentrident",   category: "Tridentes Encantados",          icon: "🔱", price: 27000 },
  { name: "Levitrident",     category: "Tridentes Encantados",          icon: "🔱", price: 27000 },
  { name: "Verticeabissal",  category: "Tridentes Encantados",          icon: "🔱", price: 27000 },
  { name: "Greentrident",    category: "Tridentes Básicos",             icon: "🔱", price: 15000 },
  { name: "Ancient Blade",   category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "Scifi",           category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "Blood King",      category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "Astral Blade",    category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "Haran Blade",     category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "Sekira Axe",      category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "Naha",            category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "RWolf",           category: "Espadas e Machados Encantados", icon: "⚔️", price: 27000 },
  { name: "Guts",            category: "Espadas e Machados Básicos",    icon: "⚔️", price: 15000 },
  { name: "Guts2",           category: "Espadas e Machados Básicos",    icon: "⚔️", price: 15000 },
  { name: "Acheron",         category: "Espadas e Machados Básicos",    icon: "⚔️", price: 15000 },
  { name: "Gryphon",         category: "Espadas e Machados Básicos",    icon: "⚔️", price: 15000 },
];

const CATEGORIES = [...new Set(WEAPON_DATA.map(w => w.category))];

// ========================
// SHARED UTILS
// ========================
function openWeaponPreview(name, imgSrc, icon) {
  const existing = document.getElementById("weaponPreviewModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "weaponPreviewModal";
  modal.innerHTML = `
    <div class="wp-backdrop" id="wpBackdrop"></div>
    <div class="wp-box">
      <button class="wp-close" id="wpCloseBtn">✕</button>
      <div class="wp-img-wrap">
        <img
          id="wpMainImg"
          src="${imgSrc}"
          alt="${name}"
          class="wp-img"
          onerror="
            this.style.display='none';
            document.getElementById('wpImgFallback').style.display='flex';
          "
        />
        <div id="wpImgFallback" class="wp-img-fallback" style="display:none;">${icon}</div>
      </div>
      <div class="wp-name">${name}</div>
    </div>
  `;

  document.body.appendChild(modal);

  // Animação de entrada
  requestAnimationFrame(() => modal.classList.add("wp-visible"));

  // Fechar ao clicar no backdrop
  document.getElementById("wpBackdrop").addEventListener("click", closeWeaponPreview);

  // Fechar ao clicar no X
  document.getElementById("wpCloseBtn").addEventListener("click", closeWeaponPreview);

  // Fechar com Escape
  document._wpEscHandler = function(e) {
    if (e.key === "Escape") closeWeaponPreview();
  };
  document.addEventListener("keydown", document._wpEscHandler);
}

function closeWeaponPreview() {
  const modal = document.getElementById("weaponPreviewModal");
  if (!modal) return;
  modal.classList.remove("wp-visible");
  modal.classList.add("wp-hiding");
  setTimeout(() => {
    modal.remove();
    document.removeEventListener("keydown", document._wpEscHandler);
  }, 250);
}

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function sanitizeId(name) {
  return name.replace(/[^a-zA-Z0-9]/g, "_");
}

function showNotif(msg, color) {
  const el = document.getElementById("notif");
  el.textContent = msg;
  el.style.background = color || "#7b2fff";
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2800);
}

function calculateMaterials(entries, arrows) {
  const totals = {};
  const add = (recipe, mult) => {
    Object.entries(recipe).forEach(([mat, qty]) => {
      totals[mat] = (totals[mat] || 0) + qty * mult;
    });
  };
  entries.forEach(([name, qty]) => {
    const w = WEAPON_DATA.find(x => x.name === name);
    if (w && MATERIALS_RECIPE[w.category]) add(MATERIALS_RECIPE[w.category], qty);
  });
  if (arrows > 0) {
    const sets = Math.ceil(arrows / 100);
    add(MATERIALS_RECIPE["Flechas"], sets);
  }
  return totals;
}

function buildResumeText(entries, arrows, clientInfo) {
  let text = "=== PEDIDO DE ARMAS ===\n";
  if (clientInfo) {
    text += `👤 Cliente: ${clientInfo.name}\n`;
    text += `🪪 Passaporte: ${clientInfo.passport}\n`;
  }
  text += "\n📦 ITENS:\n";
  let total = 0;
  entries.forEach(([name, qty]) => {
    const w = WEAPON_DATA.find(x => x.name === name);
    if (!w) return;
    const sub = w.price * qty;
    total += sub;
    text += `  • ${name} ×${qty} — ${formatCurrency(sub)}\n`;
  });
  if (arrows > 0) {
    const sets  = Math.ceil(arrows / 100);
    const cost  = sets * 10000;
    total      += cost;
    text       += `  • Flechas ×${arrows} — ${formatCurrency(cost)}\n`;
  }
  const mats = calculateMaterials(entries, arrows);
  text += "\n⚗️ MATERIAIS NECESSÁRIOS:\n";
  Object.entries(mats).sort((a,b) => b[1]-a[1])
    .forEach(([mat, qty]) => { text += `  • ${mat}: ${qty}x\n`; });
  text += `\n💰 TOTAL: ${formatCurrency(total)}`;
  return text;
}

function renderSummary(prefix, selectedWeapons, arrowQty, showMaterials = true) {
  const listEl     = document.getElementById(`${prefix}SelectedList`);
  const matSection = document.getElementById(`${prefix}MaterialsSection`);
  const matGrid    = document.getElementById(`${prefix}MaterialGrid`);
  const entries    = Object.entries(selectedWeapons);
  const hasArrows  = arrowQty > 0;
  const hasItems   = entries.length > 0 || hasArrows;

  if (!hasItems) {
    listEl.innerHTML = `
      <div class="empty-state">
        Nenhum item selecionado.<br/>Clique nas armas para adicionar.
      </div>`;
    if (matSection) matSection.style.display = "none";
    document.getElementById(`${prefix}TotalValue`).textContent = "R$ 0,00";
    document.getElementById(`${prefix}ItemCount`).textContent  = "0 itens selecionados";
    return;
  }

  let total = 0, count = 0, html = "";

  entries.forEach(([name, qty]) => {
    const w = WEAPON_DATA.find(x => x.name === name);
    if (!w) return;
    const sub = w.price * qty;
    total += sub; count += qty;
    html += `
      <div class="selected-item-row">
        <span class="item-name">${w.icon} ${name} ×${qty}</span>
        <span style="display:flex;align-items:center;gap:6px;">
          <span class="item-price">${formatCurrency(sub)}</span>
          <button class="remove-btn" onclick="${prefix}RemoveItem('${name.replace(/'/g, "\\'")}')">✕</button>
        </span>
      </div>`;
  });

  if (hasArrows) {
    const sets = Math.ceil(arrowQty / 100);
    const cost = sets * 10000;
    total += cost; count += arrowQty;
    html += `
      <div class="selected-item-row">
        <span class="item-name">🏹 Flechas ×${arrowQty}</span>
        <span class="item-price">${formatCurrency(cost)}</span>
      </div>`;
  }

  listEl.innerHTML = html;

  // Materiais — só exibe se showMaterials for true
  if (matSection) {
    if (showMaterials) {
      const mats = calculateMaterials(entries, arrowQty);
      matSection.style.display = "block";
      if (matGrid) {
        matGrid.innerHTML = Object.entries(mats)
          .sort((a, b) => b[1] - a[1])
          .map(([mat, qty]) => `
            <div class="material-item">
              <span class="mat-name">${mat}</span>
              <span class="mat-qty">${qty}x</span>
            </div>`).join("");
      }
    } else {
      matSection.style.display = "none";
    }
  }

  document.getElementById(`${prefix}TotalValue`).textContent = formatCurrency(total);
  document.getElementById(`${prefix}ItemCount`).textContent  =
    `${entries.length + (hasArrows ? 1 : 0)} tipo(s) — ${count} unidade(s)`;
}


function buildWeaponGrid(prefix, selectedWeapons, activeCategory, searchVal) {
  const grid = document.getElementById(`${prefix}WeaponsGrid`);
  const list = WEAPON_DATA.filter(w => {
    const matchCat    = activeCategory === "Todos" || w.category === activeCategory;
    const matchSearch = w.name.toLowerCase().includes(searchVal.toLowerCase());
    return matchCat && matchSearch;
  });

  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#4a4a7a;padding:30px;">Nenhuma arma encontrada.</div>`;
    return;
  }

  grid.innerHTML = list.map(w => {
    const qty        = selectedWeapons[w.name] || 0;
    const isEnchanted = w.category.toLowerCase().includes("encantad");
    const imgName    = w.name.replace(/ /g, "%20");
    const imgId      = `${prefix}img-${sanitizeId(w.name)}`;

    return `
      <div class="weapon-card ${qty > 0 ? "selected" : ""}" id="${prefix}card-${sanitizeId(w.name)}">
        ${isEnchanted ? '<div class="enchanted-badge"></div>' : ""}
        <div class="weapon-img-wrap" onclick="openWeaponPreview('${w.name.replace(/'/g,"\\'")}', document.getElementById('${imgId}') ? document.getElementById('${imgId}').src : '', '${w.icon}')" title="Clique para ampliar">
          <img
            id="${imgId}"
            src="image/${imgName}.png"
            alt="${w.name}"
            class="weapon-img"
            onerror="
              this.style.display='none';
              document.getElementById('${imgId}-fallback').style.display='flex';
            "
          />
          <div
            id="${imgId}-fallback"
            class="weapon-img-fallback"
            style="display:none;"
          >${w.icon}</div>
        </div>
        <div class="name">${w.name}</div>
        <div class="category-tag">${w.category}</div>
        <div class="price-tag">${formatCurrency(w.price)}</div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="${prefix}ChangeQty('${w.name.replace(/'/g,"\\'")}', -1, event)">−</button>
          <span class="qty-display">${qty}</span>
          <button class="qty-btn" onclick="${prefix}ChangeQty('${w.name.replace(/'/g,"\\'")}', 1, event)">+</button>
        </div>
      </div>`;
  }).join("");
}


function buildCategoryTabs(prefix, activeCategory) {
  const container = document.getElementById(`${prefix}CategoryTabs`);
  const all = ["Todos", ...CATEGORIES];
  container.innerHTML = all.map(cat => `
    <button class="tab-btn ${cat === activeCategory ? "active" : ""}"
      onclick="${prefix}SetCategory('${cat.replace(/'/g,"\\'")}')">
      ${cat}
    </button>`).join("");
}
