(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const providerId = params.get("id");
  let provider = null;
  const EVENT_LABELS = { wedding: "결혼 준비", kids: "아이 행사", parents: "부모님 행사", home: "가족 모임" };
  const UNKNOWN_PATTERN = /확인\s*(필요|예정|중)|상담\s*시|문의|미정|미확인|준비\s*중|안내\s*예정|^[-–—]$/;

  const byId = (id) => document.getElementById(id);
  const text = (element, value) => { if (element) element.textContent = String(value ?? ""); };
  const safeText = (value) => {
    const result = String(value ?? "").trim();
    return result && !UNKNOWN_PATTERN.test(result) ? result : "";
  };
  const safeUrl = (value, allowedHosts) => {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) return "";
      if (allowedHosts && !allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) return "";
      return url.href;
    } catch (_error) { return ""; }
  };
  const readJson = (name, fallback) => {
    try { return JSON.parse(window.TaranStorage.get(name, JSON.stringify(fallback))); }
    catch (_error) { return fallback; }
  };
  const writeJson = (name, value) => window.TaranStorage.set(name, JSON.stringify(value));
  const formatWon = (value) => `${Number(value).toLocaleString('ko-KR')}원`;
  const formatDate = (value) => String(value || "").replaceAll("-", ".");

  function firstFact(facts, labels) {
    for (const label of labels) {
      const value = safeText(facts[label]);
      if (value) return value;
    }
    return "";
  }

  function addDefinition(list, label, value) {
    if (!list || !safeText(value)) return;
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    wrapper.append(term, description);
    list.append(wrapper);
  }

  function addDataRow(list, label, value) {
    if (!list || !safeText(value)) return;
    const row = document.createElement("div");
    const title = document.createElement("strong");
    const content = document.createElement("p");
    title.textContent = label;
    content.textContent = value;
    row.append(title, content);
    list.append(row);
  }

  function hideSection(id) {
    byId(id)?.setAttribute("hidden", "");
    document.querySelector(`[data-section-link="${id}"]`)?.setAttribute("hidden", "");
  }

  function renderTags(item) {
    const container = byId("provider-tags");
    const labels = (item.eventTags || []).map((tag) => EVENT_LABELS[tag]).filter(Boolean);
    [...new Set(labels)].forEach((label) => {
      const tag = document.createElement("span");
      tag.className = "badge";
      tag.textContent = label;
      container.append(tag);
    });
  }

  function renderFacts(item) {
    const facts = item.detailFacts || {};
    const official = item.officialVerification || {};
    const list = byId("provider-facts");
    const address = firstFact(facts, ["도로명 주소", "주소"]) || safeText(official.roadAddress) || safeText(official.address);
    const price = Number(item.price) > 0 ? `${safeText(item.priceLabel) || "기본 가격"} ${formatWon(item.price)}` : firstFact(facts, ["가격", "가격 안내", "예상가", "대관료", "시간당 대관료", "성인 식대", "패키지 가격"]);
    const minimum = firstFact(facts, ["최소 수용인원", "최소 인원", "기준 인원"]);
    const maximum = firstFact(facts, ["최대 수용인원", "최대 인원", "수용 인원"]);
    const guarantee = firstFact(facts, ["최소 보증 인원", "보증 인원", "최소 주문 인원"]);
    const parking = firstFact(facts, ["주차 가능 대수", "주차", "주차 정보"]);
    const food = firstFact(facts, ["식사 구성", "식대", "메뉴"]);
    const space = firstFact(facts, ["공간/서비스", "공간·서비스", "룸·좌석", "공간 유형"]) || safeText(item.subcategory);

    addDefinition(list, "업종", firstFact(facts, ["업종"]) || safeText(official.category));
    addDefinition(list, "주소", address);
    addDefinition(list, "공간·서비스", space);
    addDefinition(list, "적정 인원", firstFact(facts, ["적정 인원", "권장 인원"]));
    addDefinition(list, "최소 인원", minimum);
    addDefinition(list, "최대 인원", maximum);
    addDefinition(list, "최소 보증 인원", guarantee);
    addDefinition(list, "가격", price);
    addDefinition(list, "식사", food);
    addDefinition(list, "주차", parking);
    addDefinition(list, "문의 가능 시간", firstFact(facts, ["문의 가능 시간", "영업시간"]));

    if (!list.children.length) {
      const empty = document.createElement("p");
      empty.className = "provider-inline-empty";
      empty.textContent = "현재 공개된 기본 정보는 업체명과 행사 유형입니다.";
      list.replaceWith(empty);
    }
    return { address, price };
  }

  function renderOptionalSections(item) {
    const facts = item.detailFacts || {};
    const priceList = byId("provider-price-list");
    const priceEntries = [
      ["대관료", firstFact(facts, ["대관료", "시간당 대관료"])], ["성인 식대", firstFact(facts, ["성인 식대", "식대"])],
      ["어린이 식대", firstFact(facts, ["어린이 식대", "소인 식대"])], ["패키지", firstFact(facts, ["패키지 가격", "가격 안내"])],
      ["포함 항목", firstFact(facts, ["포함 항목", "상품 구성"])]
    ];
    priceEntries.forEach(([label, value]) => addDataRow(priceList, label, value));
    if (Number(item.price) > 0) addDataRow(priceList, safeText(item.priceLabel) || "기본 가격", formatWon(item.price));
    if (priceList.children.length) byId("provider-pricing").hidden = false; else hideSection("provider-pricing");

    const facilityList = byId("provider-facility-list");
    [
      ["주차", firstFact(facts, ["주차", "주차 정보", "주차 가능 대수"])], ["외부 음식", firstFact(facts, ["외부 음식", "음식 반입"])],
      ["외부 업체", firstFact(facts, ["외부 업체", "외부 업체 이용", "돌상 반입"])], ["접근 편의", firstFact(facts, ["접근 편의", "엘리베이터", "어르신 동선"])],
      ["대관 시간", firstFact(facts, ["대관 시간", "이용 시간"])], ["우천 대안", firstFact(facts, ["우천 대안"])]
    ].forEach(([label, value]) => addDefinition(facilityList, label, value));
    if (facilityList.children.length) byId("provider-facilities").hidden = false; else hideSection("provider-facilities");

    const policyList = byId("provider-policy-list");
    [["취소·환불", firstFact(facts, ["취소·환불", "취소 규정", "환불 규정"])], ["예약 변경", firstFact(facts, ["예약 변경", "변경 규정"])]].forEach(([label, value]) => addDataRow(policyList, label, value));
    if (policyList.children.length) {
      byId("provider-policy").hidden = false;
    } else {
      const notice = document.createElement("p");
      notice.className = "provider-inline-empty";
      notice.textContent = "취소·환불 조건은 예약 전에 업체에 확인해 주세요.";
      policyList.append(notice);
      byId("provider-policy").hidden = false;
    }
  }

  function createReviewCard(review, external) {
    const card = document.createElement("article");
    card.className = "provider-review-card";
    const meta = document.createElement("div");
    meta.className = "provider-review-card__meta";
    const source = document.createElement("span");
    source.textContent = external ? "외부 블로그" : `${review.rating}점 · ${review.name || "따란 사용자"}`;
    const date = document.createElement("time");
    date.textContent = formatDate(review.publishedDate || review.createdAt);
    meta.append(source, date);
    const content = document.createElement(external ? "h3" : "p");
    content.textContent = external ? (review.title || "후기 보기") : review.content;
    card.append(meta, content);
    if (external) {
      const href = safeUrl(review.url, ["naver.com", "naver.me"]);
      if (href) { const link = document.createElement("a"); link.className = "text-link"; link.href = href; link.target = "_blank"; link.rel = "noopener noreferrer nofollow"; link.textContent = "원문 보기 →"; card.append(link); }
    }
    return card;
  }

  async function renderReviews(item) {
    const saved = readJson("provider-reviews", []);
    const bundledInternal = Array.isArray(item.internalReviews)
      ? item.internalReviews
      : (Array.isArray(item.reviews) ? item.reviews : []);
    let onlineInternal = [];
    if (window.TaranConfig?.isSupabaseConfigured) {
      try {
        const rows = await window.TaranApi.select(window.TaranConfig.tables.reviews, { provider_id: `eq.${item.id}`, status: "eq.published", order: "created_at.desc" });
        onlineInternal = rows.map(review => ({ rating: review.rating, name: review.author_name, content: review.content, createdAt: review.created_at }));
      } catch (error) { console.warn("공개 후기를 불러오지 못했습니다.", error); }
    }
    const localInternal = window.TaranConfig?.isSupabaseConfigured ? [] : saved.filter((review) => review.providerId === item.id);
    const internal = [...bundledInternal, ...onlineInternal, ...localInternal];
    const external = Array.isArray(item.externalReviews) ? item.externalReviews : [];
    const internalList = byId("provider-internal-review-list");
    const externalList = byId("provider-external-review-list");
    text(byId("provider-internal-tab-count"), internal.length);
    text(byId("provider-internal-review-count"), internal.length);
    text(byId("provider-external-review-count"), external.length);

    if (internal.length) {
      internal.forEach((review) => internalList.append(createReviewCard(review, false)));
      const average = internal.reduce((sum, review) => sum + Number(review.rating || 0), 0) / internal.length;
      text(byId("provider-rating"), average.toFixed(1));
      byId("provider-rating-summary").hidden = false;
    } else {
      const empty = document.createElement("p"); empty.className = "provider-inline-empty"; empty.textContent = "아직 등록된 따란 후기가 없습니다."; internalList.append(empty);
    }
    if (external.length) external.forEach((review) => externalList.append(createReviewCard(review, true)));
    else { const empty = document.createElement("p"); empty.className = "provider-inline-empty"; empty.textContent = "연결된 외부 후기가 없습니다."; externalList.append(empty); }
  }

  function setupReviewTabs() {
    document.querySelectorAll("[data-review-tab]").forEach((button) => button.addEventListener("click", () => {
      const selected = button.dataset.reviewTab;
      document.querySelectorAll("[data-review-tab]").forEach((tab) => { const active = tab === button; tab.classList.toggle("is-active", active); tab.setAttribute("aria-selected", String(active)); });
      byId("internal-review-panel").hidden = selected !== "internal";
      byId("external-review-panel").hidden = selected !== "external";
    }));
  }

  function setupReviewForm(item) {
    const form = byId("provider-review-form");
    if (window.TaranConfig?.isSupabaseConfigured && !window.TaranAuth?.getAccount()) {
      const status = document.querySelector("[data-review-status]");
      if (status) status.textContent = "로그인 후 후기를 등록할 수 있습니다.";
    }
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const rating = Number(formData.get("rating"));
      const name = String(formData.get("name") || "").trim();
      const content = String(formData.get("content") || "").trim();
      if (!rating || !name || content.length < 10) {
        text(document.querySelector("[data-review-status]"), "평점과 표시 이름, 10자 이상의 이용 경험을 입력해 주세요.");
        return;
      }
      const button = form.querySelector("button[type=submit]");
      if (button) button.disabled = true;
      try {
        if (window.TaranConfig?.isSupabaseConfigured) {
          const account = await window.TaranAuth.ready;
          if (!account) {
            window.location.href = window.TaranAuth.loginUrl(`provider.html?id=${encodeURIComponent(item.id)}#provider-reviews`);
            return;
          }
          await window.TaranApi.upsert(window.TaranConfig.tables.reviews, {
            provider_id: item.id, user_id: account.id, rating, author_name: name, content, status: "pending"
          });
          text(document.querySelector("[data-review-status]"), "후기가 접수되었습니다. 운영자 확인 후 공개됩니다.");
        } else {
          const reviews = readJson("provider-reviews", []);
          reviews.unshift({ providerId: item.id, rating, name, content, createdAt: new Date().toISOString().slice(0, 10) });
          writeJson("provider-reviews", reviews.slice(0, 200));
          text(document.querySelector("[data-review-status]"), "미리보기 브라우저에 후기가 저장되었습니다.");
        }
        form.reset();
      } catch (error) {
        text(document.querySelector("[data-review-status]"), error.message || "후기를 접수하지 못했습니다.");
      } finally { if (button) button.disabled = false; }
    });
  }

  function setupSaveActions(item) {
    const status = document.querySelector("[data-provider-action-status]");
    const saveTo = (key, label) => {
      const values = readJson(key, []);
      if (!values.includes(item.id)) values.push(item.id);
      writeJson(key, values);
      text(status, label);
      window.TaranToast?.show(label);
    };
    document.querySelector("[data-save-provider]")?.addEventListener("click", async () => {
      if (window.TaranConfig?.isSupabaseConfigured) {
        const account = await window.TaranAuth.ready;
        if (!account) { window.location.href = window.TaranAuth.loginUrl(`provider.html?id=${encodeURIComponent(item.id)}`); return; }
        await window.TaranAuth.api(`/api/member/saved-venues/${encodeURIComponent(item.id)}`, { method: "PUT" });
        text(status, "관심 업체에 저장했습니다.");
        window.TaranToast?.show("관심 업체에 저장했습니다.");
      } else saveTo("saved-providers", "관심 업체에 저장했습니다.");
    });
    document.querySelector("[data-compare-provider]")?.addEventListener("click", () => saveTo("compare-providers", "비교함에 담았습니다."));
  }

  function setupInquiry(item) {
    const trigger = document.querySelector("[data-inquiry-provider]");
    const dialog = byId("provider-inquiry-dialog");
    const form = byId("provider-inquiry-form");
    if (!trigger || !dialog || !form || !window.TaranConfig?.isSupabaseConfigured) return;
    trigger.hidden = false;
    document.querySelector("[data-inquiry-close]")?.addEventListener("click", () => dialog.close());
    trigger.addEventListener("click", async () => {
      const account = await window.TaranAuth.ready;
      if (!account) {
        window.location.href = window.TaranAuth.loginUrl(`provider.html?id=${encodeURIComponent(item.id)}`);
        return;
      }
      form.elements.name.value = account.display_name || "";
      form.elements.region.value = [item.region, item.area].filter(Boolean).join(" ");
      const firstEvent = (item.eventTags || [])[0];
      if (firstEvent && EVENT_LABELS[firstEvent]) form.elements.eventType.value = firstEvent;
      dialog.showModal();
      form.elements.eventType.focus();
      window.TaranApi.rpc("taran_track_event", { p_event_name: "inquiry_started", p_page_path: "provider.html", p_metadata: {} }).catch(() => {});
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = document.querySelector("[data-inquiry-status]");
      const button = form.querySelector("button[type=submit]");
      const values = new FormData(form);
      const account = await window.TaranAuth.ready;
      if (!account) return;
      if (!values.get("consent")) { text(status, "개인정보 제공 동의가 필요합니다."); return; }
      button.disabled = true;
      text(status, "접수 중입니다.");
      try {
        await window.TaranApi.upsert(window.TaranConfig.tables.inquiries, {
          user_id: account.id,
          provider_id: item.id,
          provider_name: item.name,
          event_type: String(values.get("eventType") || ""),
          region: String(values.get("region") || "").trim(),
          guests: Number(values.get("guests")),
          budget: String(values.get("budget") || "").trim(),
          contact: { name: String(values.get("name") || "").trim(), phone: String(values.get("phone") || "").trim(), email: account.email || "" },
          details: { note: String(values.get("note") || "").trim(), consentedAt: new Date().toISOString() },
          status: "pending"
        });
        window.TaranApi.rpc("taran_track_event", { p_event_name: "inquiry_submitted", p_page_path: "provider.html", p_metadata: {} }).catch(() => {});
        form.reset();
        dialog.close();
        window.TaranToast?.show("견적 문의를 접수했습니다.");
      } catch (error) {
        text(status, error.message || "견적 문의를 접수하지 못했습니다.");
      } finally { button.disabled = false; }
    });
  }

  function renderLocation(item, address) {
    if (!address) { hideSection("provider-location"); return; }
    byId("provider-location").hidden = false;
    text(byId("provider-location-address"), address);
    const mapLink = byId("provider-map-link");
    mapLink.href = `https://map.naver.com/p/search/${encodeURIComponent(item.name + " " + address)}`;
    mapLink.hidden = false;
  }

  async function renderProvider() {
    await Promise.resolve(window.taranContentReady);
    provider = (window.publicDirectoryData || []).find((item) => item.id === providerId);
    if (!provider) { document.querySelectorAll(".provider-page > :not(#provider-not-found)").forEach((element) => { element.hidden = true; }); byId("provider-not-found").hidden = false; return; }
    const facts = provider.detailFacts || {};
    const official = provider.officialVerification || {};
    const brandName = window.PlatformBrand?.nameKo || "따란";
    document.title = `${provider.name} | ${brandName}`;
    text(byId("provider-name"), provider.name);
    text(byId("provider-category"), [provider.category, provider.subcategory].filter(Boolean).join(" · "));
    const verification = byId("provider-verification");
    const isVerified = Boolean(provider.verifiedAt || official.status === "verified");
    text(verification, isVerified ? "정보 확인" : "기본 정보");
    verification?.classList.toggle("badge--verified", isVerified);
    text(byId("provider-verified-date"), provider.verifiedAt ? `정보 확인 ${formatDate(provider.verifiedAt)}` : "");
    const address = firstFact(facts, ["도로명 주소", "주소"]) || safeText(official.roadAddress) || safeText(official.address) || [provider.region, provider.area].filter(Boolean).join(" ");
    text(byId("provider-address"), address);
    const claimLink = byId("provider-claim-link");
    if (claimLink) claimLink.href = `claim.html?id=${encodeURIComponent(provider.id)}`;
    const image = byId("provider-image");
    image.src = safeUrl(provider.image) || (/^(?:assets\/|\.\/|\/)/.test(provider.image || "") ? provider.image : "assets/images/venue-partyroom.webp");
    image.alt = provider.imageVerified ? `${provider.name} 대표 이미지` : "";
    image.addEventListener("error", () => {
      image.src = "assets/images/venue-partyroom.webp";
      image.alt = "";
      byId("provider-image-note").hidden = false;
    }, { once: true });
    byId("provider-image-note").hidden = Boolean(provider.imageVerified);
    renderTags(provider);
    const rendered = renderFacts(provider);
    renderOptionalSections(provider);
    await window.TaranAuth?.ready;
    await renderReviews(provider);
    setupReviewTabs();
    setupReviewForm(provider);
    setupSaveActions(provider);
    setupInquiry(provider);
    renderLocation(provider, rendered.address || address);

    const officialHref = safeUrl(provider.officialLink || official.link);
    if (officialHref) { const link = byId("provider-official-link"); link.href = officialHref; link.hidden = false; }
    const phone = safeText(official.telephone || facts["전화"]);
    if (phone && /^[0-9+()\-\s]+$/.test(phone)) { const link = byId("provider-phone-link"); link.href = `tel:${phone.replace(/[^0-9+]/g, "")}`; link.hidden = false; }
  }

  renderProvider().catch(error => console.error("업체 상세 정보를 표시하지 못했습니다.", error));
})();
