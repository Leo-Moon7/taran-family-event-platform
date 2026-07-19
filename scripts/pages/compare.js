(function () {
  "use strict";

  const store = window.TaranCompareStore;
  const statusApi = window.TaranProviderStatus;
  const body = document.getElementById("compare-table-body");
  const empty = document.getElementById("compare-empty");
  const wrap = document.getElementById("compare-table-wrap");
  const summary = document.getElementById("compare-summary");
  const inquiryLink = document.getElementById("compare-inquiry-link");

  const formatWon = (value) => Number(value) > 0 ? `${Number(value).toLocaleString("ko-KR")}원` : "업체 문의";
  const text = (value) => String(value ?? "").trim();
  const label = (value) => value === true || /가능|허용|yes/i.test(text(value)) ? "가능" : value === false || /불가|no/i.test(text(value)) ? "불가" : text(value) || "업체 문의";
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

  function cell(value) {
    const td = document.createElement("td");
    td.textContent = text(value) || "업체 문의";
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
    const td = document.createElement("td");
    const box = document.createElement("div");
    box.className = "compare-provider-head";
    const image = document.createElement("img");
    image.src = text(provider.image) || "assets/images/venue-partyroom.webp";
    image.alt = provider.imageVerified ? `${provider.name} 대표 이미지` : "업체 유형 참고 이미지";
    image.addEventListener("error", () => { image.src = "assets/images/venue-partyroom.webp"; }, { once: true });
    const status = document.createElement("span");
    status.className = `badge badge--${statusApi.getProviderStatus(provider).key}`;
    status.textContent = statusApi.getProviderStatusLabel(provider);
    const name = document.createElement("strong");
    name.textContent = provider.name;
    const region = document.createElement("span");
    region.textContent = [provider.region, provider.area].filter(Boolean).join(" ");
    const link = document.createElement("a");
    link.className = "button button--secondary";
    link.href = `provider.html?id=${encodeURIComponent(provider.id)}`;
    link.textContent = "상세 보기";
    const remove = document.createElement("button");
    remove.className = "button button--text";
    remove.type = "button";
    remove.textContent = "비교함에서 빼기";
    remove.addEventListener("click", () => { store.remove(provider.id); render(); });
    box.append(image, status, name, region, link, remove);
    td.append(box);
    return td;
  }

  function render() {
    const items = providers();
    body.replaceChildren();
    if (!items.length) {
      empty.hidden = false;
      wrap.hidden = true;
      inquiryLink.hidden = true;
      summary.textContent = "비교할 업체가 없습니다.";
      return;
    }
    empty.hidden = true;
    wrap.hidden = false;
    summary.textContent = `${items.length}곳을 비교하고 있습니다.`;
    const inquiryProviders = items.filter((item) => statusApi.canReceiveInquiry(item));
    inquiryLink.hidden = !window.TaranConfig?.isSupabaseConfigured || !inquiryProviders.length;
    inquiryLink.href = `inquiry.html?providers=${inquiryProviders.map((item) => encodeURIComponent(item.id)).join(",")}`;

    const head = document.createElement("tr");
    const corner = document.createElement("th");
    corner.scope = "row";
    corner.textContent = "비교 항목";
    head.append(corner, ...items.map(headCell));
    body.append(head);

    row("업체 유형", items.map((item) => statusApi.getProviderIndustry(item)));
    row("행사 가능 유형", items.map((item) => (item.eventTags || []).map((tag) => ({ kids: "돌잔치·백일", parents: "환갑·칠순", wedding: "상견례·결혼식", home: "가족모임" })[tag] || tag).join(", ")));
    row("최소 수용 인원", items.map((item) => statusApi.getProviderFacts(item).minGuests ? `${statusApi.getProviderFacts(item).minGuests}명` : ""));
    row("최대 수용 인원", items.map((item) => statusApi.getProviderFacts(item).maxGuests ? `${statusApi.getProviderFacts(item).maxGuests}명` : ""));
    row("최소 보증 인원", items.map((item) => statusApi.getProviderFacts(item).guarantee ? `${statusApi.getProviderFacts(item).guarantee}명` : ""));
    row("성인 식대", items.map((item) => formatWon(statusApi.getProviderFacts(item).adultMealMin)));
    row("기본 대관료", items.map((item) => formatWon(statusApi.getProviderFacts(item).rentalFee || item.price)));
    row("주차", items.map((item) => first(item, ["주차", "주차 정보", "parking"]) || (statusApi.getProviderFacts(item).parking ? `${statusApi.getProviderFacts(item).parking}대` : "")));
    row("단독 공간", items.map((item) => label(first(item, ["단독 공간", "privateSpace"]))));
    row("외부 음식", items.map((item) => label(first(item, ["외부 음식", "외부 음식 허용 여부", "outsideFood"]))));
    row("외부 업체", items.map((item) => label(first(item, ["외부 업체", "외부 업체 이용 가능 여부", "outsideVendor"]))));
    row("취소·환불", items.map((item) => first(item, ["취소·환불", "취소 환불", "cancellationPolicy"])));
    row("정보 상태", items.map((item) => statusApi.getProviderFreshness(item).label));
  }

  render();
  store.subscribe(render);
})();
