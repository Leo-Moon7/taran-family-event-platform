(function () {
  "use strict";

  if (!document.querySelector('meta[name="robots"]')) {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex,nofollow";
    document.head.append(robots);
  }

  const view = document.body.dataset.adminView || "dashboard";
  const brand = window.PlatformBrand || { nameKo: "따란", nameEn: "T'ARAN" };
  const items = [
    ["dashboard", "index.html", "오늘 할 일"],
    ["inquiries", "inquiries.html", "견적 관리"],
    ["providers", "providers.html", "업체 관리"],
    ["content", "content.html", "콘텐츠 관리"],
    ["banners", "banners.html", "배너 관리"],
    ["members", "members.html", "회원 관리"],
    ["analytics", "analytics.html", "통계"],
    ["settings", "settings.html", "설정"]
  ];

  function makeLink([id, href, label]) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    if (id === view) {
      link.className = "is-current";
      link.setAttribute("aria-current", "page");
    }
    return link;
  }

  const header = document.querySelector("[data-admin-header]");
  if (header) {
    const brandLink = document.createElement("a");
    brandLink.className = "admin-brand";
    brandLink.href = "index.html";
    brandLink.setAttribute("aria-label", `${brand.nameKo} 운영센터 홈`);
    const mark = document.createElement("span");
    mark.textContent = brand.nameEn.slice(0, 1);
    const name = document.createElement("strong");
    name.textContent = `${brand.nameKo} 운영센터`;
    brandLink.append(mark, name);
    const actions = document.createElement("div");
    actions.className = "admin-topbar__actions";
    const site = document.createElement("a");
    site.href = "../index.html";
    site.textContent = "사이트 보기";
    actions.append(site);
    header.replaceChildren(brandLink, actions);
  }

  const sidebar = document.querySelector("[data-admin-sidebar]");
  if (sidebar) {
    sidebar.setAttribute("aria-label", "관리자 메뉴");
    sidebar.replaceChildren(...items.map(makeLink));
  }
})();
