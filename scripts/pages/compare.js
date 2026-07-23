(function () {
  "use strict";

  const store = window.TaranCompareStore;
  const statusApi = window.TaranProviderStatus;
  const placeholderApi = window.SonpumProviderPlaceholder;
  const body = document.getElementById("compare-table-body");
  const empty = document.getElementById("compare-empty");
  const wrap = document.getElementById("compare-table-wrap");
  const summary = document.getElementById("compare-summary");
  const inquiryLink = document.getElementById("compare-inquiry-link");
  const addLink = document.getElementById("compare-add-link");
  const clearButton = document.getElementById("compare-clear");
  const actionNote = document.getElementById("compare-action-note");
  const scrollGuide = document.getElementById("compare-scroll-guide");
  const emptyTitle = document.getElementById("compare-empty-title");
  const emptyDescription = document.getElementById("compare-empty-description");
  const emptyLink = document.getElementById("compare-empty-link");

  const formatWon = (value) => Number(value) > 0 ? `${Number(value).toLocaleString("ko-KR")}원` : "정보 없음";
  const text = (value) => String(value ?? "").trim();
  const label = (value) => value === true || /가능|허용|yes/i.test(text(value)) ? "가능" : value === false || /불가|no/i.test(text(value)) ? "불가" : text(value) || "정보 없음";
  const first = (provider, keys) => {
    for (const key of keys) {
      const value = provider[key] ?? provider.detailFacts?.[key];
      if (text(value)) return value;
    }
    return "";
  };

  function providers() {
    const ids = store.read();
    return ids.map((id) => (window.publicDirectoryData || []).find((item) => String(item.id) === id)).filter((item) => item && statusApi.isProviderPublic(item));
  }

  function searchUrl() {
    const context = window.TaranSearchContext?.resolve?.() || { event: "kids", province: "서울특별시" };
    return window.TaranSearchContext?.venuesUrl?.(context) || "venues.html?event=kids&province=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C";
  }

  function cell(value) {
    const td = document.createElement("td");
    td.textContent = text(value) || "정보 없음";
    return td;
  }

  function row(title, items) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.scope = "row";
    th.textContent = title;
    tr.append(th, ...items.map(cell));
    body.append(tr);
  }

  function headCell(provider) {
    const td = document.createElement("th");
    td.scope = "col";
    const box = document.createElement("div");
    box.className = "compare-provider-head";
    const image = document.createElement("img");
    const requestedImage = provider.imageVerified ? text(provider.image) : "";
    placeholderApi.apply(image, provider, requestedImage);
    const name = document.createElement("strong");
    name.textContent = provider.name;
    const region = document.createElement("span");
    region.textContent = [provider.region, provider.area].filter(Boolean).join(" ");
    const link = document.createElement("a");
    link.className = "button button--secondary";
    link.href = `provider.html?id=${encodeURIComponent(provider.id)}`;
    link.textContent = "상세 보기";
    const replace = document.createElement("button");
    replace.className = "button button--text";
    replace.type = "button";
    replace.textContent = "다른 업체로 교체";
    replace.addEventListener("click", () => {
      store.remove(provider.id);
      location.href = searchUrl();
    });
    const remove = document.createElement("button");
    remove.className = "button button--text compare-remove";
    remove.type = "button";
    remove.textContent = "비교함에서 삭제";
    remove.addEventListener("click", () => { store.remove(provider.id); });
    const actions = document.createElement("div");
    actions.className = "compare-provider-actions";
    actions.append(link, replace, remove);
    box.append(image, name, region, actions);
    td.append(box);
    return td;
  }

  function render() {
    const selectedIds = store.read();
    const selectedCount = selectedIds.length;
    const items = providers();
    const availableCount = items.length;
    const findUrl = searchUrl();
    body.replaceChildren();
    clearButton.hidden = !selectedCount;
    clearButton.textContent = selectedCount ? `${selectedCount}곳 전체 삭제` : "비교함 비우기";
    emptyLink.href = findUrl;
    addLink.href = selectedCount >= store.limit && availableCount ? "#compare-table-wrap" : findUrl;
    addLink.textContent = selectedCount >= store.limit && availableCount
      ? "비교표에서 업체 교체"
      : selectedCount
        ? `${store.limit - selectedCount}곳 더 선택 가능`
        : "비교할 업체 찾기";

    if (!items.length) {
      empty.hidden = false;
      wrap.hidden = true;
      scrollGuide.hidden = true;
      inquiryLink.hidden = true;
      if (selectedCount) {
        summary.textContent = `${selectedCount}/3곳이 저장되어 있지만 현재 비교 가능한 공개 정보는 0곳입니다.`;
        actionNote.textContent = "공개 기준을 충족한 비교 정보가 없어 표를 만들지 않았습니다. 저장 항목을 삭제하고 다른 조건으로 다시 찾아보세요.";
        actionNote.dataset.state = "warning";
        emptyTitle.textContent = "비교 정보를 다시 확인하고 있습니다.";
        emptyDescription.textContent = "저장한 업체의 공개 비교 정보가 현재 제공되지 않습니다. 가짜 값이나 이전 값을 대신 표시하지 않습니다.";
      } else {
        summary.textContent = "0/3곳 선택 · 비교함이 비어 있습니다.";
        actionNote.textContent = "업체 목록에서 최대 3곳을 선택하면 같은 기준의 확인된 값과 정보 없음 상태를 나란히 보여드립니다.";
        actionNote.dataset.state = "empty";
        emptyTitle.textContent = "비교함이 비어 있습니다.";
        emptyDescription.textContent = "업체 목록에서 비교할 곳을 최대 3곳까지 선택해 주세요.";
      }
      return;
    }
    empty.hidden = true;
    wrap.hidden = false;
    scrollGuide.hidden = false;
    summary.textContent = `${selectedCount}/3곳 선택 · ${availableCount}곳을 비교하고 있습니다.`;
    const inquiryProviders = items.filter((item) => statusApi.canReceiveInquiry(item));
    const inquiryReady = Boolean(window.TaranConfig?.isSupabaseConfigured && inquiryProviders.length);
    inquiryLink.hidden = !inquiryReady;
    inquiryLink.href = `inquiry.html?providers=${inquiryProviders.map((item) => encodeURIComponent(item.id)).join(",")}`;
    inquiryLink.textContent = `${inquiryProviders.length}곳에 같은 조건으로 문의`;
    if (!window.TaranConfig?.isSupabaseConfigured) {
      actionNote.textContent = "온라인 문의 연결 상태를 확인할 수 없어 문의 버튼을 표시하지 않습니다. 업체 비교는 계속할 수 있습니다.";
      actionNote.dataset.state = "warning";
    } else if (!inquiryProviders.length) {
      actionNote.textContent = `선택한 ${availableCount}곳은 현재 견적 문의 수신이 확인되지 않았습니다. 비교 정보만 확인해 주세요.`;
      actionNote.dataset.state = "warning";
    } else if (inquiryProviders.length < availableCount) {
      actionNote.textContent = `선택한 ${availableCount}곳 중 문의 수신이 확인된 ${inquiryProviders.length}곳에만 같은 조건을 전달합니다.`;
      actionNote.dataset.state = "ready";
    } else {
      actionNote.textContent = `선택한 ${availableCount}곳 모두 문의 수신이 확인됐습니다. 선택한 업체에만 같은 조건을 전달합니다.`;
      actionNote.dataset.state = "ready";
    }

    const head = document.createElement("tr");
    const corner = document.createElement("th");
    corner.scope = "row";
    corner.textContent = "비교 항목";
    head.append(corner, ...items.map(headCell));
    body.append(head);

    row("업체 유형", items.map((item) => statusApi.getProviderIndustry(item)));
    row("지역", items.map((item) => [item.region, item.area].filter(Boolean).join(" ")));
    row("행사 가능 유형", items.map((item) => (item.eventTags || []).map((tag) => window.SonpumEventTypes?.label?.(tag) || tag).join(", ")));
    row("최소 수용 인원", items.map((item) => statusApi.getProviderFacts(item).minGuests ? `${statusApi.getProviderFacts(item).minGuests}명` : ""));
    row("최대 수용 인원", items.map((item) => statusApi.getProviderFacts(item).maxGuests ? `${statusApi.getProviderFacts(item).maxGuests}명` : ""));
    row("최소 보증 인원", items.map((item) => statusApi.getProviderFacts(item).guarantee ? `${statusApi.getProviderFacts(item).guarantee}명` : ""));
    row("성인 식대", items.map((item) => statusApi.shouldShowVolatileFacts(item) ? formatWon(statusApi.getProviderFacts(item).adultMealMin) : "최근 조건 확인 필요"));
    row("어린이 식대", items.map((item) => statusApi.shouldShowVolatileFacts(item) ? first(item, ["어린이 식대", "소인 식대"]) : "최근 조건 확인 필요"));
    row("기본 대관료", items.map((item) => statusApi.shouldShowVolatileFacts(item) ? formatWon(statusApi.getProviderFacts(item).rentalFee || item.price) : "최근 조건 확인 필요"));
    row("주차", items.map((item) => first(item, ["주차", "주차 정보", "parking"]) || (statusApi.getProviderFacts(item).parking ? `${statusApi.getProviderFacts(item).parking}대` : "")));
    row("단독 공간", items.map((item) => label(first(item, ["단독 공간", "privateSpace"]))));
    row("외부 음식", items.map((item) => label(first(item, ["외부 음식", "외부 음식 허용 여부", "outsideFood"]))));
    row("외부 업체", items.map((item) => label(first(item, ["외부 업체", "외부 업체 이용 가능 여부", "outsideVendor"]))));
    row("외부 촬영", items.map((item) => label(first(item, ["외부 촬영", "촬영 업체 반입", "outsidePhotography"]))));
    row("휠체어 접근", items.map((item) => label(first(item, ["휠체어 접근", "접근 편의", "wheelchairAccess"]))));
    row("취소·환불", items.map((item) => first(item, ["취소·환불", "취소 환불", "cancellationPolicy"])));
    row("정보 상태", items.map((item) => statusApi.getProviderFreshness(item).label));
    row("정보 확인일", items.map((item) => statusApi.getProviderFreshness(item).date || "미등록"));
    row("견적 문의", items.map((item) => statusApi.canReceiveInquiry(item) ? "문의 수신 확인" : "현재 견적 문의를 받지 않아요"));
  }

  clearButton.addEventListener("click", () => {
    if (!store.read().length) return;
    if (window.confirm("비교함에 저장한 업체를 모두 삭제할까요?")) store.clear();
  });
  store.subscribe(render);
})();
