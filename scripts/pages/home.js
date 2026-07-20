(function () {
  "use strict";

  const form = document.querySelector("#home-search");
  const recommended = document.querySelector("#home-recommended");
  const regions = document.querySelector("#home-regions");
  const collections = document.querySelector("#home-collections");
  const text = (value, fallback = "") => String(value ?? fallback).trim();
  const statusApi = window.TaranProviderStatus;
  const providerCta = document.querySelector(".provider-cta");

  if (providerCta && !window.TaranConfig?.isSupabaseConfigured) providerCta.hidden = true;

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const context = Object.fromEntries(new FormData(form));
    window.TaranSearchContext?.save(context);
    window.location.href = window.TaranSearchContext?.venuesUrl(context) || `venues.html?${new URLSearchParams(context)}`;
  });

  function imageUrl(value) {
    const url = text(value);
    return !url || /^(?:javascript|data):/i.test(url) ? "assets/images/venue-hanjeongsik.webp" : url;
  }

  function source() {
    const list = Array.isArray(window.reviewLifecycleVerifiedData) ? window.reviewLifecycleVerifiedData : [];
    return [...new Map(list.filter((item) => item?.id && statusApi.isProviderPublic(item)).map((item) => [item.id, item])).values()];
  }

  function createPartnerCard(item) {
    const link = document.createElement("a");
    link.className = "card card--interactive";
    link.href = `provider.html?id=${encodeURIComponent(item.id)}`;
    link.setAttribute("aria-label", `${text(item.name)} 상세 보기`);
    const media = document.createElement("div");
    media.className = "card__media";
    const image = document.createElement("img");
    image.src = imageUrl(item.image);
    image.alt = /assets\/images\/venue-/i.test(image.src) ? "" : `${text(item.name)} 대표 이미지`;
    image.loading = "lazy";
    media.append(image);
    const body = document.createElement("div");
    body.className = "card__body";
    const status = statusApi.getProviderStatus(item);
    const badge = document.createElement("span");
    badge.className = `badge ${status.key === "verified" ? "badge--success" : ""}`;
    badge.textContent = status.label;
    const title = document.createElement("h3");
    title.className = "card__title";
    title.textContent = text(item.name);
    const meta = document.createElement("p");
    meta.className = "card__meta";
    meta.textContent = [text(item.region), text(item.area)].filter(Boolean).join(" ");
    const facts = document.createElement("div");
    facts.className = "partner-facts";
    const normalized = statusApi.getProviderFacts(item);
    [text(item.subcategory), normalized.maxGuests ? `최대 ${normalized.maxGuests}명` : "", statusApi.shouldShowVolatileFacts(item) && normalized.adultMealMin ? `식대 ${normalized.adultMealMin.toLocaleString("ko-KR")}원부터` : ""].filter(Boolean).forEach((value) => {
      const span = document.createElement("span");
      span.textContent = value;
      facts.append(span);
    });
    const freshness = document.createElement("small");
    freshness.textContent = statusApi.getProviderFreshness(item).label;
    body.append(badge, title, meta, facts, freshness);
    link.append(media, body);
    return link;
  }

  function renderRegions(items) {
    if (!regions) return;
    const counts = items.reduce((map, item) => map.set(text(item.region), (map.get(text(item.region)) || 0) + 1), new Map());
    [...counts.entries()].filter(([name]) => name).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko-KR")).slice(0, 10).forEach(([name, count]) => {
      const link = document.createElement("a");
      link.href = `venues.html?province=${encodeURIComponent(name)}`;
      link.textContent = `${name.replace(/특별자치도|특별시|광역시|도$/u, "")} 가족행사 업체 ${count.toLocaleString("ko-KR")}곳`;
      regions.append(link);
    });
  }

  function renderCollections(items) {
    if (!collections) return;
    const definitions = [
      { label: "30명 이하 소규모 장소", href: "venues.html?guests=30", test: (item) => { const max = statusApi.getProviderFacts(item).maxGuests; return max > 0 && max <= 30; } },
      { label: "주차가 편한 장소", href: "venues.html?parking=yes", test: (item) => statusApi.getProviderFacts(item).parking > 0 || /주차/i.test((item.tags || []).join(" ")) },
      { label: "단독 공간이 있는 장소", href: "venues.html?private=yes", test: (item) => /단독|독립|프라이빗/i.test(`${item.subcategory || ""} ${(item.tags || []).join(" ")}`) },
      { label: "호텔 가족연회장", href: "venues.html?category=공간+대여&query=호텔", test: (item) => /호텔/i.test(`${item.name || ""} ${item.subcategory || ""}`) },
      { label: "한정식 가족행사 장소", href: "venues.html?category=공간+대여&query=한정식", test: (item) => /한정식/i.test(`${item.subcategory || ""} ${statusApi.getProviderIndustry(item)}`) }
    ];
    definitions.filter((definition) => items.some(definition.test)).forEach((definition) => {
      const link = document.createElement("a");
      link.href = definition.href;
      link.textContent = definition.label;
      collections.append(link);
    });
  }

  function init() {
    const items = source();
    renderRegions(items);
    renderCollections(items);
    if (!recommended) return;
    const latest = [...items].sort((a, b) => text(b.verifiedAt).localeCompare(text(a.verifiedAt))).slice(0, 6);
    if (latest.length) latest.forEach((item) => recommended.append(createPartnerCard(item)));
    else recommended.append(window.TaranStates.message({ title: "공개된 업체 정보가 없습니다.", description: "업체 정보 확인 후 이 영역에 표시됩니다." }));
  }

  Promise.resolve(window.taranContentReady).then(init).catch((error) => console.error("홈 정보를 불러오지 못했습니다.", error));
})();
