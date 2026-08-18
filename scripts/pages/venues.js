(function () {
  "use strict";

  const profiles = (Array.isArray(window.customerProviderProfiles) ? window.customerProviderProfiles : [])
    .filter((profile) => profile?.displayGate === "customer_ready");
  const state = { filtered: [...profiles] };
  const $ = (selector) => document.querySelector(selector);
  const text = (value) => String(value ?? "").trim();
  const controls = {
    form: $("[data-filter-form]"),
    panel: $("#directory-filter-panel"),
    query: $("#directory-query"),
    service: $("#directory-service"),
    district: $("#directory-district"),
    priceInfo: $("#directory-price-info"),
    chips: $("#directory-filter-chips"),
    summary: $("#directory-result-summary"),
    results: $("#directory-results"),
    categoryTabs: [...document.querySelectorAll("[data-category-tab]")]
  };
  let filterTrigger = null;

  function formatDate(value) {
    const match = text(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? `${match[1]}.${match[2]}.${match[3]}` : text(value);
  }

  function formatWon(value) {
    return `${Number(value).toLocaleString("ko-KR")}원`;
  }

  function categoryLabel(value) {
    return value === "돌사진·스튜디오" ? "스냅·영상" : "장소·식사";
  }

  const customerServiceLabels = Object.freeze({
    "돌잔치 가족 모임": "돌잔치",
    "아이 첫 생일 행사": "돌잔치",
    "돌잔치 가족연회": "돌잔치",
    "행사 스타일링과 메뉴": "행사 스타일링",
    "한옥 돌잔치": "한옥 돌잔치",
    "헤어·메이크업 연계": "헤어·메이크업 연계"
  });

  function searchText(profile) {
    return [
      profile.name,
      profile.introduction,
      ...profile.serviceCategories,
      ...profile.services,
      profile.location?.province,
      profile.location?.district,
      profile.location?.neighborhood,
      profile.location?.address,
      ...profile.products.map((product) => product.name)
    ].map(text).join(" ").toLowerCase();
  }

  function makeOption(value, label = value) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  }

  function setupOptions() {
    const services = [...new Set(profiles.flatMap((profile) => profile.serviceCategories))].sort((a, b) => a.localeCompare(b, "ko"));
    const districts = [...new Set(profiles.map((profile) => profile.location?.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
    services.forEach((value) => controls.service.append(makeOption(value, categoryLabel(value))));
    districts.forEach((value) => controls.district.append(makeOption(value)));
    controls.categoryTabs.forEach((tab) => {
      const value = tab.dataset.categoryTab;
      const count = value === "all" ? profiles.length : profiles.filter((profile) => profile.serviceCategories.includes(value)).length;
      const countNode = tab.querySelector("span");
      if (countNode) countNode.textContent = String(count);
    });
  }

  function createChip(label, control) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    button.setAttribute("aria-label", `${label} 조건 삭제`);
    const value = document.createElement("span");
    value.textContent = label;
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "×";
    button.append(value, icon);
    button.addEventListener("click", () => {
      control.value = control.tagName === "SELECT" ? "all" : "";
      applyFilters();
    });
    return button;
  }

  function renderChips() {
    controls.chips.replaceChildren();
    if (controls.query.value.trim()) controls.chips.append(createChip(controls.query.value.trim(), controls.query));
    [controls.service, controls.district, controls.priceInfo].forEach((control) => {
      if (control.value === "all") return;
      controls.chips.append(createChip(control.options[control.selectedIndex]?.textContent || control.value, control));
    });
  }

  function createCard(profile) {
    const detailHref = `provider.html?id=${encodeURIComponent(profile.id)}`;
    const card = document.createElement("article");
    card.className = "directory-card directory-card--customer";

    const body = document.createElement("div");
    body.className = "directory-card__body";
    const meta = document.createElement("p");
    meta.className = "directory-card__meta";
    meta.textContent = `${categoryLabel(profile.serviceCategories[0])} · 서울 ${profile.location.district}`;
    const titleLink = document.createElement("a");
    titleLink.href = detailHref;
    const title = document.createElement("h2");
    title.textContent = profile.name;
    titleLink.append(title);
    const introduction = document.createElement("p");
    introduction.className = "directory-card__introduction";
    introduction.textContent = profile.introduction;

    const services = document.createElement("ul");
    services.className = "directory-card__services";
    services.setAttribute("aria-label", `${profile.name} 제공 서비스`);
    profile.services.slice(0, 3).forEach((service) => {
      const item = document.createElement("li");
      item.textContent = customerServiceLabels[service] || service;
      services.append(item);
    });

    const price = document.createElement("div");
    price.className = "directory-card__price";
    if (profile.products.length) {
      const product = profile.products[0];
      const heading = document.createElement("strong");
      heading.textContent = `성인 1인 코스 ${formatWon(product.priceMin)}부터`;
      const unit = document.createElement("span");
      unit.textContent = `${product.name} · ${product.unit} · ${formatDate(product.checkedAt)} 확인`;
      const caution = document.createElement("small");
      caution.textContent = "돌잔치 전체 비용 별도 문의";
      price.append(heading, unit, caution);
    } else {
      const heading = document.createElement("strong");
      heading.textContent = "돌잔치 비용 및 상품 구성은 업체 문의";
      price.append(heading);
    }

    const detailLink = document.createElement("a");
    detailLink.className = "button button--secondary directory-card__detail";
    detailLink.href = detailHref;
    detailLink.textContent = "상세 정보 보기";
    detailLink.setAttribute("aria-label", `${profile.name} ${detailLink.textContent}`);

    body.append(meta, titleLink, introduction, services, price, detailLink);
    card.append(body);
    return card;
  }

  function syncCategoryTabs() {
    const selectedValue = controls.service.value;
    controls.categoryTabs.forEach((tab) => {
      const selected = tab.dataset.categoryTab === selectedValue;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) controls.results.setAttribute("aria-labelledby", tab.id);
    });
  }

  function createEmptyState() {
    const box = document.createElement("div");
    box.className = "result-state result-state--empty";
    const title = document.createElement("h3");
    title.textContent = "조건에 맞는 업체가 아직 없습니다.";
    const description = document.createElement("p");
    description.textContent = "서비스나 지역 조건을 줄여 다시 찾아보세요.";
    const reset = document.createElement("button");
    reset.className = "button button--secondary";
    reset.type = "button";
    reset.textContent = "초기화";
    reset.addEventListener("click", resetFilters);
    box.append(title, description, reset);
    return box;
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (controls.query.value.trim()) params.set("query", controls.query.value.trim());
    if (controls.service.value !== "all") params.set("service", controls.service.value);
    if (controls.district.value !== "all") params.set("district", controls.district.value);
    if (controls.priceInfo.value !== "all") params.set("price", controls.priceInfo.value);
    history.replaceState(null, "", `${location.pathname}${params.size ? `?${params}` : ""}`);
  }

  function render() {
    controls.results.replaceChildren();
    controls.results.setAttribute("aria-busy", "false");
    controls.summary.textContent = state.filtered.length
      ? `서울 돌잔치 업체 ${state.filtered.length.toLocaleString("ko-KR")}곳`
      : "검색 결과 0곳";
    if (!state.filtered.length) controls.results.append(createEmptyState());
    else state.filtered.forEach((profile) => controls.results.append(createCard(profile)));
    syncCategoryTabs();
    renderChips();
  }

  function applyFilters(updateHistory = true) {
    const query = controls.query.value.trim().toLowerCase();
    state.filtered = profiles.filter((profile) => {
      const serviceMatch = controls.service.value === "all" || profile.serviceCategories.includes(controls.service.value);
      const districtMatch = controls.district.value === "all" || profile.location.district === controls.district.value;
      const priceMatch = controls.priceInfo.value === "all"
        || (controls.priceInfo.value === "published" && profile.products.length > 0)
        || (controls.priceInfo.value === "contact" && profile.products.length === 0);
      return (!query || searchText(profile).includes(query)) && serviceMatch && districtMatch && priceMatch;
    });
    if (updateHistory) updateUrl();
    render();
  }

  function resetFilters(updateHistory = true) {
    controls.query.value = "";
    controls.service.value = "all";
    controls.district.value = "all";
    controls.priceInfo.value = "all";
    applyFilters(updateHistory);
  }

  function readUrl() {
    const params = new URLSearchParams(location.search);
    controls.query.value = params.get("query") || "";
    [
      [controls.service, params.get("service")],
      [controls.district, params.get("district")],
      [controls.priceInfo, params.get("price")]
    ].forEach(([control, value]) => {
      if (value && [...control.options].some((option) => option.value === value)) control.value = value;
    });
  }

  function openFilter(event) {
    filterTrigger = event.currentTarget;
    controls.panel.dataset.open = "true";
    filterTrigger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    controls.query.focus();
  }

  function closeFilter() {
    delete controls.panel.dataset.open;
    filterTrigger?.setAttribute("aria-expanded", "false");
    document.body.style.removeProperty("overflow");
    filterTrigger?.focus();
  }

  function init() {
    if (!controls.form || !controls.results) return;
    setupOptions();
    readUrl();
    $("#directory-heading-count").textContent = `서울 돌잔치 업체 ${profiles.length.toLocaleString("ko-KR")}곳`;
    controls.form.addEventListener("submit", (event) => {
      event.preventDefault();
      applyFilters();
      closeFilter();
    });
    controls.form.addEventListener("reset", (event) => {
      event.preventDefault();
      resetFilters();
    });
    controls.service.addEventListener("change", () => applyFilters());
    controls.categoryTabs.forEach((tab) => tab.addEventListener("click", () => {
      controls.service.value = tab.dataset.categoryTab;
      applyFilters();
    }));
    controls.categoryTabs.forEach((tab, index) => tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + controls.categoryTabs.length) % controls.categoryTabs.length;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % controls.categoryTabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = controls.categoryTabs.length - 1;
      controls.categoryTabs[nextIndex].click();
      controls.categoryTabs[nextIndex].focus();
    }));
    $("[data-filter-open]")?.addEventListener("click", openFilter);
    $("[data-filter-close]")?.addEventListener("click", closeFilter);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && controls.panel.dataset.open === "true") closeFilter();
    });
    applyFilters(false);
  }

  try {
    init();
  } catch (error) {
    console.error("업체 목록을 표시하지 못했습니다.", error);
    controls.results?.replaceChildren(createEmptyState());
    controls.results?.setAttribute("aria-busy", "false");
    if (controls.summary) controls.summary.textContent = "업체 정보를 불러오지 못했습니다.";
  }
})();
