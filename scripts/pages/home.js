(function () {
  "use strict";

  const form = document.querySelector("#home-search");
  const recommended = document.querySelector("#home-recommended");
  const recentVerified = document.querySelector("#home-recent-verified");
  const regions = document.querySelector("#home-regions");
  const collections = document.querySelector("#home-collections");
  const text = (value, fallback = "") => String(value ?? fallback).trim();
  const statusApi = window.TaranProviderStatus;
  const placeholderApi = window.SonpumProviderPlaceholder;

  const initialContext = window.TaranSearchContext?.resolve?.() || { event: "kids", province: "서울특별시" };
  if (form) {
    if (form.elements.event) form.elements.event.value = initialContext.event || "kids";
    if (form.elements.province) form.elements.province.value = initialContext.province || "서울특별시";
    if (form.elements.guests) form.elements.guests.value = initialContext.guests || "";
  }

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const context = Object.fromEntries(new FormData(form));
    window.TaranSearchContext?.save(context);
    window.location.href = window.TaranSearchContext?.venuesUrl(context) || `venues.html?${new URLSearchParams(context)}`;
  });

  function imageUrl(value, item) {
    const url = text(value);
    return !url || /^(?:javascript|data):/i.test(url) ? placeholderApi.get(item) : url;
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
    const requestedImage = item.imageVerified ? imageUrl(item.image, item) : "";
    placeholderApi.apply(image, item, requestedImage);
    image.loading = "lazy";
    media.append(image);
    if (!requestedImage) {
      const note = document.createElement("span");
      note.className = "card__image-note";
      note.textContent = "업체 사진 준비 중";
      media.append(note);
    }
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
    const freshnessState = statusApi.getProviderFreshness(item);
    freshness.textContent = freshnessState.date ? `정보 확인 ${freshnessState.date}` : "";
    body.append(badge, title, meta, facts);
    if (freshness.textContent) body.append(freshness);
    link.append(media, body);
    return link;
  }

  function renderRegions(items) {
    if (!regions) return;
    const counts = items.reduce((map, item) => map.set(text(item.region), (map.get(text(item.region)) || 0) + 1), new Map());
    const featured = ["서울특별시", "경기도", "인천광역시", "부산광역시", "대구광역시", "대전광역시", "광주광역시", "전북특별자치도", "경상남도", "제주특별자치도"];
    featured.forEach((name) => {
      const count = counts.get(name) || 0;
      const link = document.createElement("a");
      link.href = `venues.html?province=${encodeURIComponent(name)}`;
      link.textContent = count ? `${name.replace(/특별자치도|특별시|광역시|도$/u, "")} · ${count.toLocaleString("ko-KR")}곳` : `${name.replace(/특별자치도|특별시|광역시|도$/u, "")} · 등록 준비 중`;
      regions.append(link);
    });
    const all = document.createElement("a"); all.href = "venues.html?province=all"; all.textContent = "전체 지역 보기"; regions.append(all);
  }

  function renderEventCounts(items) {
    document.querySelectorAll(".event-shortcuts a").forEach((link) => {
      const event = new URL(link.href, location.href).searchParams.get("event");
      const count = items.filter((item) => (item.eventTags || item.eventTypes || []).some((value) => window.SonpumEventTypes?.normalize?.(value, item.tags || []) === event)).length;
      const small = document.createElement("small");
      small.textContent = count ? `등록 업체 ${count.toLocaleString("ko-KR")}곳` : "업체 등록 준비 중";
      link.append(small);
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
    renderEventCounts(items);
    renderCollections(items);
    if (recentVerified) {
      const recent = [...items].filter((item) => statusApi.getProviderFreshness(item).date).sort((a, b) => statusApi.getProviderFreshness(b).date.localeCompare(statusApi.getProviderFreshness(a).date)).slice(0, 6);
      if (recent.length) recent.forEach((item) => recentVerified.append(createPartnerCard(item)));
      else recentVerified.append(window.TaranStates.message({ title: "최근 확인된 업체가 없습니다.", description: "정보 확인이 끝난 업체부터 순서대로 표시합니다." }));
    }
    if (!recommended) return;
    const seoulKids = items.filter((item) => {
      const location = `${text(item.region)} ${text(item.area)} ${text(item.address)}`;
      const events = (item.eventTags || item.eventTypes || []).map((value) => window.SonpumEventTypes?.normalize?.(value) || value);
      return location.includes("서울") && (events.includes("kids") || /돌잔치|백일|키즈/i.test(`${item.subcategory || ""} ${(item.tags || []).join(" ")}`));
    });
    const latest = [...seoulKids].sort((a, b) => text(b.verifiedAt).localeCompare(text(a.verifiedAt))).slice(0, 6);
    if (latest.length) latest.forEach((item) => recommended.append(createPartnerCard(item)));
    else recommended.append(window.TaranStates.message({ title: "공개된 업체 정보가 없습니다.", description: "업체 정보 확인 후 이 영역에 표시됩니다." }));
  }

  Promise.resolve(window.taranContentReady).then(init).catch((error) => console.error("홈 정보를 불러오지 못했습니다.", error));
})();
