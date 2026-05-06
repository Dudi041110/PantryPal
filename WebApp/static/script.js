// DON'T delete this comment
/* ==========================================
   PantryPal — app.js
   Vanilla JS · fetch() · Web Speech API
   ========================================== */

// ── PAGE META ─────────────────────────────
const PAGE_META = {
    points:   { title: "Points & Rewards",      sub: "Track your cooking achievements" },
    expiry:   { title: "Expiry Tracker",         sub: "Never waste food again" },
    shopping: { title: "Shopping List",          sub: "Keep your kitchen stocked" },
    recipes:  { title: "Recipe Book",            sub: "Cook smarter with Cheffy AI" },
    voice:    { title: "Voice Assistant",        sub: 'Say "Add milk to shopping list"' },
  };
  
  // ── TAB SWITCHING ──────────────────────────
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${tab}`).classList.add("active");
      document.getElementById("pageTitle").textContent = PAGE_META[tab].title;
      document.getElementById("pageSub").textContent   = PAGE_META[tab].sub;
      if (tab === "points")   loadPoints();
      if (tab === "expiry")   loadExpiry();
      if (tab === "shopping") loadShopping();
      if (tab === "recipes")  loadRecipes();
    });
  });
  
  // ── TOAST ─────────────────────────────────
  function showToast(msg, type = "success") {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = `toast show ${type}`;
    setTimeout(() => t.classList.remove("show"), 3000);
  }
  
  // ── UTILITY ───────────────────────────────
  function fmt(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
  }
  
  // ══════════════════════════════════════════
  //  POINTS
  // ══════════════════════════════════════════
  async function loadPoints() {
    const res  = await fetch("/api/points");
    const data = await res.json();
    document.getElementById("pointsBalance").textContent = data.balance.toLocaleString();
    document.getElementById("topbarPoints").textContent  = `⭐ ${data.balance.toLocaleString()} pts`;
  
    const el = document.getElementById("pointsHistory");
    if (!data.history.length) {
      el.innerHTML = `<div class="empty-state">No transactions yet</div>`; return;
    }
    el.innerHTML = data.history.map(h => `
      <div class="history-row">
        <div>
          <div class="reason">${h.reason}</div>
          <div class="meta">${fmt(h.created)}</div>
        </div>
        <div class="amount ${h.amount >= 0 ? 'positive' : 'negative'}">
          ${h.amount >= 0 ? '+' : ''}${h.amount} pts
        </div>
      </div>
    `).join("");
  }
  
  async function addPoints(sign) {
    const amountEl = sign > 0 ? document.getElementById("earnAmount")  : document.getElementById("spendAmount");
    const reasonEl = sign > 0 ? document.getElementById("earnReason")  : document.getElementById("spendReason");
    const amount = parseInt(amountEl.value);
    const reason = reasonEl.value.trim() || (sign > 0 ? "Points earned" : "Points spent");
    if (!amount || amount <= 0) { showToast("Enter a valid amount", "error"); return; }
    await fetch("/api/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amount * sign, reason })
    });
    amountEl.value = ""; reasonEl.value = "";
    showToast(sign > 0 ? `+${amount} points earned!` : `-${amount} points spent`);
    loadPoints();
  }
  
  // ══════════════════════════════════════════
  //  EXPIRY
  // ══════════════════════════════════════════
  async function loadExpiry() {
    const res   = await fetch("/api/expiry");
    const items = await res.json();
    const el    = document.getElementById("expiryList");
    if (!items.length) {
      el.innerHTML = `<div class="empty-state">No items added yet</div>`; return;
    }
    el.innerHTML = items.map(item => `
      <div class="expiry-row ${item.status}">
        <span style="font-size:1.3rem">${statusEmoji(item.status)}</span>
        <div style="flex:1">
          <div class="expiry-name">${item.name}</div>
          <div class="expiry-date-txt">
            Expires: ${item.expiry_date} &nbsp;·&nbsp;
            ${item.days_left < 0
              ? `Expired ${Math.abs(item.days_left)}d ago`
              : item.days_left === 0
                ? "Expires today!"
                : `${item.days_left} days left`}
          </div>
        </div>
        <span class="expiry-badge badge-${item.status}">${item.status.toUpperCase()}</span>
        <button class="del-btn" onclick="deleteExpiry(${item.id})">🗑️</button>
      </div>
    `).join("");
  }
  
  function statusEmoji(s) {
    return { ok:"🟢", warning:"🟡", critical:"🔴", expired:"⚫" }[s] || "⚪";
  }
  
  async function addExpiryItem() {
    const name   = document.getElementById("expiryName").value.trim();
    const expiry = document.getElementById("expiryDate").value;
    if (!name || !expiry) { showToast("Fill in both fields", "error"); return; }
    await fetch("/api/expiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, expiry_date: expiry })
    });
    document.getElementById("expiryName").value = "";
    document.getElementById("expiryDate").value = "";
    showToast(`${name} added to fridge tracker`);
    loadExpiry();
  }
  
  async function deleteExpiry(id) {
    await fetch(`/api/expiry/${id}`, { method: "DELETE" });
    showToast("Item removed");
    loadExpiry();
  }
  
  // ══════════════════════════════════════════
  //  SHOPPING
  // ══════════════════════════════════════════
  async function loadShopping() {
    const res   = await fetch("/api/shopping");
    const items = await res.json();
    const pending  = items.filter(i => !i.completed);
    const done     = items.filter(i => i.completed);
  
    const pendingEl = document.getElementById("shoppingPending");
    const doneEl    = document.getElementById("shoppingDone");
  
    pendingEl.innerHTML = pending.length
      ? pending.map(shopRow).join("")
      : `<div class="empty-state">List is empty 🎉</div>`;
  
    doneEl.innerHTML = done.length
      ? done.map(shopRow).join("")
      : `<div class="empty-state">Nothing completed yet</div>`;
  }
  
  function shopRow(item) {
    return `
      <div class="shop-row ${item.completed ? 'done' : ''}">
        <button class="icon-btn" onclick="toggleShop(${item.id})" title="${item.completed ? 'Unmark' : 'Mark done'}">
          ${item.completed ? '↩️' : '✅'}
        </button>
        <span class="shop-name">${item.name}</span>
        <button class="del-btn" onclick="deleteShop(${item.id})">🗑️</button>
      </div>
    `;
  }
  
  async function addShoppingItem() {
    const name = document.getElementById("shoppingName").value.trim();
    if (!name) { showToast("Enter an item name", "error"); return; }
    await fetch("/api/shopping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    document.getElementById("shoppingName").value = "";
    showToast(`${name} added to list`);
    loadShopping();
  }
  
  async function toggleShop(id) {
    await fetch(`/api/shopping/${id}`, { method: "PATCH" });
    loadShopping();
  }
  
  async function deleteShop(id) {
    await fetch(`/api/shopping/${id}`, { method: "DELETE" });
    showToast("Item removed");
    loadShopping();
  }
  
  // ══════════════════════════════════════════
  //  RECIPES
  // ══════════════════════════════════════════
  async function loadRecipes() {
    const res     = await fetch("/api/recipes");
    const recipes = await res.json();
    const el      = document.getElementById("recipesGrid");
    if (!recipes.length) {
      el.innerHTML = `<div class="empty-state">No recipes yet</div>`; return;
    }
    el.innerHTML = recipes.map(r => {
      const tags = r.ingredients.split(",").slice(0, 4).map(i =>
        `<span class="recipe-tag">${i.trim()}</span>`
      ).join("");
      return `
        <div class="recipe-card">
          <button class="recipe-del" onclick="deleteRecipe(${r.id})" title="Delete">🗑️</button>
          <div class="recipe-card-title">🍽️ ${r.title}</div>
          <div class="recipe-tags">${tags}</div>
          <div class="recipe-instructions">${r.instructions}</div>
        </div>
      `;
    }).join("");
  }
  
  async function addRecipe() {
    const title        = document.getElementById("recipeTitle").value.trim();
    const ingredients  = document.getElementById("recipeIngredients").value.trim();
    const instructions = document.getElementById("recipeInstructions").value.trim();
    if (!title || !ingredients || !instructions) {
      showToast("Fill in all recipe fields", "error"); return;
    }
    await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, ingredients, instructions })
    });
    document.getElementById("recipeTitle").value        = "";
    document.getElementById("recipeIngredients").value  = "";
    document.getElementById("recipeInstructions").value = "";
    showToast(`Recipe "${title}" saved!`);
    loadRecipes();
  }
  
  async function deleteRecipe(id) {
    await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    showToast("Recipe deleted");
    loadRecipes();
  }
  
  // ══════════════════════════════════════════
  //  VOICE ASSISTANT
  // ══════════════════════════════════════════
  let recognition = null;
  let isListening = false;
  
  function initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      document.getElementById("voiceStatus").textContent = "⚠️ Speech API not supported in this browser";
      return null;
    }
    const r = new SpeechRecognition();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = false;
  
    r.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(res => res[0].transcript).join("");
      document.getElementById("voiceTranscript").textContent = `"${transcript}"`;
      if (e.results[e.results.length - 1].isFinal) {
        processVoiceCommand(transcript.toLowerCase().trim());
      }
    };
  
    r.onend  = () => stopListening();
    r.onerror = () => {
      stopListening();
      document.getElementById("voiceStatus").textContent = "Error — try again";
    };
    return r;
  }
  
  function toggleVoice() {
    if (isListening) { stopListening(); return; }
    if (!recognition) recognition = initSpeech();
    if (!recognition) return;
    isListening = true;
    document.getElementById("voiceOrb").classList.add("listening");
    document.getElementById("voiceStatus").textContent = "🎙️ Listening...";
    document.getElementById("voiceTranscript").textContent = "";
    recognition.start();
  }
  
  function stopListening() {
    isListening = false;
    document.getElementById("voiceOrb").classList.remove("listening");
    document.getElementById("voiceStatus").textContent = "Tap the orb to start listening";
    if (recognition) { try { recognition.stop(); } catch(e) {} }
  }
  
  // Simulate a command (for demo buttons)
  function simulateCmd(text) {
    document.getElementById("voiceTranscript").textContent = `"${text}"`;
    processVoiceCommand(text.toLowerCase());
  }
  
  // ── COMMAND PROCESSOR ─────────────────────
  async function processVoiceCommand(cmd) {
    let response = "";
  
    // ADD TO SHOPPING LIST
    const shopMatch = cmd.match(/add (.+?) to (?:the )?shopping list/);
    if (shopMatch) {
      const item = capitalize(shopMatch[1]);
      await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: item })
      });
      response = `✅ "${item}" added to your shopping list`;
      showToast(response);
      return logVoice(cmd, response);
    }
  
    // SHOW POINTS
    if (cmd.includes("points") && (cmd.includes("show") || cmd.includes("my") || cmd.includes("how many"))) {
      const res  = await fetch("/api/points");
      const data = await res.json();
      response = `⭐ You have ${data.balance.toLocaleString()} points`;
      document.getElementById("topbarPoints").textContent = `⭐ ${data.balance.toLocaleString()} pts`;
      switchToTab("points");
      return logVoice(cmd, response);
    }
  
    // EARNED X POINTS
    const earnMatch = cmd.match(/(?:i )?earned? (\d+) points?(?: for (.+))?/);
    if (earnMatch) {
      const amount = parseInt(earnMatch[1]);
      const reason = earnMatch[2] ? capitalize(earnMatch[2]) : "Voice command";
      await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason })
      });
      response = `⭐ +${amount} points added for "${reason}"`;
      showToast(response);
      return logVoice(cmd, response);
    }
  
    // SHOW RECIPES
    if (cmd.includes("recipe") || cmd.includes("recipes")) {
      switchToTab("recipes");
      response = "🍽️ Opening your recipe book";
      return logVoice(cmd, response);
    }
  
    // SHOW SHOPPING LIST
    if (cmd.includes("shopping")) {
      switchToTab("shopping");
      response = "🛒 Opening your shopping list";
      return logVoice(cmd, response);
    }
  
    // SHOW EXPIRY
    if (cmd.includes("expir") || cmd.includes("fridge")) {
      switchToTab("expiry");
      response = "⏰ Opening expiry tracker";
      return logVoice(cmd, response);
    }
  
    // FALLBACK
    response = `🤔 I didn't understand "${cmd}". Try "Add milk to shopping list"`;
    logVoice(cmd, response);
  }
  
  function logVoice(cmd, response) {
    showToast(response.replace(/^[^ ]+ /, ""));
    const log = document.getElementById("voiceLog");
    const old = log.querySelector(".empty-state");
    if (old) old.remove();
    const row = document.createElement("div");
    row.className = "voice-log-row";
    row.innerHTML = `
      <div class="voice-log-cmd">🎙️ "${cmd}"</div>
      <div class="voice-log-resp">${response}</div>
    `;
    log.prepend(row);
  }
  
  function switchToTab(name) {
    document.querySelector(`[data-tab="${name}"]`).click();
  }
  
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  // ── ENTER KEY SHORTCUTS ───────────────────
  document.getElementById("shoppingName").addEventListener("keydown", e => {
    if (e.key === "Enter") addShoppingItem();
  });
  document.getElementById("expiryName").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("expiryDate").focus();
  });
  
  // ── INIT ──────────────────────────────────
  loadPoints();