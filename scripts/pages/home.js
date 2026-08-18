(function () {
  "use strict";

  const form = document.querySelector("#home-search");
  const heroImage = document.querySelector("#home-hero-image");
  const initialContext = window.TaranSearchContext?.resolve?.() || { event: "kids", province: "서울특별시" };
  const heroImages = {
    kids: ["assets/images/home-family-hero-v2.webp", "아기와 부모, 조부모가 함께 돌잔치를 준비하는 따뜻한 가족 모습"],
    parents: ["assets/images/home-family-parents.webp", "부모님의 생신을 함께 축하하는 가족 모습"],
    meeting: ["assets/images/home-family-meeting.webp", "결혼을 준비하며 차분하게 이야기를 나누는 두 가족 모습"],
    anniversary: ["assets/images/home-family-anniversary.webp", "꽃과 케이크를 두고 기념일을 축하하는 가족 모습"],
    other: ["assets/images/home-family-other.webp", "여러 세대가 함께 식사하며 이야기를 나누는 가족 모습"]
  };

  function formContext(overrides = {}) {
    const values = form ? Object.fromEntries(new FormData(form)) : initialContext;
    return {
      event: window.SonpumEventTypes?.normalize?.(values.event || "kids") || "kids",
      province: values.province || "서울특별시",
      guests: values.guests || "",
      ...overrides
    };
  }

  function pageUrl(path, context) {
    const params = window.TaranSearchContext?.toParams?.(context) || new URLSearchParams(
      Object.entries(context).filter(([, value]) => value && value !== "all")
    );
    return `${path}${params.size ? `?${params}` : ""}`;
  }

  function bindContext(link, path, context) {
    if (!link) return;
    link.href = path === "venues.html"
      ? (window.TaranSearchContext?.venuesUrl?.(context) || pageUrl(path, context))
      : pageUrl(path, context);
    link.dataset.searchContext = JSON.stringify(context);
  }

  function refreshContextLinks() {
    const current = formContext();
    const [image, alt] = heroImages[current.event] || heroImages.kids;
    if (heroImage) {
      heroImage.src = image;
      heroImage.alt = alt;
    }
    document.querySelectorAll("[data-event-shortcut]").forEach((link) => {
      const url = new URL(link.href, location.href);
      bindContext(link, "venues.html", formContext({ event: url.searchParams.get("event") || "kids" }));
    });
    document.querySelectorAll("[data-region-link]").forEach((link) => {
      bindContext(link, "venues.html", formContext({ province: link.dataset.regionLink || "all" }));
    });
    document.querySelectorAll("[data-guests-link]").forEach((link) => {
      bindContext(link, "venues.html", formContext({ guests: link.dataset.guestsLink || "" }));
    });
    document.querySelectorAll("[data-search-cta]").forEach((link) => bindContext(link, "venues.html", current));
    document.querySelectorAll("[data-calculator-cta]").forEach((link) => bindContext(link, "calculator.html", current));
    document.querySelectorAll("[data-checklist-cta]").forEach((link) => bindContext(link, "checklist.html", current));
  }

  if (form) {
    if (form.elements.event) form.elements.event.value = window.SonpumEventTypes?.normalize?.(initialContext.event || "kids") || "kids";
    if (form.elements.province) form.elements.province.value = initialContext.province || "서울특별시";
    if (form.elements.guests) form.elements.guests.value = initialContext.guests || "";
    form.addEventListener("change", refreshContextLinks);
  }

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const context = formContext();
    window.TaranSearchContext?.save(context);
    window.location.href = window.TaranSearchContext?.venuesUrl(context) || `venues.html?${new URLSearchParams(context)}`;
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-search-context]");
    if (!link) return;
    try { window.TaranSearchContext?.save?.(JSON.parse(link.dataset.searchContext)); }
    catch (_error) { /* 링크의 쿼리만으로도 같은 조건을 전달합니다. */ }
  });

  refreshContextLinks();
})();
