(function () {
  "use strict";

  const id = new URLSearchParams(location.search).get("id");
  let provider = null;
  let providerSource = "static";
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
  const eventLabels = window.SonpumEventTypes?.labels || { kids: "아이 행사", parents: "부모님 행사", meeting: "상견례", smallWedding: "소규모 결혼식", familyGathering: "가족 모임" };
  const placeholderApi = window.SonpumProviderPlaceholder;
  let publishedInternalReviews = [];
  let pendingChangeRequest = null;
  const PUBLIC_PROVIDER_SELECT = [
    "id", "data", "event_types", "service_regions", "minimum_guests", "maximum_guests",
    "minimum_guarantee", "adult_meal_price_min", "adult_meal_price_max", "child_meal_price",
    "rental_fee", "parking_count", "private_room", "wheelchair_accessible",
    "outside_food_policy", "outside_vendor_policy", "cancellation_summary",
    "profile_status", "profile_completeness", "last_verified_at", "inquiry_enabled",
    "response_rate", "average_response_minutes", "updated_at"
  ].join(",");

  function number(value) {
    return Number.isFinite(Number(value)) ? Number(value) : 0;
  }

  function publicProvider(row) {
    const data = row?.data && typeof row.data === "object" && !Array.isArray(row.data) ? row.data : {};
    const detail = data.detailFacts && typeof data.detailFacts === "object" && !Array.isArray(data.detailFacts) ? data.detailFacts : {};
    const detailFacts = {};
    [
      "적정 인원", "권장 인원", "문의 가능 시간", "영업시간", "어린이 식대", "소인 식대",
      "패키지 가격", "상품 구성", "포함 항목", "주차", "주차 정보", "단독 공간",
      "룸·좌석", "외부 음식 허용 여부", "외부 음식", "외부 업체 이용 가능 여부",
      "외부 업체", "휠체어 접근", "접근 편의", "공간/서비스", "공간·시설",
      "취소·환불", "취소 환불", "취소 규정"
    ].forEach((key) => {
      if (detail[key] !== undefined && detail[key] !== null) detailFacts[key] = detail[key];
    });
    const images = Array.isArray(data.images) ? data.images.filter((value) => typeof value === "string") : [];
    return {
      id: text(row?.id),
      name: text(data.name),
      category: text(data.category),
      subcategory: text(data.subcategory),
      region: text(data.region),
      area: text(data.area),
      address: text(data.address),
      roadAddress: text(data.roadAddress),
      telephone: text(data.phone || data.telephone),
      officialLink: text(data.website || data.officialLink),
      price: number(data.price),
      priceLabel: text(data.priceLabel),
      eventTags: Array.isArray(row?.event_types) ? row.event_types.map(text).filter(Boolean) : [],
      tags: Array.isArray(data.tags) ? data.tags.map(text).filter(Boolean) : [],
      serviceRegions: Array.isArray(row?.service_regions) ? row.service_regions.map(text).filter(Boolean) : [],
      image: images[0] || "",
      imageVerified: false,
      detailFacts,
      minimumGuests: number(row?.minimum_guests),
      maximumGuests: number(row?.maximum_guests),
      minimumGuarantee: number(row?.minimum_guarantee),
      adultMealPriceMin: number(row?.adult_meal_price_min),
      adultMealPriceMax: number(row?.adult_meal_price_max),
      childMealPrice: number(row?.child_meal_price),
      rentalFee: number(row?.rental_fee),
      parkingCount: number(row?.parking_count),
      private: row?.private_room === true,
      wheelchair: row?.wheelchair_accessible === true,
      outsideFoodPolicy: text(row?.outside_food_policy),
      outsideVendorPolicy: text(row?.outside_vendor_policy),
      cancellationPolicy: text(row?.cancellation_summary),
      profileStatus: text(row?.profile_status),
      profileCompleteness: number(row?.profile_completeness),
      lastVerifiedAt: text(row?.last_verified_at).slice(0, 10),
      updatedAt: text(row?.updated_at).slice(0, 10),
      inquiryEnabled: row?.inquiry_enabled === true,
      responseRate: number(row?.response_rate),
      averageResponseMinutes: number(row?.average_response_minutes),
      publicationStatus: "published"
    };
  }

  async function loadProvider() {
    const staticProvider = (window.publicDirectoryData || []).find((item) => String(item.id) === String(id));
    if (!window.TaranConfig?.isSupabaseConfigured || !window.TaranApi) {
      providerSource = "static";
      return staticProvider || null;
    }
    try {
      const rows = await window.TaranApi.select("taran_public_providers", {
        id: `eq.${id}`,
        select: PUBLIC_PROVIDER_SELECT,
        limit: "1"
      });
      providerSource = "database";
      return Array.isArray(rows) && rows[0] ? publicProvider(rows[0]) : null;
    } catch (error) {
      providerSource = "fallback";
      console.warn("검수된 업체 상세를 불러오지 못해 저장된 정보를 확인합니다.", error);
      return staticProvider || null;
    }
  }

  function safeUrl(value) {
    if (!text(value)) return "";
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
      publishedInternalReviews = await window.TaranApi.select("taran_public_reviews", {
        provider_id: `eq.${id}`,
        select: "id,rating,author_name,content,created_at",
        order: "created_at.desc"
      });
      publishedInternalReviews = publishedInternalReviews.map((review) => ({
        ...review,
        name: review.author_name || "손품해방 회원",
        date: String(review.created_at || "").slice(0, 10)
      }));
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
      empty.textContent = "아직 등록된 손품해방 후기가 없습니다. 첫 이용 후기를 남겨주세요.";
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
      $("#provider-rating").textContent = `★ ${rating.toFixed(1)} · 손품해방 후기 ${internal.length}개`;
    } else {
      $("#provider-rating").hidden = true;
    }
  }

  function setPendingChange(request) {
    pendingChangeRequest = request || null;
    const form = $("#provider-change-form");
    const pending = $("#provider-change-pending");
    form.hidden = Boolean(pendingChangeRequest);
    pending.hidden = !pendingChangeRequest;
    if (pendingChangeRequest) {
      const date = text(pendingChangeRequest.created_at).slice(0, 10);
      $("#provider-change-pending-date").textContent = date
        ? `${date}에 접수했습니다. 관리자 확인 전까지 현재 공개 정보가 유지됩니다.`
        : "관리자 확인 전까지 현재 공개 정보가 유지됩니다.";
    }
  }

  async function setupProviderChange(account) {
    const section = $("#provider-change");
    const nav = $("#provider-change-nav");
    if (!window.TaranConfig?.isSupabaseConfigured || !account || providerSource !== "database") {
      section.hidden = true;
      nav.hidden = true;
      return;
    }
    section.hidden = false;
    nav.hidden = false;
    const facts = statusApi.getProviderFacts(provider);
    $("#provider-change-name").value = provider.name || "";
    $("#provider-change-address").value = statusApi.getProviderAddress(provider) || "";
    $("#provider-change-phone").value = provider.telephone || "";
    $("#provider-change-website").value = safeUrl(provider.officialLink) || "";
    $("#provider-change-guests").value = facts.maxGuests || "";
    $("#provider-change-parking").value = facts.parking || "";
    try {
      const rows = await window.TaranApi.select("taran_provider_change_requests", {
        provider_id: `eq.${id}`,
        status: "eq.pending",
        select: "id,provider_id,status,created_at",
        order: "created_at.desc",
        limit: "1"
      });
      setPendingChange(Array.isArray(rows) ? rows[0] : null);
    } catch (error) {
      console.warn("업체 수정 요청 상태를 불러오지 못했습니다.", error);
      const status = $("[data-provider-change-status]");
      status.textContent = "수정 요청 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }
  }

  async function render() {
    provider = await loadProvider();
    if (!provider || !statusApi.isProviderPublic(provider)) {
      $("#provider-content").hidden = true;
      $("#provider-not-found").hidden = false;
      return;
    }
    document.title = `${provider.name} | 손품해방`;
    $("#provider-name").textContent = provider.name;
    $("#provider-category").textContent = provider.category || statusApi.getProviderIndustry(provider);
    const address = statusApi.getProviderAddress(provider) || [provider.region, provider.area].filter(Boolean).join(" ");
    $("#provider-address").textContent = address;
    const status = statusApi.getProviderStatus(provider);
    $("#provider-status").textContent = status.label;
    $("#provider-status").className = `badge badge--${status.key}`;
    $("#provider-date").textContent = `${statusApi.getProviderFreshness(provider).label}${providerSource === "fallback" ? " · 최신 연결 확인 필요" : ""}`;
    const image = $("#provider-image");
    const requestedImage = provider.imageVerified ? safe(provider.image) : "";
    placeholderApi.apply(image, provider, requestedImage);
    $("#provider-image-note").hidden = true;
    (provider.eventTags || []).forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "badge";
      chip.textContent = eventLabels[tag] || window.SonpumEventTypes?.label?.(tag) || tag;
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
      link.textContent = "로그인하고 손품해방 후기 작성하기";
      loginNote.replaceChildren(link);
    } else {
      formWrap.hidden = false;
      loginNote.hidden = true;
      const nameInput = $("#review-name");
      if (nameInput && !nameInput.value) nameInput.value = account.display_name || "";
    }
    await setupProviderChange(account);
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
    const form = event.currentTarget;
    const data = new FormData(form);
    const reviewStatus = form.querySelector("[data-review-status]");
    const account = window.TaranAuth?.getAccount();
    if (!window.TaranConfig?.isSupabaseConfigured || !account) {
      reviewStatus.textContent = "로그인 후 후기를 등록할 수 있습니다.";
      return;
    }
    const payload = {
      rating: Number(data.get("rating")),
      author_name: text(data.get("name")),
      content: text(data.get("content"))
    };
    if (payload.content.length < 10) {
      reviewStatus.textContent = "이용 경험을 10자 이상 작성해 주세요.";
      return;
    }
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await window.TaranApi.rpc("taran_submit_review", {
        p_provider_id: id,
        p_rating: payload.rating,
        p_author_name: payload.author_name,
        p_content: payload.content
      });
      form.reset();
      reviewStatus.textContent = "후기가 접수되었습니다. 내용 확인 후 공개됩니다.";
      window.TaranAnalytics?.track("provider_review_submitted", "provider.html", { providerId: id, rating: payload.rating }).catch(() => {});
    } catch (error) {
      const message = text(error?.message);
      if (/pending review already exists/i.test(message)) {
        reviewStatus.textContent = "이 업체에 확인 중인 후기가 이미 있습니다.";
      } else if (/published providers/i.test(message)) {
        reviewStatus.textContent = "현재 공개 중인 업체에만 후기를 남길 수 있습니다.";
      } else if (/Login is required/i.test(message)) {
        reviewStatus.textContent = "로그인 후 후기를 등록할 수 있습니다.";
      } else {
        reviewStatus.textContent = "후기를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      }
    } finally {
      button.disabled = false;
    }
  });
  $("#provider-change-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = form.querySelector("[data-provider-change-status]");
    const account = window.TaranAuth?.getAccount();
    if (!window.TaranConfig?.isSupabaseConfigured || !account || providerSource !== "database") {
      status.textContent = "로그인과 온라인 연결을 확인한 뒤 다시 시도해 주세요.";
      return;
    }
    const data = new FormData(form);
    if (data.get("consent") !== "on") {
      status.textContent = "정보 제출 동의를 확인해 주세요.";
      return;
    }
    const payload = {
      consent_version: "provider-change-v1",
      name: text(data.get("name")),
      address: text(data.get("address")),
      phone: text(data.get("phone")),
      website: text(data.get("website")),
      maximumGuests: text(data.get("maximumGuests")),
      parkingCount: text(data.get("parkingCount"))
    };
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    status.textContent = "수정 요청을 보내고 있습니다.";
    try {
      const requestId = await window.TaranApi.rpc("taran_submit_provider_change_request", {
        p_provider_id: id,
        p_data: payload
      });
      setPendingChange({ id: requestId, provider_id: id, status: "pending", created_at: new Date().toISOString() });
      status.textContent = "";
      window.TaranToast?.show("수정 요청이 접수되었습니다. 관리자 확인 전에는 현재 정보가 유지됩니다.");
    } catch (error) {
      const message = text(error?.message);
      if (/Only the provider owner|Login is required/i.test(message)) {
        status.textContent = "이 업체의 관리 권한이 승인된 담당자 계정만 수정 요청을 보낼 수 있습니다.";
      } else if (/pending provider change|pending/i.test(message)) {
        status.textContent = "이미 확인 중인 수정 요청이 있습니다.";
      } else {
        status.textContent = "수정 요청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      }
    } finally {
      button.disabled = false;
    }
  });
  $("#provider-change-withdraw").addEventListener("click", async (event) => {
    if (!pendingChangeRequest?.id) return;
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await window.TaranApi.rpc("taran_withdraw_provider_change_request", {
        p_request_id: pendingChangeRequest.id
      });
      setPendingChange(null);
      $("[data-provider-change-status]").textContent = "수정 요청을 취소했습니다.";
    } catch (_error) {
      $("#provider-change-pending-date").textContent = "요청을 취소하지 못했습니다. 잠시 후 다시 시도해 주세요.";
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
