(function () {
  "use strict";

  const header = document.querySelector("[data-site-header]");
  if (!header || header.dataset.initialized === "true") return;
  header.dataset.initialized = "true";

  const toggle = header.querySelector("[data-menu-toggle]");
  const toggleLabel = toggle?.querySelector(".visually-hidden");
  const navigation = header.querySelector("#site-navigation");
  const page = location.pathname.split("/").pop() || "index.html";

  const PUBLIC_NAV_ITEMS = Object.freeze([
    { href: "venues.html", label: "업체 찾기" },
    { href: "calculator.html", label: "비용 계산기" },
    { href: "checklist.html", label: "준비 체크리스트" },
    { href: "articles.html", label: "준비백과" },
    { href: "provider-register.html", label: "업체 등록" }
  ]);
  const MOBILE_NAV_ITEMS = Object.freeze([
    { href: "index.html", label: "홈", icon: "⌂" },
    { href: "venues.html", label: "업체 찾기", icon: "⌕" },
    { href: "calculator.html", label: "비용 계산기", icon: "₩" },
    { href: "checklist.html", label: "준비 체크리스트", icon: "✓" }
  ]);

  function isCurrentPage(href) {
    return page === href || (href === "login.html" && page === "account.html");
  }

  function createNavigationLink({ href, label }, className = "") {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    if (className) link.className = className;
    if (isCurrentPage(href)) link.setAttribute("aria-current", "page");
    return link;
  }

  function normalizeDesktopNavigation() {
    if (!navigation) return;
    const links = PUBLIC_NAV_ITEMS.map((item) => createNavigationLink(item));
    const authLink = createNavigationLink(
      { href: page === "account.html" ? "account.html" : "login.html", label: page === "account.html" ? "내 정보" : "로그인" },
      "site-nav__auth"
    );
    authLink.dataset.authLink = "";
    if (page === "account.html" || page === "login.html") authLink.setAttribute("aria-current", "page");
    navigation.replaceChildren(...links, authLink);
  }

  function appendMobileNavigation() {
    if (document.querySelector(".mobile-bottom-nav") || /^admin(?:\/|\.html)/.test(location.pathname)) return;
    const mobile = document.createElement("nav");
    mobile.className = "mobile-bottom-nav";
    mobile.setAttribute("aria-label", "모바일 주요 메뉴");
    [...MOBILE_NAV_ITEMS, { href: "login.html", label: "로그인", icon: "●", auth: true }].forEach(({ href, label, icon, auth }) => {
      const link = createNavigationLink({ href, label });
      if (auth) {
        link.dataset.mobileAuthLink = "";
        if (page === "account.html" || page === "login.html") link.setAttribute("aria-current", "page");
      }
      const symbol = document.createElement("span");
      symbol.setAttribute("aria-hidden", "true");
      symbol.textContent = icon;
      const name = document.createElement("strong");
      name.textContent = label;
      link.textContent = "";
      link.append(symbol, name);
      mobile.append(link);
    });
    document.body.append(mobile);
  }

  normalizeDesktopNavigation();
  const menuButtons = header.querySelectorAll("[data-nav-menu-button]");

  function updateNavigationState(isOpen) {
    header.dataset.menuOpen = String(isOpen);
    toggle?.setAttribute("aria-expanded", String(isOpen));
    if (toggleLabel) {
      toggleLabel.textContent = isOpen ? "메뉴 닫기" : "메뉴 열기";
    } else {
      toggle?.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
    }
  }

  function closeNavigation() {
    updateNavigationState(false);
    menuButtons.forEach(button => {
      button.setAttribute("aria-expanded", "false");
      button.closest(".nav-menu")?.setAttribute("data-open", "false");
    });
  }

  updateNavigationState(false);

  toggle?.addEventListener("click", () => {
    const isOpen = header.dataset.menuOpen === "true";
    updateNavigationState(!isOpen);
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
    header.querySelectorAll("[data-auth-link]").forEach((link) => {
      link.textContent = account ? "내 정보" : "로그인";
      link.href = account ? "account.html" : "login.html";
    });
    document.querySelectorAll("[data-mobile-auth-link]").forEach((link) => {
      link.href = account ? "account.html" : "login.html";
      link.querySelector("strong").textContent = account ? "내 정보" : "로그인";
    });
  });

  appendMobileNavigation();
})();
