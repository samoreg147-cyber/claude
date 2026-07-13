/* Голосование 2026 — лендинг опроса (инициатор: партия «Новые люди»).
 *
 * Логика голосования вынесена на внешнюю платформу организатора.
 * Кнопки «Войти и голосовать» / «Зарегистрироваться» ведут на ссылку ниже. */

const CONFIG = {
  // 👉 ВСТАВЬТЕ СЮДА ССЫЛКУ НА РЕГИСТРАЦИЮ/ГОЛОСОВАНИЕ.
  // Пока пусто — кнопки покажут уведомление вместо перехода.
  registrationUrl: "",
  openInNewTab: true,
};

function wireRegistration() {
  const links = document.querySelectorAll(".js-register");
  links.forEach((el) => {
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

function initReveal() {
  const els = document.querySelectorAll(".section, .hero");
  els.forEach((e) => e.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }),
    { threshold: 0.1 }
  );
  els.forEach((e) => io.observe(e));
}

function init() {
  wireRegistration();
  initReveal();
}

document.addEventListener("DOMContentLoaded", init);
