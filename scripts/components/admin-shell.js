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
    ["inquiries", "inquiries.html", "운영 예외"],
    ["providers", "providers.html", "업체 관리"],
    ["content", "content.html", "콘텐츠 관리"],
    ["banners", "banners.html", "배너 관리"],
    ["members", "members.html", "회원 관리"],
    ["analytics", "analytics.html", "통계"],
    ["settings", "settings.html", "설정"]
  ];
  const roleViews = {
    owner: items.map(item => item[0]),
    admin: items.map(item => item[0]),
    operations: ["dashboard", "inquiries", "providers", "members"],
    content: ["dashboard", "content", "banners"],
    provider: []
  };

  function makeLink([id, href, label]) {
    const link = document.createElement("a");
    link.href = href;
    link.dataset.adminNavId = id;
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
    const logout = document.createElement("button");
    logout.type = "button";
    logout.className = "admin-text-button";
    logout.textContent = "로그아웃";
    logout.hidden = true;
    logout.addEventListener("click", async () => { await window.TaranAuth?.logout(); location.href = "../login.html"; });
    logout.dataset.adminLogout = "true";
    actions.append(site, logout);
    header.replaceChildren(brandLink, actions);
  }

  const sidebar = document.querySelector("[data-admin-sidebar]");
  if (sidebar) {
    sidebar.setAttribute("aria-label", "관리자 메뉴");
    sidebar.replaceChildren(...items.map(makeLink));
  }

  function accessMessage(title, description, href, label) {
    const main = document.querySelector(".admin-main");
    if (!main) return;
    const section = document.createElement("section");
    section.className = "admin-access-state";
    const heading = document.createElement("h1");
    heading.textContent = title;
    const body = document.createElement("p");
    body.textContent = description;
    section.append(heading, body);
    if (href && label) {
      const link = document.createElement("a");
      link.className = "button button--primary";
      link.href = href;
      link.textContent = label;
      section.append(link);
    }
    main.replaceChildren(section);
  }

  window.TaranAdminReady = (async function verifyAccess() {
    const isLocalPreview = location.protocol === "file:";
    if (!window.TaranConfig?.isSupabaseConfigured) {
      if (isLocalPreview) return { allowed: true, mode: "preview", role: "preview" };
      accessMessage("관리자 저장소 연결이 필요합니다.", "관리자 화면은 온라인 인증과 권한 설정이 완료된 뒤 사용할 수 있습니다.");
      return { allowed: false, mode: "unconfigured" };
    }
    const account = await window.TaranAuth?.ready;
    if (!account) {
      const returnPath = `admin/${location.pathname.split("/").pop() || "index.html"}`;
      accessMessage("관리자 로그인이 필요합니다.", "관리자 계정으로 로그인한 뒤 다시 접속해 주세요.", `../login.html?return=${encodeURIComponent(returnPath)}`, "로그인");
      return { allowed: false, mode: "signed-out" };
    }
    try {
      const rows = await window.TaranApi.select(window.TaranConfig.tables.adminProfiles, { user_id: `eq.${account.id}`, select: "user_id,email,role" });
      const profile = rows?.[0];
      if (!profile) {
        accessMessage("접근 권한이 없습니다.", "등록된 관리자 계정만 운영센터를 사용할 수 있습니다.");
        return { allowed: false, mode: "forbidden" };
      }
      const allowedViews = roleViews[profile.role] || [];
      sidebar?.querySelectorAll("[data-admin-nav-id]").forEach(link => { link.hidden = !allowedViews.includes(link.dataset.adminNavId); });
      const logout = document.querySelector("[data-admin-logout]");
      if (logout) logout.hidden = false;
      if (!allowedViews.includes(view)) {
        if (profile.role === "provider") {
          accessMessage(
            "업체 전용 관리 화면을 이용해 주세요.",
            "승인된 업체 담당자는 자신의 업체 정보만 확인하고 수정할 수 있습니다.",
            "../partner.html",
            "내 업체 관리"
          );
          return { allowed: false, mode: "provider", role: profile.role, account, profile };
        }
        accessMessage("이 메뉴를 사용할 권한이 없습니다.", "담당 업무에 필요한 관리자 메뉴만 사용할 수 있습니다.");
        return { allowed: false, mode: "forbidden", role: profile.role, account, profile };
      }
      return { allowed: true, mode: "online", role: profile.role, account, profile };
    } catch (_error) {
      accessMessage("권한을 확인하지 못했습니다.", "잠시 후 다시 시도해 주세요.");
      return { allowed: false, mode: "error" };
    }
  })();
})();
