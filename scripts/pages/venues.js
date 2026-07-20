(function () {
  "use strict";

  const PAGE_SIZE = 24;
  const EVENT_LABELS = window.SonpumEventTypes?.labels || { kids: "아이 행사", parents: "부모님 행사", meeting: "상견례", smallWedding: "소규모 결혼식", familyGathering: "가족 모임" };
  const SERVICES = ["공간 대여", "스냅·영상", "스타일링·케이터링", "의상·뷰티", "답례품·초대장"];
  const state = { page: 1, items: [], filtered: [] };
  const statusApi = window.TaranProviderStatus;
  const compareStore = window.TaranCompareStore;
  const placeholderApi = window.SonpumProviderPlaceholder;
  const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const text = (value) => String(value ?? "").trim();
  const $ = (selector) => document.querySelector(selector);
  const controls = {
    form: $("[data-filter-form]"), panel: $("#directory-filter-panel"), query: $("#directory-query"), event: $("#directory-event"),
    province: $("#directory-province"), district: $("#directory-district"), guests: $("#directory-guests"), budget: $("#directory-budget"), date: $("#directory-date"),
    category: $("#directory-category"), guarantee: $("#directory-guarantee"), parking: $("#directory-parking"),
    private: $("#directory-private"), wheelchair: $("#directory-wheelchair"), outsideFood: $("#directory-outside-food"),
    outsideVendor: $("#directory-outside-vendor"), status: $("#directory-status"), sort: $("#directory-sort-quick"),
    chips: $("#directory-filter-chips"), summary: $("#directory-result-summary"), results: $("#directory-results"), pagination: $("#directory-pagination")
  };

  function validImageUrl(value) {
    const url = text(value);
    return /^(?:https?:|\/|\.\/|assets\/)/i.test(url) && !/^javascript:/i.test(url) ? url : "";
  }

  function verifiedImage(item) {
    const url = validImageUrl(item.image);
    return item.imageVerified && url && !/assets\/images\/venue-/i.test(url) ? url : "";
  }

  function uniqueItems(items) {
    const map = new Map();
    items.forEach((item) => {
      const key = text(item?.id) || `${text(item?.name)}|${text(item?.region)}|${text(item?.area)}`;
      if (key && !map.has(key)) map.set(key, item);
    });
    return [...map.values()];
  }

  function serviceGroup(item) {
    const source = `${text(item.category)} ${text(item.subcategory)} ${statusApi.getProviderIndustry(item)} ${(item.serviceTags || []).join(" ")}`;
    if (/스냅|영상|사진|photo/i.test(source)) return "스냅·영상";
    if (/의상|뷰티|메이크업|한복|드레스/i.test(source)) return "의상·뷰티";
    if (/답례|초대장|기프트/i.test(source)) return "답례품·초대장";
    if (/돌상|케이터링|출장뷔페|플라워|스타일링/i.test(source)) return "스타일링·케이터링";
    return "공간 대여";
  }

  function cardServiceLabel(item) {
    const group = serviceGroup(item);
    if (group !== "공간 대여") return group;
    return /음식|한식|일식|중식|양식|뷔페|레스토랑|카페/i.test(statusApi.getProviderIndustry(item)) ? "식사 · 공간 대여" : group;
  }

  function normalizedLocation(item) {
    const region = text(item.region);
    let area = text(item.area).replace(/^(서울|부산|대구|인천|광주|대전|울산|경기|강원|충북|충남|전북|전남|경북|경남|제주)\s+/u, "");
    if (!area || area === region || region.includes(area)) return region;
    return `${region} ${area}`;
  }

  function reviewSummary(item) {
    const internal = Array.isArray(item.internalReviews) ? item.internalReviews : [];
    const external = Array.isArray(item.externalReviews) ? item.externalReviews : [];
    const ratings = internal.map((review) => number(review.rating ?? review.score ?? review.stars)).filter((rating) => rating > 0 && rating <= 5);
    const explicit = number(item.internalReviewStats?.average || item.internalRating || item.averageRating || item.rating);
    const count = Math.max(internal.length, number(item.internalReviewStats?.count || item.internalReviewCount)) + external.length;
    return { count, rating: ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : (explicit > 0 && explicit <= 5 ? explicit : 0) };
  }

  function hasPublishedReviewOrRating(item) {
    const summary = reviewSummary(item);
    return summary.count > 0 || summary.rating > 0;
  }

  function priceValue(item) {
    if (!statusApi.shouldShowVolatileFacts(item)) return 0;
    const facts = statusApi.getProviderFacts(item);
    return facts.adultMealMin || facts.rentalFee || number(item.price || item.startingPrice || item.basePrice);
  }

  function booleanFact(item, kind) {
    const source = `${JSON.stringify(item.detailFacts || {})} ${(item.tags || []).join(" ")}`.toLowerCase();
    const patterns = {
      parking: /주차 가능|주차장|주차 \d|무료 주차/,
      private: /단독|독립|프라이빗|개별 룸/,
      wheelchair: /휠체어|장애인|엘리베이터|무장애/,
      outsideFood: /외부 음식 (?:가능|허용)|음식 반입 (?:가능|허용)/,
      outsideVendor: /외부 (?:업체|촬영|돌상|장식) (?:가능|허용)|반입 (?:가능|허용)/
    };
    return patterns[kind]?.test(source) || item[kind] === true || item[`${kind}_allowed`] === true;
  }

  function searchText(item) {
    return [item.name, item.category, item.subcategory, item.region, item.area, ...(item.tags || []), ...Object.values(item.detailFacts || {})].map(text).join(" ").toLowerCase();
  }

  function regionMatches(item) {
    const source = `${item.region || ""} ${item.area || ""} ${statusApi.getProviderAddress(item)}`;
    return (controls.province.value === "all" || source.includes(controls.province.value)) && (controls.district.value === "all" || source.includes(controls.district.value));
  }

  function guestsMatch(item) {
    const requested = number(controls.guests.value);
    if (!requested) return true;
    const max = statusApi.getProviderFacts(item).maxGuests;
    return Boolean(max) && (requested === 101 ? max > 100 : max >= requested);
  }

  function budgetMatches(item) {
    const requested = number(controls.budget.value);
    if (!requested) return true;
    const price = priceValue(item);
    return Boolean(price) && (requested === 5000001 ? price > 5000000 : price <= requested);
  }

  function normalizedEventTags(item) {
    const contextTags = [item.category, item.subcategory, ...(item.tags || []), ...(item.serviceTags || [])].map(text);
    return [...new Set((item.eventTags || item.eventTypes || []).map((value) => window.SonpumEventTypes?.normalize?.(value, contextTags) || value))];
  }

  function eventMatches(item) {
    return controls.event.value === "all" || normalizedEventTags(item).includes(controls.event.value);
  }

  function detailMatches(item) {
    const facts = statusApi.getProviderFacts(item);
    if (number(controls.guarantee.value) && (!facts.guarantee || facts.guarantee > number(controls.guarantee.value))) return false;
    if (controls.parking.value === "yes" && !booleanFact(item, "parking")) return false;
    if (controls.private.value === "yes" && !booleanFact(item, "private")) return false;
    if (controls.wheelchair.value === "yes" && !booleanFact(item, "wheelchair")) return false;
    if (controls.outsideFood.value === "yes" && !booleanFact(item, "outsideFood")) return false;
    if (controls.outsideVendor.value === "yes" && !booleanFact(item, "outsideVendor")) return false;
    if (controls.status.value !== "all" && statusApi.getProviderStatus(item).key !== controls.status.value) return false;
    return true;
  }

  function regionKey(item) {
    const location = normalizedLocation(item);
    const provinceIndex = (window.taranRegionData || []).findIndex((entry) => location.includes(entry.province));
    const province = (window.taranRegionData || [])[provinceIndex];
    const districtIndex = province ? province.districts.findIndex((district) => location.includes(district)) : -1;
    return [provinceIndex < 0 ? 999 : provinceIndex, districtIndex < 0 ? 999 : districtIndex, location, text(item.name)];
  }

  function compareRegion(a, b) {
    const left = regionKey(a), right = regionKey(b);
    return left[0] - right[0] || left[1] - right[1] || left[2].localeCompare(right[2], "ko-KR") || left[3].localeCompare(right[3], "ko-KR");
  }

  function completeness(item) {
    const facts = statusApi.getProviderFacts(item);
    return [statusApi.getProviderAddress(item), facts.maxGuests, facts.guarantee, priceValue(item), facts.parking, verifiedImage(item)].filter(Boolean).length;
  }

  function recommendationScore(item) {
    const facts = statusApi.getProviderFacts(item);
    let score = 0;
    if (eventMatches(item)) score += 20;
    if (controls.province.value !== "all" && `${item.region || ""} ${item.area || ""}`.includes(controls.province.value)) score += 25;
    if (controls.category.value !== "all" && serviceGroup(item) === controls.category.value) score += 12;
    if (number(controls.guests.value) && facts.maxGuests >= number(controls.guests.value)) score += 20;
    if (number(controls.budget.value) && priceValue(item) && priceValue(item) <= number(controls.budget.value)) score += 15;
    if (["parking", "private", "wheelchair", "outsideFood", "outsideVendor"].some((key) => controls[key].value === "yes" && booleanFact(item, key))) score += 15;
    score += Math.min(8, completeness(item));
    if (statusApi.getProviderFreshness(item).state === "fresh") score += 7;
    if (number(item.responseRate) >= 80 || /빠른 응답/i.test((item.tags || []).join(" "))) score += 10;
    return score;
  }

  function sortItems(items) {
    const sorted = [...items];
    const sort = controls.sort.value;
    if (["recommended", "match"].includes(sort)) return sorted.sort((a, b) => recommendationScore(b) - recommendationScore(a) || compareRegion(a, b));
    if (sort === "price") return sorted.sort((a, b) => (priceValue(a) || Number.MAX_SAFE_INTEGER) - (priceValue(b) || Number.MAX_SAFE_INTEGER) || compareRegion(a, b));
    if (sort === "minimum-guarantee") return sorted.sort((a, b) => (statusApi.getProviderFacts(a).guarantee || Number.MAX_SAFE_INTEGER) - (statusApi.getProviderFacts(b).guarantee || Number.MAX_SAFE_INTEGER));
    if (sort === "capacity") return sorted.sort((a, b) => statusApi.getProviderFacts(b).maxGuests - statusApi.getProviderFacts(a).maxGuests);
    if (sort === "response") return sorted.sort((a, b) => number(b.responseRate) - number(a.responseRate) || compareRegion(a, b));
    if (sort === "recent") return sorted.sort((a, b) => statusApi.getProviderStatus(b).date.localeCompare(statusApi.getProviderStatus(a).date) || compareRegion(a, b));
    return sorted.sort((a, b) => recommendationScore(b) - recommendationScore(a) || compareRegion(a, b));
  }

  function makeAction(label, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function createCard(item) {
    const card = document.createElement("article");
    card.className = "directory-card";
    const href = item.detailUrl || `provider.html?id=${encodeURIComponent(text(item.id))}`;
    const media = document.createElement("a");
    media.className = "directory-card__visual";
    media.href = href;
    media.setAttribute("aria-label", `${text(item.name)} 상세 보기`);
    const image = document.createElement("img");
    const requestedImage = verifiedImage(item);
    placeholderApi.apply(image, item, requestedImage);
    image.loading = "lazy";
    media.append(image);
    if (!requestedImage) {
      const note = document.createElement("span");
      note.className = "directory-card__image-note";
      note.textContent = "업체 사진 준비 중";
      media.append(note);
    }
    const body = document.createElement("div");
    body.className = "directory-card__body";
    const status = statusApi.getProviderStatus(item);
    const head = document.createElement("div");
    head.className = "directory-card__head";
    const statusBadge = document.createElement("span");
    statusBadge.className = `badge ${status.key === "verified" ? "badge--success" : ""}`;
    statusBadge.textContent = status.label;
    const type = document.createElement("span");
    type.className = "badge";
    type.textContent = cardServiceLabel(item);
    head.append(statusBadge, type);
    const titleLink = document.createElement("a");
    titleLink.href = href;
    const title = document.createElement("h2");
    title.textContent = text(item.name);
    titleLink.append(title);
    const location = document.createElement("p");
    location.className = "directory-card__location";
    location.textContent = normalizedLocation(item);
    const facts = statusApi.getProviderFacts(item);
    const factList = document.createElement("dl");
    factList.className = "directory-card__facts";
    const cardFacts = [
      ["최대 인원", facts.maxGuests ? `${facts.maxGuests.toLocaleString("ko-KR")}명` : "업체 확인 필요"],
      ["최소 보증 인원", facts.guarantee ? `${facts.guarantee.toLocaleString("ko-KR")}명` : "업체 확인 필요"],
      ["식대·시작 가격", priceValue(item) ? `${priceValue(item).toLocaleString("ko-KR")}원부터` : "가격 문의 필요"],
      ["주차", facts.parking ? `${facts.parking.toLocaleString("ko-KR")}대` : (booleanFact(item, "parking") ? "가능" : "업체 확인 필요")]
    ];
    cardFacts.forEach(([label, value]) => {
      const wrapper = document.createElement("div");
      const dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = label; dd.textContent = value; wrapper.append(dt, dd); factList.append(wrapper);
    });
    const events = document.createElement("p");
    events.className = "directory-card__events";
    events.textContent = normalizedEventTags(item).map((key) => EVENT_LABELS[key] || window.SonpumEventTypes?.label?.(key)).filter(Boolean).join(" · ");
    const freshness = document.createElement("small");
    freshness.className = "directory-card__freshness";
    const freshnessState = statusApi.getProviderFreshness(item);
    freshness.textContent = freshnessState.date ? `정보 확인 ${freshnessState.date}` : "";
    const actions = document.createElement("div");
    actions.className = "directory-card__actions";
    const saved = JSON.parse(window.TaranStorage?.get("saved-providers", "[]") || "[]");
    const saveButton = makeAction(saved.includes(item.id) ? "관심 저장됨" : "관심 저장", "button button--secondary button--sm", () => {
      const ids = JSON.parse(window.TaranStorage?.get("saved-providers", "[]") || "[]");
      const next = ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id];
      window.TaranStorage?.set("saved-providers", JSON.stringify(next));
      saveButton.textContent = next.includes(item.id) ? "관심 저장됨" : "관심 저장";
    });
    const compareButton = makeAction(compareStore.has(item.id) ? "비교함에 담김" : "비교 담기", "button button--primary button--sm", () => {
      const result = compareStore.toggle(item.id);
      if (!result.ok) {
        window.TaranToast?.show?.("비교함에는 최대 3개 업체를 담을 수 있습니다.", { actionLabel: "비교함 보기", onAction: () => { location.href = "compare.html"; } });
        return;
      }
      compareButton.textContent = compareStore.has(item.id) ? "비교함에 담김" : "비교 담기";
      compareButton.setAttribute("aria-pressed", String(compareStore.has(item.id)));
    });
    compareButton.setAttribute("aria-pressed", String(compareStore.has(item.id)));
    actions.append(saveButton, compareButton);
    body.append(head, titleLink, location);
    if (events.textContent) body.append(events);
    if (factList.children.length) body.append(factList);
    if (freshness.textContent) body.append(freshness);
    body.append(actions);
    card.append(media, body);
    return card;
  }

  const filterDefinitions = [
    ["event", controls.event, "행사"], ["province", controls.province, "지역"], ["district", controls.district, "지역"], ["guests", controls.guests, "인원"], ["date", controls.date, "날짜"],
    ["budget", controls.budget, "예산"], ["category", controls.category, "유형"], ["guarantee", controls.guarantee, "보증 인원"],
    ["parking", controls.parking, "주차"], ["private", controls.private, "단독 공간"], ["wheelchair", controls.wheelchair, "휠체어"],
    ["outsideFood", controls.outsideFood, "외부 음식"], ["outsideVendor", controls.outsideVendor, "외부 업체"], ["status", controls.status, "상태"]
  ];

  function activeFilters() {
    return filterDefinitions.filter(([, control]) => control && control.value && !["all", "0"].includes(control.value));
  }

  function renderChips() {
    controls.chips.replaceChildren();
    activeFilters().forEach(([key, control]) => {
      const label = control.tagName === "SELECT" ? control.options[control.selectedIndex]?.textContent : control.value;
      controls.chips.append(window.TaranFilters.createChip(label, key, () => {
        control.value = control.querySelector?.('option[value="all"]') ? "all" : (control.querySelector?.('option[value="0"]') ? "0" : "");
        if (key === "province") control.dispatchEvent(new Event("change"));
        state.page = 1; applyFilters();
      }));
    });
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (controls.query.value.trim()) params.set("query", controls.query.value.trim());
    activeFilters().forEach(([key, control]) => params.set(key, control.value));
    if (controls.sort.value !== "recommended") params.set("sort", controls.sort.value);
    history.replaceState(null, "", `${location.pathname}${params.size ? `?${params}` : ""}`);
    window.TaranSearchContext?.save(window.TaranSearchContext.fromParams(params));
  }

  function render(updateHistory = true) {
    const total = state.filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    controls.summary.textContent = total ? `${total.toLocaleString("ko-KR")}개의 공개 업체` : "검색 결과가 없습니다.";
    controls.results.replaceChildren();
    controls.results.setAttribute("aria-busy", "false");
    if (!total) controls.results.append(window.TaranStates.message({ title: "조건에 맞는 업체가 없습니다.", description: "지역이나 인원, 예산 조건을 줄여 다시 찾아보세요.", actionLabel: "조건 초기화", onAction: resetFilters }));
    else state.filtered.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE).forEach((item) => controls.results.append(createCard(item)));
    window.TaranPagination.render(controls.pagination, { page: state.page, totalPages, onChange(page) { state.page = page; render(); $(".result-toolbar")?.scrollIntoView({ behavior: "smooth" }); } });
    renderChips();
    if (updateHistory) updateUrl();
  }

  function applyFilters(updateHistory = true) {
    const query = controls.query.value.trim().toLowerCase();
    state.filtered = sortItems(state.items.filter((item) => hasPublishedReviewOrRating(item) &&
      (!query || searchText(item).includes(query)) &&
      eventMatches(item) &&
      (controls.category.value === "all" || serviceGroup(item) === controls.category.value) &&
      regionMatches(item) && guestsMatch(item) && budgetMatches(item) && detailMatches(item)));
    render(updateHistory);
  }

  function resetFilters(updateHistory = true) {
    controls.form.reset();
    controls.event.value = controls.province.value = controls.district.value = controls.category.value = controls.parking.value = controls.private.value = controls.wheelchair.value = controls.outsideFood.value = controls.outsideVendor.value = controls.status.value = "all";
    controls.guests.value = controls.budget.value = controls.guarantee.value = "0";
    controls.date.value = "";
    controls.sort.value = "recommended";
    controls.province.dispatchEvent(new Event("change"));
    state.page = 1; applyFilters(updateHistory);
  }

  function selectUrl(control, value) {
    if (!value || !control) return;
    const option = [...(control.options || [])].find((item) => item.value === value);
    if (option) control.value = value;
    else if (control.tagName === "INPUT") control.value = value;
  }

  function readUrl() {
    const params = new URLSearchParams(location.search);
    const resolved = window.TaranSearchContext?.resolve?.(params) || {};
    selectUrl(controls.event, resolved.event); selectUrl(controls.province, resolved.province);
    if (resolved.province) controls.province.dispatchEvent(new Event("change"));
    selectUrl(controls.district, params.get("district")); selectUrl(controls.guests, params.get("guests")); selectUrl(controls.date, params.get("date"));
    const budget = number(params.get("budget"));
    if (budget) {
      const options = [...controls.budget.options].map((option) => number(option.value)).filter(Boolean).sort((a, b) => a - b);
      controls.budget.value = String(options.find((value) => value >= budget) || options.at(-1));
    }
    selectUrl(controls.category, params.get("category")); selectUrl(controls.guarantee, params.get("guarantee"));
    selectUrl(controls.parking, params.get("parking")); selectUrl(controls.private, params.get("private")); selectUrl(controls.wheelchair, params.get("wheelchair"));
    selectUrl(controls.outsideFood, params.get("outsideFood")); selectUrl(controls.outsideVendor, params.get("outsideVendor")); selectUrl(controls.status, params.get("status"));
    const legacySort = { region: "recommended", updated: "recent", "price-low": "price", "review-count": "recommended", "rating-high": "recommended", "rating-low": "recommended" };
    selectUrl(controls.sort, legacySort[params.get("sort")] || params.get("sort") || resolved.sort || "recommended");
    if (params.get("query")) controls.query.value = params.get("query");
  }

  function renderDock(ids) {
    const dock = $("[data-compare-dock]");
    if (!dock) return;
    dock.hidden = !ids.length;
    $("[data-compare-dock-count]").textContent = String(ids.length);
    const list = $("[data-compare-dock-items]");
    list.replaceChildren();
    ids.forEach((id) => {
      const item = state.items.find((provider) => provider.id === id);
      const button = document.createElement("button");
      button.type = "button"; button.textContent = `${item?.name || "선택 업체"} ×`; button.addEventListener("click", () => compareStore.remove(id)); list.append(button);
    });
    document.querySelectorAll(".directory-card").forEach((card) => {
      const button = card.querySelector("[aria-pressed]");
      if (!button) return;
      const id = new URL(card.querySelector("a")?.href || location.href).searchParams.get("id");
      button.textContent = compareStore.has(id) ? "비교함에 담김" : "비교 담기";
      button.setAttribute("aria-pressed", String(compareStore.has(id)));
    });
  }

  function setupOptions() {
    SERVICES.filter((group) => state.items.some((item) => serviceGroup(item) === group)).forEach((group) => {
      const option = document.createElement("option"); option.value = option.textContent = group; controls.category.append(option);
    });
    if (window.taranSetupRegionSelects) window.taranSetupRegionSelects(controls.province, controls.district);
  }

  function openFilter() { controls.panel.dataset.open = "true"; $("[data-filter-open]")?.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; controls.query.focus(); }
  function closeFilter() { delete controls.panel.dataset.open; $("[data-filter-open]")?.setAttribute("aria-expanded", "false"); document.body.style.removeProperty("overflow"); }

  async function attachPublishedReviewStats(items) {
    if (!window.TaranConfig?.isSupabaseConfigured || !window.TaranApi) return items;
    try {
      const rows = await window.TaranApi.select(window.TaranConfig.tables.reviews, {
        status: "eq.published",
        select: "provider_id,rating"
      });
      const grouped = new Map();
      rows.forEach((row) => {
        const key = String(row.provider_id || "");
        if (!key) return;
        const current = grouped.get(key) || { count: 0, total: 0 };
        current.count += 1;
        current.total += number(row.rating);
        grouped.set(key, current);
      });
      return items.map((item) => {
        const stats = grouped.get(String(item.id));
        return stats ? {
          ...item,
          internalReviewStats: { count: stats.count, average: stats.count ? stats.total / stats.count : 0 }
        } : item;
      });
    } catch (error) {
      console.warn("공개 후기 통계를 불러오지 못했습니다.", error);
      return items;
    }
  }

  async function init() {
    if (!controls.form || !controls.results) return;
    controls.results.append(window.TaranStates.skeletonCards(6));
    const publicItems = uniqueItems(window.publicDirectoryData || []).filter(statusApi.isProviderPublic);
    state.items = await attachPublishedReviewStats(publicItems);
    setupOptions(); readUrl();
    controls.form.addEventListener("submit", (event) => { event.preventDefault(); state.page = 1; applyFilters(); closeFilter(); });
    controls.form.addEventListener("reset", (event) => { event.preventDefault(); resetFilters(); });
    controls.sort.addEventListener("change", () => { state.page = 1; applyFilters(); });
    $("[data-filter-open]")?.addEventListener("click", openFilter); $("[data-filter-close]")?.addEventListener("click", closeFilter);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeFilter(); });
    compareStore.subscribe(renderDock);
    applyFilters(false);
  }

  Promise.resolve(window.taranContentReady).then(init).catch((error) => {
    console.error("업체 목록을 표시하지 못했습니다.", error);
    controls.results?.replaceChildren(window.TaranStates.message({ title: "업체 정보를 불러오지 못했습니다.", description: "잠시 후 다시 시도해 주세요.", actionLabel: "다시 시도", onAction: () => location.reload() }));
  });
})();
