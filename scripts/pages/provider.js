(function () {
  "use strict";

  const id = new URLSearchParams(location.search).get("id");
  const customerProfile = (Array.isArray(window.customerProviderProfiles) ? window.customerProviderProfiles : [])
    .find((item) => String(item.id) === String(id) && item.displayGate === "customer_ready");
  const legacyProvider = (window.publicDirectoryData || []).find((item) => String(item.id) === String(id));
  const provider = customerProfile || legacyProvider;
  const isCustomerReady = Boolean(customerProfile);
  const statusApi = window.TaranProviderStatus;
  const store = window.TaranCompareStore;
  const placeholderApi = window.SonpumProviderPlaceholder;
  const $ = (selector) => document.querySelector(selector);
  const text = (value) => String(value ?? "").trim();
  const unknown = /확인 필요|상담 시 안내|미정|준비 중|^-$/;
  const safe = (value) => {
    const result = text(value);
    return result && !unknown.test(result) ? result : "";
  };
  const eventLabels = window.SonpumEventTypes?.labels || { kids: "아이 행사", parents: "부모님 행사", meeting: "상견례", smallWedding: "소규모 결혼식", familyGathering: "가족 모임" };
  const robotsMeta = $('meta[name="robots"]');
  let publishedInternalReviews = [];
  let copyFeedbackTimer = 0;

  const customerServiceLabels = Object.freeze({
    "돌잔치 가족 모임": "돌잔치",
    "중식 코스": "중식",
    "프라이빗 룸": "프라이빗 룸",
    "아이 첫 생일 행사": "돌잔치",
    "프라이빗 다이닝": "다이닝",
    "행사 스타일링과 메뉴": "행사 스타일링",
    "돌잔치 가족연회": "돌잔치",
    "한우 숯불구이": "한우",
    "한옥 돌잔치": "한옥 돌잔치",
    "돌사진": "돌사진",
    "돌스냅": "돌스냅",
    "웨딩 한복스냅": "한복스냅",
    "돌촬영": "돌촬영",
    "한복 연계": "한복",
    "헤어·메이크업 연계": "헤어·메이크업",
    "가족사진": "가족사진"
  });

  if (robotsMeta) robotsMeta.content = isCustomerReady || !provider ? "noindex,nofollow" : "index,follow";

  function formatDate(value) {
    const match = text(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? `${match[1]}.${match[2]}.${match[3]}` : text(value);
  }

  function formatWon(value) {
    return `${Number(value).toLocaleString("ko-KR")}원`;
  }

  function formatProductPrice(product) {
    const minimum = Number(product?.priceMin);
    const maximum = Number(product?.priceMax);
    if (!minimum) return "";
    return maximum > minimum ? `${formatWon(minimum)}~${formatWon(maximum)}` : formatWon(minimum);
  }

  function safeUrl(value, protocols = ["http:", "https:"]) {
    try {
      const url = new URL(value, location.href);
      return protocols.includes(url.protocol) ? url.href : "";
    } catch (_error) {
      return "";
    }
  }

  function correctionHref(item) {
    const params = new URLSearchParams({
      type: "information-error",
      providerId: text(item.id),
      providerName: text(item.name)
    });
    return `contact.html?${params}`;
  }

  function addFact(target, label, value) {
    if (!safe(value)) return;
    const box = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    box.append(dt, dd);
    target.append(box);
  }

  function first(keys) {
    for (const key of keys) {
      const value = legacyProvider?.[key] ?? legacyProvider?.detailFacts?.[key];
      if (safe(value)) return safe(value);
    }
    return "";
  }

  function won(value) {
    return Number(value) > 0 ? formatWon(value) : "";
  }

  function setAnchorLinks(items) {
    const nav = $("#provider-anchor-nav");
    nav.replaceChildren();
    items.forEach(([href, label]) => {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      nav.append(link);
    });
    nav.hidden = false;
  }

  function customerQuestions(profile) {
    if (profile.serviceCategories.includes("돌사진·스튜디오")) {
      return [
        "원하는 날짜와 시간에 촬영을 예약할 수 있는지",
        "촬영 상품에 포함된 컷 수와 원본·보정본 제공 범위는 무엇인지",
        "한복과 헤어·메이크업 비용이 포함되는지",
        "가족사진과 형제자매 촬영에 추가 비용이 있는지",
        "촬영 시간과 결과물을 받는 데 걸리는 기간은 얼마인지",
        "일정 변경과 취소·환불 기준은 어떻게 되는지"
      ];
    }
    return [
      "원하는 날짜와 인원으로 예약할 수 있는지",
      "메뉴·공간·돌상 구성과 추가 비용은 무엇인지",
      "프라이빗 룸 이용 조건과 최소 주문 인원은 어떻게 되는지",
      "아기 의자와 수유·기저귀 교환 공간을 이용할 수 있는지",
      "주차 가능 대수와 무료 주차 시간은 어떻게 되는지",
      "예약 변경과 취소·환불 기준은 어떻게 되는지"
    ];
  }

  function renderCustomerProducts(profile) {
    const list = $("#provider-product-list");
    const empty = $("#provider-price-empty");
    const title = $("#provider-products-title");
    const description = $("#provider-products-description");
    list.replaceChildren();
    if (!profile.products.length) {
      title.textContent = "가격 안내";
      description.textContent = "등록된 가격 정보가 없습니다. 돌잔치 전체 비용은 업체에 문의해 주세요.";
      empty.hidden = false;
      return;
    }
    title.textContent = "참고 메뉴 가격";
    const lead = document.createElement("strong");
    lead.textContent = "아래 금액은 성인 1인 코스 가격입니다.";
    const detail = document.createElement("span");
    detail.textContent = " 돌잔치 행사 구성, 룸 이용 조건 및 추가 비용은 업체에 별도로 문의해 주세요.";
    description.replaceChildren(lead, detail);
    empty.hidden = true;
    profile.products.forEach((product) => {
      const card = document.createElement("article");
      card.className = "provider-product-card";
      const heading = document.createElement("div");
      heading.className = "provider-product-card__heading";
      const title = document.createElement("h3");
      title.textContent = product.name;
      const price = document.createElement("strong");
      price.textContent = formatProductPrice(product);
      heading.append(title, price);

      const unit = document.createElement("p");
      unit.className = "provider-product-card__unit";
      unit.textContent = `${product.unit} · ${formatDate(product.checkedAt)} 확인`;
      card.append(heading, unit);

      if (product.includedItems.length) {
        const includedTitle = document.createElement("strong");
        includedTitle.className = "provider-product-card__label";
        includedTitle.textContent = "포함 항목";
        const included = document.createElement("ul");
        included.className = "provider-product-card__included";
        product.includedItems.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          included.append(li);
        });
        card.append(includedTitle, included);
      }

      const conditionsTitle = document.createElement("strong");
      conditionsTitle.className = "provider-product-card__label";
      conditionsTitle.textContent = "이용 조건";
      const conditions = document.createElement("ul");
      conditions.className = "provider-product-card__conditions";
      product.conditions.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        conditions.append(li);
      });
      card.append(conditionsTitle, conditions);
      list.append(card);
    });
  }

  function renderCustomerProfile() {
    document.body.classList.add("provider-page--customer");
    document.title = `${customerProfile.name} | 손품해방`;
    const description = $('meta[name="description"]');
    if (description) description.content = `${customerProfile.name}의 서비스, 위치, 상품 가격과 공식 연락 정보를 확인하세요.`;
    if (robotsMeta) robotsMeta.content = "noindex,nofollow";

    $("#provider-legacy-sections").hidden = true;
    $("#provider-customer-sections").hidden = false;
    $("#provider-status-line").hidden = true;
    $("#provider-claim").hidden = true;

    const image = $("#provider-image");
    image.removeAttribute("src");
    image.hidden = true;
    image.alt = "";
    $("#provider-image-empty").hidden = false;
    $("#provider-image-note").hidden = true;

    $("#provider-category").textContent = customerProfile.serviceCategories.join(" · ");
    $("#provider-name").textContent = customerProfile.name;
    $("#provider-address").textContent = `서울 ${customerProfile.location.district}`;
    $("#provider-introduction").hidden = false;
    $("#provider-introduction").textContent = customerProfile.introduction;

    const heroFacts = $("#provider-hero-facts");
    heroFacts.replaceChildren();
    addFact(heroFacts, "주소", customerProfile.location.address);
    addFact(heroFacts, "서비스", customerProfile.services.join(" · "));
    addFact(heroFacts, "이용 방식", customerProfile.serviceMode === "visit" ? "매장 방문" : "업체 문의");
    addFact(heroFacts, "가격", customerProfile.products.length ? "공식 메뉴·코스 가격은 아래에서 확인" : "업체 문의");
    heroFacts.hidden = false;

    const tags = $("#provider-tags");
    tags.replaceChildren();
    customerProfile.services.slice(0, 4).forEach((service) => {
      const chip = document.createElement("span");
      chip.className = "badge";
      chip.textContent = customerServiceLabels[service] || service;
      tags.append(chip);
    });

    const actions = $("#provider-actions");
    actions.hidden = false;
    $("#provider-inquiry-link").hidden = true;
    $("#provider-compare").hidden = true;
    $("#provider-save").hidden = true;
    const phone = $("#provider-phone");
    phone.hidden = !customerProfile.contact.telephone?.href;
    if (!phone.hidden) {
      phone.href = customerProfile.contact.telephone.href;
      phone.textContent = `전화 문의 ${customerProfile.contact.telephone.display}`;
    }
    const firstOfficial = customerProfile.contact.officialLinks.find((link) => safeUrl(link.url, ["https:"]));
    const official = $("#provider-official");
    official.hidden = !firstOfficial;
    if (firstOfficial) {
      official.href = firstOfficial.url;
      official.textContent = "공식 홈페이지에서 확인";
    }

    setAnchorLinks([
      ["#provider-products", customerProfile.products.length ? "참고 메뉴 가격" : "가격 안내"],
      ["#provider-before-use", "이용 전 확인"],
      ["#provider-contact", "위치·연락처"]
    ]);

    renderCustomerProducts(customerProfile);

    const questions = customerQuestions(customerProfile);
    const questionList = $("#provider-contact-questions");
    questionList.replaceChildren();
    questions.forEach((question) => {
      const item = document.createElement("li");
      item.textContent = question;
      questionList.append(item);
    });

    const contactFacts = $("#provider-contact-facts");
    contactFacts.replaceChildren();
    addFact(contactFacts, "주소", customerProfile.location.address);
    addFact(contactFacts, "전화", customerProfile.contact.telephone.display);
    addFact(contactFacts, "정보 업데이트", formatDate(customerProfile.updatedAt));

    const officialLinks = $("#provider-official-links");
    officialLinks.replaceChildren();
    customerProfile.contact.officialLinks.forEach((item) => {
      const url = safeUrl(item.url, ["https:"]);
      if (!url) return;
      const link = document.createElement("a");
      link.className = "button button--secondary";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = item.kind === "portfolio"
        ? "공식 포트폴리오"
        : (item.kind === "document"
          ? "공식 상품 안내"
          : (item.kind === "contact" ? "공식 문의 안내" : "공식 홈페이지에서 확인"));
      officialLinks.append(link);
    });

    $("#provider-information-updated").textContent = `정보 업데이트: ${formatDate(customerProfile.updatedAt)}`;
    $("#provider-correction").href = correctionHref(customerProfile);
    $("#provider-customer-claim").href = `claim.html?id=${encodeURIComponent(customerProfile.id)}`;
  }

  function internalReviews() {
    let local = [];
    try {
      if (location.protocol === "file:") local = JSON.parse(window.TaranStorage.get(`provider-reviews:${id}`, "[]") || "[]");
    } catch (_error) { local = []; }
    return [...publishedInternalReviews, ...local];
  }

  async function loadPublishedReviews() {
    if (isCustomerReady || !window.TaranConfig?.isSupabaseConfigured || !window.TaranApi) return;
    try {
      publishedInternalReviews = await window.TaranApi.select(window.TaranConfig.tables.reviews, {
        provider_id: `eq.${id}`,
        status: "eq.published",
        select: "id,rating,author_name,content,created_at",
        order: "created_at.desc"
      });
      publishedInternalReviews = publishedInternalReviews.map((review) => ({ ...review, name: review.author_name || "손품해방 회원", date: String(review.created_at || "").slice(0, 10) }));
    } catch (error) {
      console.warn("손품해방 후기를 불러오지 못했습니다.", error);
    }
  }

  function renderReviewCard(review, external) {
    const card = document.createElement("article");
    card.className = "review-card";
    const meta = document.createElement("div");
    const author = document.createElement("strong");
    author.textContent = external ? "외부 후기" : review.name;
    const date = document.createElement("span");
    date.textContent = review.publishedDate || review.date || "";
    meta.append(author, date);
    if (external) {
      const title = document.createElement("h3");
      title.textContent = review.title || "후기 원문";
      const link = document.createElement("a");
      link.href = safeUrl(review.url) || "#";
      link.target = "_blank";
      link.rel = "noopener noreferrer nofollow";
      link.textContent = "원문 보기 →";
      card.append(meta, title, link);
    } else {
      const rating = document.createElement("strong");
      rating.textContent = `★ ${review.rating}`;
      const content = document.createElement("p");
      content.textContent = review.content;
      card.append(meta, rating, content);
    }
    return card;
  }

  function renderReviews() {
    const internal = internalReviews();
    const external = Array.isArray(legacyProvider.externalReviews) ? legacyProvider.externalReviews : [];
    $("#internal-count").textContent = String(internal.length);
    $("#external-count").textContent = String(external.length);
    const internalBox = $("#internal-reviews");
    const externalBox = $("#external-reviews");
    internalBox.replaceChildren(...internal.map((item) => renderReviewCard(item, false)));
    externalBox.replaceChildren(...external.map((item) => renderReviewCard(item, true)));
    if (!internal.length) {
      const empty = document.createElement("p");
      empty.className = "review-empty";
      empty.textContent = "아직 등록된 손품해방 후기가 없습니다.";
      internalBox.append(empty);
    }
    if (!external.length) {
      const empty = document.createElement("p");
      empty.className = "review-empty";
      empty.textContent = "연결된 외부 후기 원문이 없습니다.";
      externalBox.append(empty);
    }
    const rating = internal.length ? internal.reduce((sum, item) => sum + Number(item.rating || 0), 0) / internal.length : 0;
    $("#provider-rating").hidden = !rating;
    if (rating) $("#provider-rating").textContent = `★ ${rating.toFixed(1)} · 손품해방 후기 ${internal.length}개`;
  }

  async function renderLegacyProvider() {
    if (!legacyProvider || !statusApi?.isProviderPublic(legacyProvider) || legacyProvider.unverifiedCandidate === true) {
      if (robotsMeta) robotsMeta.content = "noindex,nofollow";
      $("#provider-content").hidden = true;
      $("#provider-not-found").hidden = false;
      return;
    }

    $("#provider-customer-sections").hidden = true;
    $("#provider-legacy-sections").hidden = false;
    $("#provider-status-line").hidden = false;
    $("#provider-introduction").hidden = true;
    $("#provider-hero-facts").hidden = true;
    $("#summary").hidden = false;
    $("#reviews").hidden = false;
    $("#location").hidden = false;
    $("#provider-compare").hidden = false;
    $("#provider-save").hidden = false;
    $("#provider-actions").hidden = false;
    $("#provider-claim").hidden = false;
    setAnchorLinks([["#summary", "핵심 조건"], ["#pricing", "가격·상품"], ["#facilities", "공간·시설"], ["#reviews", "이용 후기"], ["#policy", "취소·환불"], ["#location", "위치"]]);

    document.title = `${legacyProvider.name} | 손품해방`;
    $("#provider-name").textContent = legacyProvider.name;
    $("#provider-category").textContent = legacyProvider.category || statusApi.getProviderIndustry(legacyProvider);
    const address = statusApi.getProviderAddress(legacyProvider) || [legacyProvider.region, legacyProvider.area].filter(Boolean).join(" ");
    $("#provider-address").textContent = address;
    const status = statusApi.getProviderStatus(legacyProvider);
    $("#provider-status").textContent = status.label;
    $("#provider-status").className = `badge badge--${status.key}`;
    $("#provider-date").textContent = statusApi.getProviderFreshness(legacyProvider).label;
    const image = $("#provider-image");
    image.hidden = false;
    $("#provider-image-empty").hidden = true;
    const requestedImage = legacyProvider.imageVerified ? safe(legacyProvider.image) : "";
    placeholderApi.apply(image, legacyProvider, requestedImage);
    $("#provider-image-note").hidden = true;
    $("#provider-tags").replaceChildren();
    (legacyProvider.eventTags || []).forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "badge";
      chip.textContent = eventLabels[tag] || window.SonpumEventTypes?.label?.(tag) || tag;
      $("#provider-tags").append(chip);
    });

    const facts = statusApi.getProviderFacts(legacyProvider);
    const summary = $("#provider-summary");
    summary.replaceChildren();
    addFact(summary, "업체 유형", statusApi.getProviderIndustry(legacyProvider));
    addFact(summary, "적정 인원", first(["적정 인원", "권장 인원"]));
    addFact(summary, "최소 수용 인원", facts.minGuests ? `${facts.minGuests}명` : "");
    addFact(summary, "최대 수용 인원", facts.maxGuests ? `${facts.maxGuests}명` : "");
    addFact(summary, "최소 보증 인원", facts.guarantee ? `${facts.guarantee}명` : "");
    addFact(summary, "문의 가능 시간", first(["문의 가능 시간", "영업시간"]));

    const pricing = $("#provider-pricing");
    pricing.replaceChildren();
    if (statusApi.shouldShowVolatileFacts(legacyProvider)) {
      addFact(pricing, "기본 대관료", won(facts.rentalFee || legacyProvider.price));
      addFact(pricing, "성인 식대", facts.adultMealMin ? (facts.adultMealMax ? `${won(facts.adultMealMin)}~${won(facts.adultMealMax)}` : won(facts.adultMealMin)) : first(["성인 식대", "성인 1인 식대"]));
      addFact(pricing, "어린이 식대", first(["어린이 식대", "소인 식대"]));
      addFact(pricing, "패키지", first(["패키지 가격", "상품 구성", "포함 항목"]));
    }
    $("#pricing").hidden = !pricing.children.length;

    const facilities = $("#provider-facilities");
    facilities.replaceChildren();
    addFact(facilities, "주차", first(["주차", "주차 정보"]) || (facts.parking ? `${facts.parking}대` : ""));
    addFact(facilities, "단독 공간", first(["단독 공간", "룸·좌석"]));
    addFact(facilities, "외부 음식", first(["외부 음식 허용 여부", "외부 음식"]));
    addFact(facilities, "외부 업체", first(["외부 업체 이용 가능 여부", "외부 업체"]));
    addFact(facilities, "휠체어 접근", first(["휠체어 접근", "접근 편의"]));
    $("#facilities").hidden = !facilities.children.length;

    const policy = first(["취소·환불", "취소 환불", "취소 규정", "cancellationPolicy"]);
    $("#provider-policy").textContent = policy;
    $("#policy").hidden = !policy;
    $("#provider-location").textContent = address;
    $("#provider-map").href = `https://map.naver.com/p/search/${encodeURIComponent(`${legacyProvider.name} ${address}`)}`;

    const phoneValue = safe(legacyProvider.telephone || legacyProvider.officialVerification?.telephone || first(["전화"]));
    if (phoneValue) {
      $("#provider-phone").hidden = false;
      $("#provider-phone").href = `tel:${phoneValue.replace(/[^\d+]/g, "")}`;
      $("#provider-phone").textContent = "전화 문의";
    }
    const officialValue = safeUrl(legacyProvider.officialLink || legacyProvider.officialVerification?.link);
    if (officialValue) {
      $("#provider-official").hidden = false;
      $("#provider-official").href = officialValue;
    }
    $("#provider-inquiry-link").href = `inquiry.html?providers=${encodeURIComponent(id)}&region=${encodeURIComponent(legacyProvider.region || "")}`;
    $("#provider-inquiry-link").hidden = !window.TaranConfig?.isSupabaseConfigured || !statusApi.canReceiveInquiry(legacyProvider);
    $("#provider-claim").href = `claim.html?id=${encodeURIComponent(id)}`;
    $("#provider-compare").textContent = store.has(id) ? "비교함에서 빼기" : "비교함에 담기";

    await loadPublishedReviews();
    renderReviews();

    const formWrap = $("#review-form-wrap");
    const loginNote = $("#review-login-note");
    const account = await Promise.resolve(window.TaranAuth?.ready).catch(() => null);
    if (!window.TaranConfig?.isSupabaseConfigured) {
      formWrap.hidden = true;
      loginNote.hidden = true;
    } else if (!account) {
      formWrap.hidden = true;
      loginNote.hidden = false;
      const link = document.createElement("a");
      link.href = window.TaranAuth.loginUrl(`provider.html?id=${encodeURIComponent(id)}#reviews`);
      link.textContent = "로그인하고 손품해방 후기 작성하기";
      loginNote.replaceChildren(link);
    } else {
      formWrap.hidden = false;
      loginNote.hidden = true;
      const nameInput = $("#review-name");
      if (nameInput && !nameInput.value) nameInput.value = account.display_name || "";
    }
  }

  async function copyQuestions() {
    if (!customerProfile) return;
    const questions = customerQuestions(customerProfile);
    const message = [
      `안녕하세요. ${customerProfile.name} 이용을 검토하고 있어 문의드립니다.`,
      "",
      ...questions.map((question, index) => `${index + 1}. ${question}`)
    ].join("\n");
    const status = $("#provider-copy-status");
    const button = $("#provider-copy-questions");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(message);
      status.textContent = "문의 내용이 복사되었습니다. 공식 채널에 붙여넣어 사용해 주세요.";
      button.textContent = "복사되었습니다";
      window.clearTimeout(copyFeedbackTimer);
      copyFeedbackTimer = window.setTimeout(() => {
        button.textContent = "문의 내용 복사하기";
      }, 2000);
    } catch (_error) {
      status.textContent = "복사하지 못했습니다. 질문을 직접 선택해 복사해 주세요.";
    }
  }

  $("#provider-copy-questions")?.addEventListener("click", copyQuestions);
  $("#provider-compare")?.addEventListener("click", () => {
    if (isCustomerReady || !store) return;
    const result = store.toggle(id);
    if (!result.ok) window.TaranToast?.show("비교함에는 최대 3곳까지 담을 수 있습니다.", { type: "warning" });
    $("#provider-compare").textContent = store.has(id) ? "비교함에서 빼기" : "비교함에 담기";
  });
  $("#provider-save")?.addEventListener("click", () => {
    if (isCustomerReady) return;
    let saved = [];
    try { saved = JSON.parse(window.TaranStorage.get("saved-providers", "[]") || "[]"); } catch (_error) {}
    const exists = saved.includes(id);
    saved = exists ? saved.filter((value) => value !== id) : [...saved, id];
    window.TaranStorage.set("saved-providers", JSON.stringify(saved));
    $("#provider-save").textContent = exists ? "관심 업체 저장" : "저장됨";
  });
  document.querySelectorAll("[data-review-tab]").forEach((button) => button.addEventListener("click", () => {
    if (isCustomerReady) return;
    document.querySelectorAll("[data-review-tab]").forEach((item) => {
      item.classList.toggle("is-active", item === button);
      item.setAttribute("aria-selected", String(item === button));
    });
    $("#internal-reviews").hidden = button.dataset.reviewTab !== "internal";
    $("#external-reviews").hidden = button.dataset.reviewTab !== "external";
  }));
  $("#review-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isCustomerReady) return;
    const data = new FormData(event.currentTarget);
    const reviewStatus = event.currentTarget.querySelector("[data-review-status]");
    const account = window.TaranAuth?.getAccount();
    if (!window.TaranConfig?.isSupabaseConfigured || !account) {
      reviewStatus.textContent = "로그인 후 후기를 등록할 수 있습니다.";
      return;
    }
    const payload = { provider_id: id, user_id: account.id, rating: Number(data.get("rating")), author_name: text(data.get("name")), content: text(data.get("content")), status: "pending" };
    if (payload.content.length < 10) {
      reviewStatus.textContent = "이용 경험을 10자 이상 작성해 주세요.";
      return;
    }
    const button = event.currentTarget.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await window.TaranApi.upsert(window.TaranConfig.tables.reviews, payload);
      event.currentTarget.reset();
      reviewStatus.textContent = "후기가 접수되었습니다. 내용 확인 후 공개됩니다.";
    } catch (error) {
      reviewStatus.textContent = error.message || "후기를 등록하지 못했습니다.";
    } finally {
      button.disabled = false;
    }
  });

  async function render() {
    if (isCustomerReady) {
      renderCustomerProfile();
      return;
    }
    await renderLegacyProvider();
  }

  render().catch((error) => {
    console.error("업체 상세 정보를 표시하지 못했습니다.", error);
    $("#provider-content").hidden = true;
    $("#provider-not-found").hidden = false;
  });
})();
