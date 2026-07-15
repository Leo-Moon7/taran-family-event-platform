(function () {
  "use strict";

  const header = document.querySelector("[data-site-header]");
  if (!header || header.dataset.initialized === "true") return;
  header.dataset.initialized = "true";

  const toggle = header.querySelector("[data-menu-toggle]");
  const navigation = header.querySelector("#site-navigation");
  const menuButtons = header.querySelectorAll("[data-nav-menu-button]");

  function closeNavigation() {
    header.dataset.menuOpen = "false";
    toggle?.setAttribute("aria-expanded", "false");
    menuButtons.forEach(button => {
      button.setAttribute("aria-expanded", "false");
      button.closest(".nav-menu")?.setAttribute("data-open", "false");
    });
  }

  toggle?.addEventListener("click", () => {
    const isOpen = header.dataset.menuOpen === "true";
    header.dataset.menuOpen = String(!isOpen);
    toggle.setAttribute("aria-expanded", String(!isOpen));
    if (!isOpen) navigation?.querySelector("a, button")?.focus();
  });

  menuButtons.forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      const group = button.closest(".nav-menu");
      const isOpen = group?.dataset.open === "true";
      menuButtons.forEach(other => {
        other.setAttribute("aria-expanded", "false");
        other.closest(".nav-menu")?.setAttribute("data-open", "false");
      });
      group?.setAttribute("data-open", String(!isOpen));
      button.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  document.addEventListener("click", event => {
    if (!header.contains(event.target)) closeNavigation();
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    closeNavigation();
    toggle?.focus();
  });

  window.matchMedia("(min-width: 64.01rem)").addEventListener?.("change", event => {
    if (event.matches) closeNavigation();
  });

  Promise.resolve(window.TaranAuth?.ready).then(account => {
    header.querySelectorAll("[data-auth-link]").forEach(link => {
      link.textContent = account ? "내 정보" : "로그인";
      link.href = account ? "account.html" : "login.html";
    });
  });
})();
