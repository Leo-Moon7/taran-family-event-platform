(function () {
  "use strict";

  const form = document.querySelector("#home-search");
  const heroImage = document.querySelector("#home-hero-image");
  const initialContext = window.TaranSearchContext?.resolve?.() || { event: "kids", province: "서울특별시" };
  const heroImages = {
    kids: ["assets/images/venue-hotel.webp", "돌잔치와 백일 행사를 준비할 수 있는 가족행사 공간"],
    parents: ["assets/images/venue-hanjeongsik.webp", "환갑과 칠순, 팔순 가족모임을 위한 공간"],
    meeting: ["assets/images/venue-garden.webp", "상견례와 소규모 예식을 준비할 수 있는 결혼 행사 공간"],
    anniversary: ["assets/images/venue-partyroom.webp", "기념일과 생신을 위한 가족행사 공간"],
    other: ["assets/images/venue-hanjeongsik.webp", "가족모임과 추모 등 다양한 가족행사를 위한 공간"]
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
