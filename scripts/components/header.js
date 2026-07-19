(function () {
  "use strict";

  const header = document.querySelector("[data-site-header]");
  if (!header || header.dataset.initialized === "true") return;
  header.dataset.initialized = "true";

  const toggle = header.querySelector("[data-menu-toggle]");
  const navigation = header.querySelector("#site-navigation");
  const menuButtons = header.querySelectorAll("[data-nav-menu-button]");
  const page = location.pathname.split("/").pop() || "index.html";

  function compareIds() {
    return window.TaranCompareStore?.read?.() || [];
  }

  function updateCompareCounts(ids = compareIds()) {
    document.querySelectorAll("[data-compare-count]").forEach((badge) => {
      badge.textContent = String(ids.length);
      badge.hidden = !ids.length;
    });
  }

  function appendMobileNavigation() {
    if (document.querySelector(".mobile-bottom-nav") || /^admin(?:\/|\.html)/.test(location.pathname)) return;
    const mobile = document.createElement("nav");
    mobile.className = "mobile-bottom-nav";
    mobile.setAttribute("aria-label", "모바일 주요 메뉴");
    [
      ["index.html", "홈", "⌂"],
      ["venues.html", "업체 찾기", "⌕"],
      ["compare.html", "비교함", "⇄"],
      ["checklist.html", "체크리스트", "✓"],
      ["account.html", "마이페이지", "●"]
    ].forEach(([href, label, icon]) => {
      const link = document.createElement("a");
      link.href = href;
      if (page === href || (href === "account.html" && page === "login.html")) link.setAttribute("aria-current", "page");
      const symbol = document.createElement("span");
      symbol.setAttribute("aria-hidden", "true");
      symbol.textContent = icon;
      const name = document.createElement("strong");
      name.textContent = label;
      link.append(symbol, name);
      if (href === "compare.html") {
        const count = document.createElement("b");
        count.className = "mobile-bottom-nav__count";
        count.dataset.compareCount = "";
        count.hidden = true;
        link.append(count);
      }
      mobile.append(link);
    });
    document.body.append(mobile);
  }

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

  appendMobileNavigation();
  updateCompareCounts();
  window.TaranCompareStore?.subscribe?.(updateCompareCounts);
})();
