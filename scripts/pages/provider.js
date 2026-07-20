(function () {
  "use strict";

  const id = new URLSearchParams(location.search).get("id");
  const provider = (window.publicDirectoryData || []).find((item) => String(item.id) === String(id));
  const statusApi = window.TaranProviderStatus;
  const store = window.TaranCompareStore;
  const $ = (selector) => document.querySelector(selector);
  const text = (value) => String(value ?? "").trim();
  const unknown = /확인 필요|상담 시 안내|미정|준비 중|^-$/;
  const safe = (value) => {
    const result = text(value);
    return result && !unknown.test(result) ? result : "";
  };
  const first = (keys) => {
    for (const key of keys) {
      const value = provider?.[key] ?? provider?.detailFacts?.[key];
      if (safe(value)) return safe(value);
    }
    return "";
  };
  const won = (value) => Number(value) > 0 ? `${Number(value).toLocaleString("ko-KR")}원` : "";
  const eventLabels = { kids: "돌잔치·백일", parents: "환갑·칠순", wedding: "상견례·소규모 결혼식", home: "가족모임" };
  let publishedInternalReviews = [];

  function safeUrl(value) {
    try {
      const url = new URL(value, location.href);
      return ["http:", "https:", "tel:"].includes(url.protocol) ? url.href : "";
    } catch (_error) { return ""; }
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

  function internalReviews() {
    let local = [];
    try {
      if (location.protocol === "file:") local = JSON.parse(window.TaranStorage.get(`provider-reviews:${id}`, "[]") || "[]");
    } catch (_error) { local = []; }
    return [...publishedInternalReviews, ...local];
  }

  async function loadPublishedReviews() {
    if (!window.TaranConfig?.isSupabaseConfigured || !window.TaranApi) return;
    try {
      publishedInternalReviews = await window.TaranApi.select(window.TaranConfig.tables.reviews, {
        provider_id: `eq.${id}`,
        status: "eq.published",
        select: "id,rating,author_name,content,created_at",
        order: "created_at.desc"
      });
      publishedInternalReviews = publishedInternalReviews.map((review) => ({
        ...review,
        name: review.author_name || "따란 회원",
        date: String(review.created_at || "").slice(0, 10)
      }));
    } catch (error) {
      console.warn("따란 후기를 불러오지 못했습니다.", error);
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
    const external = Array.isArray(provider.externalReviews) ? provider.externalReviews : [];
    $("#internal-count").textContent = String(internal.length);
    $("#external-count").textContent = String(external.length);
    const internalBox = $("#internal-reviews");
    const externalBox = $("#external-reviews");
    internalBox.replaceChildren(...internal.map((item) => renderReviewCard(item, false)));
    externalBox.replaceChildren(...external.map((item) => renderReviewCard(item, true)));
    if (!internal.length) {
      const empty = document.createElement("p");
      empty.className = "review-empty";
      empty.textContent = "아직 등록된 따란 후기가 없습니다. 첫 이용 후기를 남겨주세요.";
      internalBox.append(empty);
    }
    if (!external.length) {
      const empty = document.createElement("p");
      empty.className = "review-empty";
      empty.textContent = "연결된 외부 후기 원문이 없습니다.";
      externalBox.append(empty);
    }
    const rating = internal.length ? internal.reduce((sum, item) => sum + Number(item.rating || 0), 0) / internal.length : 0;
    if (rating) {
      $("#provider-rating").hidden = false;
      $("#provider-rating").textContent = `★ ${rating.toFixed(1)} · 따란 후기 ${internal.length}개`;
    } else {
      $("#provider-rating").hidden = true;
    }
  }

  async function render() {
    if (!provider || !statusApi.isProviderPublic(provider)) {
      $("#provider-content").hidden = true;
      $("#provider-not-found").hidden = false;
      return;
    }
    document.title = `${provider.name} | 따란`;
    $("#provider-name").textContent = provider.name;
    $("#provider-category").textContent = provider.category || statusApi.getProviderIndustry(provider);
    const address = statusApi.getProviderAddress(provider) || [provider.region, provider.area].filter(Boolean).join(" ");
    $("#provider-address").textContent = address;
    const status = statusApi.getProviderStatus(provider);
    $("#provider-status").textContent = status.label;
    $("#provider-status").className = `badge badge--${status.key}`;
    $("#provider-date").textContent = statusApi.getProviderFreshness(provider).label;
    const image = $("#provider-image");
    image.src = safe(provider.image) || "assets/images/venue-partyroom.webp";
    image.alt = provider.imageVerified ? `${provider.name} 대표 이미지` : "업체 유형 참고 이미지";
    $("#provider-image-note").hidden = Boolean(provider.imageVerified);
    image.addEventListener("error", () => { image.src = "assets/images/venue-partyroom.webp"; }, { once: true });
    (provider.eventTags || []).forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "badge";
      chip.textContent = eventLabels[tag] || tag;
      $("#provider-tags").append(chip);
    });

    const facts = statusApi.getProviderFacts(provider);
    const summary = $("#provider-summary");
    addFact(summary, "업체 유형", statusApi.getProviderIndustry(provider));
    addFact(summary, "적정 인원", first(["적정 인원", "권장 인원"]));
    addFact(summary, "최소 수용 인원", facts.minGuests ? `${facts.minGuests}명` : "");
    addFact(summary, "최대 수용 인원", facts.maxGuests ? `${facts.maxGuests}명` : "");
    addFact(summary, "최소 보증 인원", facts.guarantee ? `${facts.guarantee}명` : "");
    addFact(summary, "문의 가능 시간", first(["문의 가능 시간", "영업시간"]));

    const pricing = $("#provider-pricing");
    if (statusApi.shouldShowVolatileFacts(provider)) {
      addFact(pricing, "기본 대관료", won(facts.rentalFee || provider.price));
      addFact(pricing, "성인 식대", facts.adultMealMin ? (facts.adultMealMax ? `${won(facts.adultMealMin)}~${won(facts.adultMealMax)}` : won(facts.adultMealMin)) : first(["성인 식대", "성인 1인 식대"]));
      addFact(pricing, "어린이 식대", first(["어린이 식대", "소인 식대"]));
      addFact(pricing, "패키지", first(["패키지 가격", "상품 구성", "포함 항목"]));
    }
    $("#pricing").hidden = !pricing.children.length;

    const facilities = $("#provider-facilities");
    addFact(facilities, "주차", first(["주차", "주차 정보"]) || (facts.parking ? `${facts.parking}대` : ""));
    addFact(facilities, "단독 공간", first(["단독 공간", "룸·좌석"]));
    addFact(facilities, "외부 음식", first(["외부 음식 허용 여부", "외부 음식"]));
    addFact(facilities, "외부 업체", first(["외부 업체 이용 가능 여부", "외부 업체"]));
    addFact(facilities, "휠체어 접근", first(["휠체어 접근", "접근 편의"]));
    const facilityText = first(["공간/서비스", "공간·시설"]);
    const eventValues = new Set([
      safe(provider.subcategory),
      ...Object.values(eventLabels),
      "가족모임 장소",
      "상견례·가족연회",
      "가족연회"
    ]);
    addFact(facilities, "공간·시설", eventValues.has(facilityText) ? "" : facilityText);
    $("#facilities").hidden = !facilities.children.length;

    const policy = first(["취소·환불", "취소 환불", "취소 규정", "cancellationPolicy"]);
    $("#provider-policy").textContent = policy;
    $("#policy").hidden = !policy;
    $("#provider-location").textContent = address;
    $("#provider-map").href = `https://map.naver.com/p/search/${encodeURIComponent(`${provider.name} ${address}`)}`;

    const phone = safe(provider.telephone || provider.officialVerification?.telephone || first(["전화"]));
    if (phone) {
      $("#provider-phone").hidden = false;
      $("#provider-phone").href = `tel:${phone.replace(/[^\d+]/g, "")}`;
    }
    const official = safeUrl(provider.officialLink || provider.officialVerification?.link);
    if (official) {
      $("#provider-official").hidden = false;
      $("#provider-official").href = official;
    }
    const inquiryLink = $("#provider-inquiry-link");
    inquiryLink.href = `inquiry.html?providers=${encodeURIComponent(id)}&region=${encodeURIComponent(provider.region || "")}`;
    inquiryLink.hidden = !window.TaranConfig?.isSupabaseConfigured || !statusApi.canReceiveInquiry(provider);
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
      link.textContent = "로그인하고 따란 후기 작성하기";
      loginNote.replaceChildren(link);
    } else {
      formWrap.hidden = false;
      loginNote.hidden = true;
      const nameInput = $("#review-name");
      if (nameInput && !nameInput.value) nameInput.value = account.display_name || "";
    }
  }

  $("#provider-compare").addEventListener("click", () => {
    const result = store.toggle(id);
    if (!result.ok) window.TaranToast?.show("비교함에는 최대 3곳까지 담을 수 있습니다.", { type: "warning" });
    $("#provider-compare").textContent = store.has(id) ? "비교함에서 빼기" : "비교함에 담기";
  });
  $("#provider-save").addEventListener("click", () => {
    let saved = [];
    try { saved = JSON.parse(window.TaranStorage.get("saved-providers", "[]") || "[]"); } catch (_error) {}
    const exists = saved.includes(id);
    saved = exists ? saved.filter((value) => value !== id) : [...saved, id];
    window.TaranStorage.set("saved-providers", JSON.stringify(saved));
    $("#provider-save").textContent = exists ? "관심 업체 저장" : "저장됨";
  });
  document.querySelectorAll("[data-review-tab]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-review-tab]").forEach((item) => { item.classList.toggle("is-active", item === button); item.setAttribute("aria-selected", String(item === button)); });
    $("#internal-reviews").hidden = button.dataset.reviewTab !== "internal";
    $("#external-reviews").hidden = button.dataset.reviewTab !== "external";
  }));
  $("#review-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const reviewStatus = event.currentTarget.querySelector("[data-review-status]");
    const account = window.TaranAuth?.getAccount();
    if (!window.TaranConfig?.isSupabaseConfigured || !account) {
      reviewStatus.textContent = "로그인 후 후기를 등록할 수 있습니다.";
      return;
    }
    const payload = {
      provider_id: id,
      user_id: account.id,
      rating: Number(data.get("rating")),
      author_name: text(data.get("name")),
      content: text(data.get("content")),
      status: "pending"
    };
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
      window.TaranAnalytics?.track("provider_review_submitted", "provider.html", { providerId: id, rating: payload.rating }).catch(() => {});
    } catch (error) {
      reviewStatus.textContent = error.message || "후기를 등록하지 못했습니다.";
    } finally {
      button.disabled = false;
    }
  });

  render().catch((error) => {
    console.error("업체 상세 정보를 표시하지 못했습니다.", error);
    $("#provider-content").hidden = true;
    $("#provider-not-found").hidden = false;
  });
})();
