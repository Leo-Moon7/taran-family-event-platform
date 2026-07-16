(function () {
  "use strict";

  const PAGE_SIZE = 24;
  const EVENT_LABELS = { kids: "아이 행사", wedding: "결혼 준비", parents: "부모님 행사", home: "가족 모임" };
  const SERVICE_LABELS = ["공간 대여", "스냅·영상", "스타일링·케이터링", "의상·뷰티", "답례품·초대장"];
  const state = { page: 1, items: [], filtered: [] };
  const elements = {
    form: document.querySelector("[data-filter-form]"), panel: document.querySelector("#directory-filter-panel"), query: document.querySelector("#directory-query"),
    event: document.querySelector("#directory-event"), province: document.querySelector("#directory-province"), district: document.querySelector("#directory-district"),
    guests: document.querySelector("#directory-guests"), budget: document.querySelector("#directory-budget"), category: document.querySelector("#directory-category"),
    sort: document.querySelector("#directory-sort-quick"), chips: document.querySelector("#directory-filter-chips"),
    summary: document.querySelector("#directory-result-summary"), results: document.querySelector("#directory-results"), pagination: document.querySelector("#directory-pagination")
  };

  const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const text = (value) => String(value || "").trim();

  function validImageUrl(value) {
    const url = text(value);
    if (/^(?:https?:|\/|\.\/|assets\/)/i.test(url) && !/^javascript:/i.test(url)) return url;
    return "assets/images/venue-hotel.webp";
  }

  function reviewSummary(item) {
    const internal = Array.isArray(item.internalReviews) ? item.internalReviews : [];
    const external = Array.isArray(item.externalReviews) ? item.externalReviews : [];
    const ratings = internal.map((review) => number(review.rating ?? review.score ?? review.stars)).filter((rating) => rating > 0 && rating <= 5);
    const explicitRating = number(item.internalReviewStats?.average || item.internalRating || item.averageRating || item.rating);
    const rating = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : explicitRating;
    const internalCount = Math.max(internal.length, number(item.internalReviewStats?.count || item.internalReviewCount));
    return { count: internalCount + external.length, rating: rating > 0 && rating <= 5 ? rating : 0 };
  }

  function isPublic(item) {
    if (!item || item.publicationStatus === "hidden") return false;
    const review = reviewSummary(item);
    return review.count > 0 || review.rating > 0;
  }

  function uniqueItems(items) {
    const seen = new Set();
    return items.filter((item) => {
      const key = text(item.id) || `${text(item.name)}|${text(item.region)}|${text(item.area)}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function setupCategoryOptions() {
    SERVICE_LABELS.filter((category) => state.items.some((item) => serviceGroup(item) === category)).forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      elements.category.append(option);
    });
  }

  function setupRegions() {
    if (window.taranSetupRegionSelects) return window.taranSetupRegionSelects(elements.province, elements.district);
    [...new Set(state.items.map((item) => text(item.region)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko-KR")).forEach((province) => {
      const option = document.createElement("option");
      option.value = province;
      option.textContent = province;
      elements.province.append(option);
    });
    return null;
  }

  function extractCapacity(item) {
    const facts = item.detailFacts || {};
    const candidates = [item.capacity, item.maxGuests, item.maxCapacity, facts["최대 수용인원"], facts["수용 인원"], facts["최소·최대 인원"]];
    for (const candidate of candidates) {
      if (typeof candidate === "number" && candidate > 0) return candidate;
      const matches = text(candidate).match(/\d[\d,]*/g);
      if (matches?.length) return Math.max(...matches.map((value) => number(value.replaceAll(",", ""))));
    }
    return 0;
  }

  const priceValue = (item) => number(item.price || item.startingPrice || item.basePrice);

  function serviceGroup(item) {
    const source = `${text(item.category)} ${text(item.subcategory)} ${text(item.detailFacts?.["업종"])} ${(item.serviceTags || []).join(" ")}`;
    if (/스냅|영상|사진|photo/i.test(source)) return "스냅·영상";
    if (/의상|뷰티|메이크업|한복|드레스/i.test(source)) return "의상·뷰티";
    if (/답례|초대장|기프트/i.test(source)) return "답례품·초대장";
    if (/돌상|케이터링|출장뷔페|플라워|스타일링/i.test(source)) return "스타일링·케이터링";
    return "공간 대여";
  }

  function cardServiceLabel(item) {
    if (serviceGroup(item) !== "공간 대여") return serviceGroup(item);
    const industry = text(item.detailFacts?.["업종"] || item.officialVerification?.category);
    return /음식|한식|일식|중식|양식|뷔페|레스토랑|카페/i.test(industry) ? "식사 · 공간 대여" : "공간 대여";
  }

  function normalizedLocation(item) {
    const region = text(item.region);
    const shortProvince = { "서울특별시":"서울", "부산광역시":"부산", "대구광역시":"대구", "인천광역시":"인천", "광주광역시":"광주", "대전광역시":"대전", "울산광역시":"울산", "세종특별자치시":"세종", "경기도":"경기", "강원특별자치도":"강원", "충청북도":"충북", "충청남도":"충남", "전북특별자치도":"전북", "전라남도":"전남", "경상북도":"경북", "경상남도":"경남", "제주특별자치도":"제주" }[region];
    let area = text(item.area);
    if (shortProvince && area.startsWith(`${shortProvince} `)) area = area.slice(shortProvince.length + 1);
    if (!area || area === region || region.includes(area)) return region;
    return `${region} ${area}`;
  }

  function searchText(item) {
    return [item.name, item.category, item.subcategory, item.region, item.area, ...(item.tags || []), ...Object.values(item.detailFacts || {})].map(text).join(" ").toLowerCase();
  }

  function itemMatchesRegion(item) {
    const location = `${text(item.region)} ${text(item.area)} ${text(item.detailFacts?.["도로명 주소"])} ${text(item.officialVerification?.roadAddress)}`;
    return (elements.province.value === "all" || location.includes(elements.province.value)) && (elements.district.value === "all" || location.includes(elements.district.value));
  }

  function itemMatchesGuests(item) {
    const requested = number(elements.guests.value);
    if (!requested) return true;
    const capacity = extractCapacity(item);
    if (!capacity) return true;
    return requested === 101 ? capacity > 100 : capacity >= requested;
  }

  function itemMatchesBudget(item) {
    const requested = number(elements.budget.value);
    if (!requested) return true;
    const price = priceValue(item);
    if (!price) return true;
    return requested === 5000001 ? price > 5000000 : price <= requested;
  }

  function regionKey(item) {
    const location = normalizedLocation(item);
    const provinceIndex = (window.taranRegionData || []).findIndex((entry) => location.includes(entry.province));
    const province = (window.taranRegionData || [])[provinceIndex];
    const districtIndex = province ? province.districts.findIndex((district) => location.includes(district)) : -1;
    return [provinceIndex < 0 ? 999 : provinceIndex, districtIndex < 0 ? 999 : districtIndex, location, text(item.name)];
  }

  function compareRegion(left, right) {
    const a = regionKey(left);
    const b = regionKey(right);
    return a[0] - b[0] || a[1] - b[1] || a[2].localeCompare(b[2], "ko-KR") || a[3].localeCompare(b[3], "ko-KR");
  }

  function sortItems(items) {
    const sorted = [...items];
    if (elements.sort.value === "review-count") return sorted.sort((a, b) => reviewSummary(b).count - reviewSummary(a).count || compareRegion(a, b));
    if (elements.sort.value === "rating-high") return sorted.sort((a, b) => reviewSummary(b).rating - reviewSummary(a).rating || reviewSummary(b).count - reviewSummary(a).count || compareRegion(a, b));
    if (elements.sort.value === "rating-low") return sorted.sort((a, b) => {
      const ar = reviewSummary(a).rating;
      const br = reviewSummary(b).rating;
      return (ar ? 0 : 1) - (br ? 0 : 1) || ar - br || compareRegion(a, b);
    });
    if (elements.sort.value === "price-low") return sorted.sort((a, b) => (priceValue(a) || Number.MAX_SAFE_INTEGER) - (priceValue(b) || Number.MAX_SAFE_INTEGER) || compareRegion(a, b));
    if (elements.sort.value === "updated") return sorted.sort((a, b) => text(b.verifiedAt).localeCompare(text(a.verifiedAt)) || compareRegion(a, b));
    return sorted.sort(compareRegion);
  }

  function statusLabel(item) {
    if (text(item.officialVerification?.status) === "verified") return "기본 정보 확인";
    if (reviewSummary(item).count) return "후기 정보 있음";
    return "정보 등록";
  }

  const isReferenceImage = (item) => /assets\/images\/venue-/i.test(validImageUrl(item.image));

  function appendFact(container, label, value) {
    if (!text(value)) return;
    const wrapper = document.createElement("span");
    wrapper.className = "directory-card__fact";
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    wrapper.append(small, strong);
    container.append(wrapper);
  }

  function createCard(item) {
    const link = document.createElement("a");
    link.className = "directory-card";
    link.href = item.detailUrl || `provider.html?id=${encodeURIComponent(text(item.id))}`;
    link.setAttribute("aria-label", `${text(item.name)} 상세 보기`);
    const visual = document.createElement("div");
    visual.className = "directory-card__visual";
    const image = document.createElement("img");
    image.src = validImageUrl(item.image);
    image.alt = isReferenceImage(item) ? "" : `${text(item.name)} 대표 이미지`;
    image.loading = "lazy";
    visual.append(image);
    if (isReferenceImage(item)) {
      const note = document.createElement("span");
      note.className = "directory-card__image-note";
      note.textContent = "카테고리 참고 이미지";
      visual.append(note);
    }
    const body = document.createElement("div");
    body.className = "directory-card__body";
    const head = document.createElement("div");
    head.className = "directory-card__head";
    const status = document.createElement("span");
    status.className = "badge badge--success";
    status.textContent = statusLabel(item);
    const type = document.createElement("span");
    type.className = "badge";
    type.textContent = cardServiceLabel(item);
    head.append(status, type);
    const title = document.createElement("h2");
    title.textContent = text(item.name);
    const location = document.createElement("p");
    location.className = "directory-card__location";
    location.textContent = normalizedLocation(item);
    const review = reviewSummary(item);
    const metrics = document.createElement("div");
    metrics.className = "directory-card__meta";
    if (review.rating) {
      const rating = document.createElement("span");
      rating.textContent = `★ ${review.rating.toFixed(1)}`;
      metrics.append(rating);
    }
    if (review.count) {
      const count = document.createElement("span");
      count.className = "directory-card__reviews";
      count.textContent = `후기 ${review.count.toLocaleString("ko-KR")}개`;
      metrics.append(count);
    }
    const facts = document.createElement("div");
    facts.className = "directory-card__facts";
    const capacity = extractCapacity(item);
    const price = priceValue(item);
    if (capacity) appendFact(facts, "수용 인원", `최대 ${capacity.toLocaleString("ko-KR")}명`);
    if (price) appendFact(facts, "예상 가격", `${price.toLocaleString("ko-KR")}원부터`);
    const eventTags = (item.eventTags || []).map((value) => EVENT_LABELS[value]).filter(Boolean).slice(0, 2);
    if (eventTags.length) appendFact(facts, "가능 행사", eventTags.join(" · "));
    const foot = document.createElement("div");
    foot.className = "directory-card__foot";
    const confirmed = document.createElement("span");
    confirmed.textContent = item.verifiedAt ? `정보 확인 ${text(item.verifiedAt)}` : statusLabel(item);
    const action = document.createElement("strong");
    action.textContent = "상세 보기 →";
    foot.append(confirmed, action);
    body.append(head, title, location, metrics);
    if (facts.childElementCount) body.append(facts);
    body.append(foot);
    link.append(visual, body);
    return link;
  }

  function activeFilters() {
    return [["event", elements.event, "행사"], ["province", elements.province, "지역"], ["district", elements.district, "지역"], ["guests", elements.guests, "인원"], ["budget", elements.budget, "예산"], ["category", elements.category, "서비스"]]
      .filter(([, select]) => select.value !== "all" && select.value !== "0");
  }

  function renderChips() {
    elements.chips.replaceChildren();
    activeFilters().forEach(([key, select, prefix]) => {
      const label = select.options[select.selectedIndex]?.textContent || select.value;
      elements.chips.append(window.TaranFilters.createChip(`${prefix}: ${label}`, key, removeFilter));
    });
  }

  function removeFilter(key) {
    const select = elements[key];
    if (!select) return;
    select.value = select.querySelector('option[value="all"]') ? "all" : "0";
    if (key === "province") {
      select.dispatchEvent(new Event("change"));
      elements.district.value = "all";
    }
    state.page = 1;
    applyFilters();
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (elements.query.value.trim()) params.set("query", elements.query.value.trim());
    activeFilters().forEach(([key, select]) => params.set(key, select.value));
    if (elements.sort.value !== "region") params.set("sort", elements.sort.value);
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}`);
  }

  function render(updateHistory = true) {
    const total = state.filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    const pageItems = state.filtered.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    elements.summary.textContent = total ? `${total.toLocaleString("ko-KR")}개의 공개 파트너` : "검색 결과가 없습니다.";
    elements.results.replaceChildren();
    elements.results.setAttribute("aria-busy", "false");
    if (!total) elements.results.append(window.TaranStates.message({ title: "조건에 맞는 업체가 없습니다.", description: "지역이나 인원, 예산 조건을 줄여 다시 찾아보세요.", actionLabel: "조건 초기화", onAction: resetFilters }));
    else pageItems.forEach((item) => elements.results.append(createCard(item)));
    window.TaranPagination.render(elements.pagination, { page: state.page, totalPages, onChange(page) { state.page = page; render(); document.querySelector(".result-toolbar")?.scrollIntoView({ behavior: "smooth", block: "start" }); } });
    renderChips();
    if (updateHistory) updateUrl();
  }

  function applyFilters(updateHistory = true) {
    const query = elements.query.value.trim().toLowerCase();
    state.filtered = sortItems(state.items.filter((item) => (!query || searchText(item).includes(query)) && (elements.event.value === "all" || (item.eventTags || []).includes(elements.event.value)) && (elements.category.value === "all" || serviceGroup(item) === elements.category.value) && itemMatchesRegion(item) && itemMatchesGuests(item) && itemMatchesBudget(item)));
    render(updateHistory);
  }

  function resetFilters(updateHistory = true) {
    elements.form.reset();
    elements.event.value = "all";
    elements.province.value = "all";
    elements.province.dispatchEvent(new Event("change"));
    elements.district.value = "all";
    elements.sort.value = "region";
    state.page = 1;
    applyFilters();
  }

  function selectFromUrl(control, value) {
    if (value && [...control.options].some((option) => option.value === value)) control.value = value;
  }

  function readUrl() {
    const params = new URLSearchParams(location.search);
    selectFromUrl(elements.event, params.get("event"));
    const province = params.get("province");
    selectFromUrl(elements.province, province);
    if (province) elements.province.dispatchEvent(new Event("change"));
    selectFromUrl(elements.district, params.get("district"));
    selectFromUrl(elements.guests, params.get("guests"));
    selectFromUrl(elements.budget, params.get("budget"));
    selectFromUrl(elements.category, params.get("category"));
    selectFromUrl(elements.sort, params.get("sort"));
    if (params.get("query")) elements.query.value = params.get("query");
  }

  function openFilter() {
    elements.panel.dataset.open = "true";
    document.querySelector("[data-filter-open]")?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    elements.query.focus();
  }
  function closeFilter() {
    delete elements.panel.dataset.open;
    document.querySelector("[data-filter-open]")?.setAttribute("aria-expanded", "false");
    document.body.style.removeProperty("overflow");
    document.querySelector("[data-filter-open]")?.focus();
  }

  function init() {
    if (!elements.form || !elements.results) return;
    elements.results.append(window.TaranStates.skeletonCards(6));
    state.items = uniqueItems(window.publicDirectoryData || []).filter(isPublic);
    setupCategoryOptions();
    setupRegions();
    readUrl();
    elements.form.addEventListener("submit", (event) => { event.preventDefault(); state.page = 1; applyFilters(); closeFilter(); });
    elements.form.addEventListener("reset", (event) => { event.preventDefault(); resetFilters(); });
    elements.sort.addEventListener("change", () => { state.page = 1; applyFilters(); });
    document.querySelector("[data-filter-open]")?.addEventListener("click", openFilter);
    document.querySelector("[data-filter-close]")?.addEventListener("click", closeFilter);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && elements.panel.dataset.open === "true") closeFilter(); });
    window.addEventListener("popstate", () => {
      resetFilters(false);
      readUrl();
      state.page = 1;
      applyFilters(false);
    });
    applyFilters(false);
  }

  Promise.resolve(window.taranContentReady).then(init).catch((error) => {
    console.error("업체 목록을 표시하지 못했습니다.", error);
    elements.results?.replaceChildren(window.TaranStates.message({ title: "업체 정보를 불러오지 못했습니다.", description: "잠시 후 다시 시도해 주세요.", actionLabel: "다시 시도", onAction: () => window.location.reload() }));
    elements.results?.setAttribute("aria-busy", "false");
    if (elements.summary) elements.summary.textContent = "불러오기 오류";
  });
})();
