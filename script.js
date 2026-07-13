/* Голосование 2026 — клиентская логика опроса.
 *
 * По умолчанию голоса хранятся анонимно в localStorage браузера
 * (статический сайт без сервера). Чтобы вести общий подсчёт для всех
 * посетителей, задайте CONFIG.apiBase — заготовка запросов ниже. */

const CONFIG = {
  // Пример: "https://your-worker.example.workers.dev". null → локальный режим.
  apiBase: null,
  storageKey: "golos2026_tally",
  myVoteKey: "golos2026_my_vote",
  options: ["against", "for", "unsure"],
};

const state = { selected: null, tally: { against: 0, for: 0, unsure: 0 }, myVote: null };

/* ---------- Хранилище ---------- */
function loadLocal() {
  try {
    const t = JSON.parse(localStorage.getItem(CONFIG.storageKey) || "null");
    if (t && typeof t === "object") state.tally = { against: t.against | 0, for: t.for | 0, unsure: t.unsure | 0 };
  } catch (_) {}
  state.myVote = localStorage.getItem(CONFIG.myVoteKey) || null;
}
function saveLocal() {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(state.tally));
  if (state.myVote) localStorage.setItem(CONFIG.myVoteKey, state.myVote);
}

async function fetchTally() {
  if (!CONFIG.apiBase) { loadLocal(); return; }
  try {
    const r = await fetch(`${CONFIG.apiBase}/tally`, { cache: "no-store" });
    const t = await r.json();
    state.tally = { against: t.against | 0, for: t.for | 0, unsure: t.unsure | 0 };
    state.myVote = localStorage.getItem(CONFIG.myVoteKey) || null;
  } catch (_) { loadLocal(); }
}

async function sendVote(option) {
  if (!CONFIG.apiBase) {
    // локальный режим: заменяем предыдущий голос этого устройства
    if (state.myVote && state.tally[state.myVote] > 0) state.tally[state.myVote]--;
    state.tally[option]++;
    state.myVote = option;
    saveLocal();
    return;
  }
  try {
    const r = await fetch(`${CONFIG.apiBase}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ option, prev: state.myVote }),
    });
    const t = await r.json();
    state.tally = { against: t.against | 0, for: t.for | 0, unsure: t.unsure | 0 };
    state.myVote = option;
    localStorage.setItem(CONFIG.myVoteKey, option);
  } catch (_) {
    // офлайн-фолбэк
    if (state.myVote && state.tally[state.myVote] > 0) state.tally[state.myVote]--;
    state.tally[option]++;
    state.myVote = option;
    saveLocal();
  }
}

/* ---------- Рендер ---------- */
function total() { return CONFIG.options.reduce((s, o) => s + state.tally[o], 0); }

function renderResults() {
  const t = total();
  CONFIG.options.forEach((opt) => {
    const row = document.querySelector(`[data-result="${opt}"]`);
    if (!row) return;
    const votes = state.tally[opt];
    const pct = t ? Math.round((votes / t) * 100) : 0;
    row.querySelector(".bar-fill").style.width = pct + "%";
    row.querySelector(".result-pct").textContent = pct + "%";
    row.querySelector(".result-votes").textContent = plural(votes);
  });
  document.querySelectorAll("[data-count-total-line]").forEach((el) => (el.textContent = "Всего голосов: " + t.toLocaleString("ru-RU")));
  animateCount(document.querySelector("[data-count-total]"), t);
}

function plural(n) {
  const forms = ["голос", "голоса", "голосов"];
  const mod100 = n % 100, mod10 = n % 10;
  let f = forms[2];
  if (mod100 < 11 || mod100 > 14) { if (mod10 === 1) f = forms[0]; else if (mod10 >= 2 && mod10 <= 4) f = forms[1]; }
  return n.toLocaleString("ru-RU") + " " + f;
}

function animateCount(el, target) {
  if (!el) return;
  const start = parseInt((el.textContent || "0").replace(/\D/g, "")) || 0;
  if (start === target) { el.textContent = target.toLocaleString("ru-RU"); return; }
  const dur = 600, t0 = performance.now();
  function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    const val = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3)));
    el.textContent = val.toLocaleString("ru-RU");
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function reflectMyVote() {
  document.querySelectorAll(".option").forEach((btn) => {
    const isMine = btn.dataset.option === state.myVote;
    btn.classList.toggle("selected", isMine && !state.selected);
    btn.setAttribute("aria-checked", String(isMine && !state.selected));
  });
  const submit = document.getElementById("submitVote");
  const hint = document.getElementById("voteHint");
  if (state.myVote && !state.selected) {
    submit.textContent = "Изменить голос";
    submit.disabled = true;
    hint.textContent = "Ваш голос учтён. Выберите другой вариант, чтобы изменить его.";
  }
}

/* ---------- Взаимодействие ---------- */
function selectOption(btn) {
  state.selected = btn.dataset.option;
  document.querySelectorAll(".option").forEach((b) => {
    const on = b === btn;
    b.classList.toggle("selected", on);
    b.setAttribute("aria-checked", String(on));
  });
  const submit = document.getElementById("submitVote");
  submit.disabled = false;
  submit.textContent = state.myVote ? "Изменить голос" : "Отдать голос";
}

async function submit() {
  if (!state.selected) return;
  const btn = document.getElementById("submitVote");
  btn.disabled = true;
  await sendVote(state.selected);
  const label = { against: "Не поддерживаю", for: "Поддерживаю", unsure: "Затрудняюсь ответить" }[state.selected];
  state.selected = null;
  renderResults();
  reflectMyVote();
  showToast("✅ Голос учтён: " + label);
  document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "center" });
}

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("show"), 2600);
}

async function share() {
  const data = { title: "Голосование 2026 — мобилизация осенью", text: "Выскажите свою позицию в анонимном опросе:", url: location.href };
  try {
    if (navigator.share) { await navigator.share(data); return; }
    await navigator.clipboard.writeText(location.href);
    showToast("🔗 Ссылка скопирована");
  } catch (_) { showToast("🔗 " + location.href); }
}

/* ---------- Инициализация ---------- */
function initReveal() {
  const els = document.querySelectorAll(".section");
  els.forEach((e) => e.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }),
    { threshold: 0.12 }
  );
  els.forEach((e) => io.observe(e));
}

async function init() {
  document.querySelectorAll(".option").forEach((btn) => btn.addEventListener("click", () => selectOption(btn)));
  document.getElementById("submitVote").addEventListener("click", submit);
  document.getElementById("shareBtn").addEventListener("click", share);
  await fetchTally();
  renderResults();
  reflectMyVote();
  initReveal();
}

document.addEventListener("DOMContentLoaded", init);
