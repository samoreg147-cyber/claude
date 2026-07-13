/* Голосование 2026 — лендинг опроса (инициатор: партия «Новые люди»).
 *
 * Логика голосования вынесена на внешнюю платформу организатора.
 * Кнопки «Голосовать» / «Войти и проголосовать» ведут на ссылку ниже. */

const CONFIG = {
  // 👉 ВСТАВЬТЕ СЮДА ССЫЛКУ НА РЕГИСТРАЦИЮ/ГОЛОСОВАНИЕ.
  // Пока пусто — кнопки покажут уведомление вместо перехода.
  registrationUrl: "",
  openInNewTab: true,
};

function wireRegistration() {
  document.querySelectorAll(".js-register").forEach((el) => {
    if (CONFIG.registrationUrl) {
      el.setAttribute("href", CONFIG.registrationUrl);
      if (CONFIG.openInNewTab) {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
    } else {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        showToast("🔗 Ссылка на регистрацию скоро будет добавлена организатором");
      });
    }
  });
}

function showToast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("show"), 2800);
}

/* Анимация полос результатов до значений из data-pct */
function animateResults(card) {
  card.querySelectorAll(".result").forEach((row) => {
    const pct = Math.max(0, Math.min(100, parseInt(row.dataset.pct || "0", 10)));
    const fill = row.querySelector(".bar-fill");
    const label = row.querySelector(".result-pct");
    requestAnimationFrame(() => { if (fill) fill.style.width = pct + "%"; });
    countUp(label, pct);
  });
}

function countUp(el, target) {
  if (!el) return;
  const dur = 1100, t0 = performance.now();
  function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    const val = Math.round(target * (1 - Math.pow(1 - p, 3)));
    el.textContent = val + "%";
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initReveal() {
  const els = document.querySelectorAll(".section, .hero");
  els.forEach((e) => e.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        const rc = en.target.querySelector(".results-card");
        if (rc && !rc.dataset.done) { rc.dataset.done = "1"; animateResults(rc); }
        io.unobserve(en.target);
      }
    }),
    { threshold: 0.1 }
  );
  els.forEach((e) => io.observe(e));
}

function init() {
  wireRegistration();
  initReveal();
}

document.addEventListener("DOMContentLoaded", init);
