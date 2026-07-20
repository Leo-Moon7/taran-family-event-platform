const publicHeader = document.querySelector("header.site-header:not(.admin-header)");

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function loadScriptOnce(src, callback) {
  const existing = [...document.scripts].find(script => script.src.endsWith(src));
  if (existing) {
    if (callback) callback();
    return;
  }
  const script = document.createElement("script");
  script.src = src;
  script.addEventListener("load", () => callback?.(), { once: true });
  document.body.append(script);
}

function upgradeLegacyHeader(header) {
  if (!header || header.hasAttribute("data-site-header")) return;
  if (!document.querySelector('link[href="styles/components/header.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "styles/components/header.css";
    document.head.append(link);
  }
  const inner = createElement("div", "site-header__inner");
  const brand = createElement("a", "brand");
  brand.href = "index.html";
  brand.setAttribute("aria-label", "손품해방 홈");
  const brandName = createElement("span", "brand__name");
  brandName.append(createElement("span", "", "손품해방"), createElement("small", "", "SONPUM HAEBANG"));
  brand.append(brandName);
  const toggle = createElement("button", "site-header__toggle", "☰");
  toggle.type = "button";
  toggle.dataset.menuToggle = "";
  toggle.setAttribute("aria-controls", "site-navigation");
  toggle.setAttribute("aria-expanded", "false");
  const nav = createElement("nav", "site-nav");
  nav.id = "site-navigation";
  nav.setAttribute("aria-label", "주요 메뉴");
  [
    ["venues.html", "업체 찾기"],
    ["compare.html", "비교함"],
    ["calculator.html", "비용 계산기"],
    ["checklist.html", "준비 체크리스트"],
    ["articles.html", "준비 가이드"]
  ].forEach(([href, label]) => {
    const link = createElement("a", "", label);
    link.href = href;
    if (href === "compare.html") {
      const count = createElement("span", "nav-count");
      count.dataset.compareCount = "";
      count.hidden = true;
      link.append(" ", count);
    }
    nav.append(link);
  });
  const authLink = createElement("a", "site-nav__auth", "로그인");
  authLink.href = "login.html";
  authLink.dataset.authLink = "";
  nav.append(authLink);
  inner.append(brand, toggle, nav);
  header.replaceChildren(inner);
  header.dataset.siteHeader = "";
  loadScriptOnce("scripts/core/compare-store.js", () => loadScriptOnce("scripts/components/header.js"));
}

upgradeLegacyHeader(publicHeader);

if (publicHeader) {
  const brand = publicHeader.querySelector(".brand");
  if (brand) {
    brand.setAttribute("aria-label", "손품해방 홈");
    const englishName = brand.querySelector("small");
    if (englishName) englishName.textContent = "SONPUM HAEBANG";
  }

  const nav = publicHeader.querySelector("nav");
  if (nav) {
    window.TaranAuth?.ready.then(account => {
      const link = nav.querySelector("[data-auth-link]");
      if (!link) return;
      link.textContent = account ? `${account.display_name}님` : "로그인";
      link.href = account ? "account.html" : "login.html";
    });
  }
}

document.querySelectorAll("[data-reveal]").forEach(element => {
  element.classList.add("reveal-ready");
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll("[data-reveal]").forEach(element => revealObserver.observe(element));
} else {
  document.querySelectorAll("[data-reveal]").forEach(element => element.classList.add("is-visible"));
}

document.querySelectorAll("[data-newsletter-form]").forEach(form => {
  form.addEventListener("submit", event => {
    event.preventDefault();
    const message = form.querySelector("[data-newsletter-message]");
    if (message) message.textContent = "업체 정보 수정 요청 화면으로 이동합니다.";
  });
});
