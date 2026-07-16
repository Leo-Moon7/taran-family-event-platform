Promise.resolve(window.taranContentReady).finally(() => {
const categoryOrder = ["장소/베뉴", "스냅/영상", "돌상/케이터링", "의상/뷰티", "답례품/초대장", "공간 대여"];
const reviewCoverage = window.reviewCoverageData || { regions: [] };
const reviewCandidates = window.reviewVenueCandidateData || [];
const reviewVenueDirectoryItems = reviewCandidates
  .filter(item => Number(item.mentionCount || 0) >= 5 && Number((item.evidence || []).length) >= 3)
  .map(item => {
    const spaceLabel = {
      party: "대관 파티하우스",
      private: "프라이빗 룸",
      garden: "가든·하우스웨딩",
      home: "우리집 홈파티"
    }[candidateSpace(item)] || item.category;
    const regionLabel = window.taranRegionLabel(item.inferredRegion);
    return {
      id: item.id,
      name: item.name,
      category: "장소/베뉴",
      subcategory: spaceLabel,
      region: regionLabel,
      area: item.category,
      price: 0,
      priceLabel: "가격 문의",
      primaryLabel: "지역",
      primaryValue: regionLabel,
      secondaryLabel: "공간",
      secondaryValue: spaceLabel,
      tertiaryLabel: "자료",
      tertiaryValue: `${Number((item.evidence || []).length).toLocaleString("ko-KR")}개 후기 원문`,
      intro: `${regionLabel}에서 ${spaceLabel} 관련 후기가 모인 장소입니다. 장소 유형과 준비 항목을 같은 기준으로 정리했습니다.`,
      tags: (item.mentionedTopics || []).slice(0, 4).map(topic => topic.name),
      image: candidateImage(item),
      verifiedAt: displayReviewDate(item.latestMentionDate),
      sourceStatus: "후기 기반 등록",
      publicationStatus: "published",
      detailUrl: `provider.html?id=${encodeURIComponent(item.id)}&event=kids`,
      eventTags: ["kids"],
      serviceTags: ["venue"]
    };
  });
const directoryItems = [...(window.publicDirectoryData || []), ...reviewVenueDirectoryItems];
const pageParams = new URLSearchParams(window.location.search);
const requestedEvent = pageParams.get("event") || "all";
const requestedSpace = pageParams.get("space") || "all";
const requestedService = pageParams.get("service") || "all";
const eventContexts = {
  all: { kicker: "taran PARTNERS", title: "조건에 맞는 가족행사 파트너를\n한눈에 비교하세요.", copy: "원하는 행사, 지역, 서비스 유형을 선택하면 공개 가능한 파트너 정보를 먼저 보여드립니다." },
  wedding: { kicker: "WEDDING & COUPLE", title: "우리다운 시작을 위한\n웨딩·상견례 파트너", copy: "스몰웨딩, 야외 하우스웨딩, 상견례와 리마인드 이벤트에 맞는 파트너를 모읍니다." },
  kids: { kicker: "BABY & KIDS", title: "우리 아이의 특별한 날을 위한\n백일·돌·키즈파티 파트너", copy: "백일과 첫돌, 입학 축하, 프라이빗 키즈 생일파티에 맞는 정보를 확인하세요." },
  parents: { kicker: "PARENTS & FAMILY", title: "감사의 마음을 전하는\n환갑·칠순·퇴임 파트너", copy: "환갑, 칠순, 팔순과 퇴임식, 은혼식·금혼식에 맞는 공간과 서비스를 준비합니다." },
  home: { kicker: "SEASON & HOME", title: "가족이 함께하는 시간을 위한\n모임·홈파티 파트너", copy: "명절 대가족 모임, 송년회, 집들이와 홈파티 케이터링을 한곳에서 살펴보세요." }
};
const reviewPageSize = 24;
let visibleReviewCount = reviewPageSize;
const won = value => Number(value) > 0 ? `${Number(value).toLocaleString("ko-KR")}원` : "가격 문의";
const pendingInfoPattern = /확인|정보 확인 예정|미확인|검토 중|후보를 검토|후보로 정리|조건 확인/;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function isPublicReadyValue(value) {
  const text = String(value ?? "").trim();
  return Boolean(text) && !pendingInfoPattern.test(text);
}

function publicFactRows(rows) {
  return rows.filter(([label, value]) => isPublicReadyValue(label) && isPublicReadyValue(value));
}

function cleanAreaLabel(value) {
  let text = String(value ?? "").trim();
  if (!text || !isPublicReadyValue(text)) return "";
  return text
    .replace(/^서울\s*/, "")
    .replace(/^서울특별시\s*/, "")
    .replace(/^경기\s*/, "")
    .replace(/^경기도\s*/, "")
    .replace(/^인천\s*/, "")
    .replace(/^인천광역시\s*/, "")
    .trim();
}

function normalizeDistrictForDisplay(value, province) {
  const text = cleanAreaLabel(value);
  if (!text) return "";
  const entry = (window.taranRegionData || []).find(item => item.province === province);
  if (entry) {
    const matched = entry.districts.find(district => {
      const shortName = district.replace(/(구|군|시)$/u, "");
      return text === district || text === shortName || text.startsWith(`${shortName} `);
    });
    if (matched) return matched;
  }
  return "";
}

function directoryLocationText(item) {
  const regionRaw = String(item.region ?? "").trim();
  const areaRaw = String(item.area ?? "").trim();
  const region = window.taranResolveRegion(regionRaw);
  const area = window.taranResolveRegion(areaRaw);
  const province = region.province || area.province || "";
  const district = region.district || area.district || normalizeDistrictForDisplay(areaRaw, province);
  const base = [province, district].filter(Boolean).join(" ");
  const areaDetail = cleanAreaLabel(areaRaw);
  const districtShort = district.replace(/(구|군|시)$/u, "");
  const shouldShowArea = areaDetail &&
    areaDetail !== district &&
    areaDetail !== districtShort &&
    areaDetail !== province &&
    !areaDetail.includes("·") &&
    !areaDetail.includes("행사");
  return [base, shouldShowArea ? areaDetail : ""].filter(Boolean).join(" · ");
}

function reviewTotalFromLoadedData() {
  const coverageTotal = Number(reviewCoverage.totalSources || 0);
  const lifecycleReviews = (window.reviewLifecycleVerifiedData || window.reviewLifecycleCandidateData || [])
    .reduce((total, item) => total + Number((item.externalReviews || []).length), 0);
  const providerReviews = (window.reviewProviderCandidateData || [])
    .reduce((total, item) => total + Number((item.externalReviews || []).length), 0);
  const venueReviews = (window.reviewVenueCandidateData || [])
    .reduce((total, item) => total + Number((item.evidence || []).length), 0);
  return Math.max(coverageTotal, lifecycleReviews + providerReviews + venueReviews);
}

function fillSelect(selector, values) {
  const select = document.querySelector(selector);
  const first = select.querySelector("option");
  select.innerHTML = "";
  select.append(first);
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}

function setupFilters() {
  const categories = categoryOrder.filter(category => directoryItems.some(item => item.category === category));
  const extraCategories = [...new Set(directoryItems.map(item => item.category))]
    .filter(category => !categories.includes(category))
    .sort((a, b) => a.localeCompare(b, "ko-KR"));
  fillSelect("#directory-category", [...categories, ...extraCategories]);
  window.taranSetupRegionSelects(
    document.querySelector("#directory-province"),
    document.querySelector("#directory-region")
  );
}

function regionMatches(item, province, district) {
  const resolved = window.taranResolveRegion(item.region);
  return (province === "all" || resolved.province === province) &&
    (district === "all" || resolved.district === district);
}

function renderReviewCoverage() {
  if (!document.querySelector("#coverage-total")) return;
  const totalReviews = reviewTotalFromLoadedData();
  document.querySelector("#review-coverage-title").textContent = `${totalReviews.toLocaleString("ko-KR")}개 후기 데이터로 넓히는 파트너 목록`;
  document.querySelector("#coverage-total").textContent = totalReviews.toLocaleString("ko-KR");
  document.querySelector("#coverage-recent").textContent = Number(reviewCoverage.recentSources || 0).toLocaleString("ko-KR");
  document.querySelector("#coverage-priority").textContent = Number(reviewCoverage.prioritySources || 0).toLocaleString("ko-KR");
  document.querySelector("#coverage-date").textContent = reviewCoverage.generatedAt || "-";
  document.querySelector("#review-coverage-policy").textContent = "공개 후기와 기본 업체 정보를 바탕으로 가족행사 파트너를 계속 정리하고 있습니다.";
  const provinceCoverage = window.taranRegionData.map(entry => ({
    name: entry.province,
    sourceCount: (reviewCoverage.regions || []).reduce((total, item) => {
      const resolved = window.taranResolveRegion(item.name);
      return total + (resolved.province === entry.province ? Number(item.sourceCount || 0) : 0);
    }, 0)
  })).filter(item => item.sourceCount > 0);
  document.querySelector("#review-region-list").innerHTML = provinceCoverage.map(item =>
    `<button type="button" data-review-region="${escapeHtml(item.name)}"><span>${escapeHtml(item.name)}</span><strong>${item.sourceCount.toLocaleString("ko-KR")}건</strong></button>`
  ).join("");
}

function setupReviewCandidateFilters() {
  window.taranSetupRegionSelects(
    document.querySelector("#review-candidate-province"),
    document.querySelector("#review-candidate-region")
  );
  const categorySelect = document.querySelector("#review-candidate-category");
  [
    ["garden", "가든·하우스웨딩"],
    ["party", "대관 파티하우스"],
    ["private", "프라이빗 룸"],
    ["home", "우리집 홈파티"]
  ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      categorySelect.append(option);
    });
  document.querySelector("#review-candidate-event").value = eventContexts[requestedEvent] ? requestedEvent : "all";
  categorySelect.value = ["garden", "party", "private", "home"].includes(requestedSpace) ? requestedSpace : "all";
}

function candidateSpace(item) {
  if (["파티공간", "연회/컨벤션"].includes(item.category)) return "party";
  if (["호텔", "한정식", "레스토랑", "뷔페", "장소 후보"].includes(item.category)) return "private";
  return "private";
}

function candidateEvents() {
  // 현재 후보는 돌잔치 후기 검색에서 발견했으므로 우리아이 근거만 표시합니다.
  return ["kids"];
}

function candidateImage(item) {
  const space = candidateSpace(item);
  if (space === "garden") return "assets/images/venue-garden.webp";
  if (space === "party") return "assets/images/venue-partyroom.webp";
  if (item.category === "한정식") return "assets/images/venue-hanjeongsik.webp";
  return "assets/images/venue-hotel.webp";
}

function candidateEvidenceText(item) {
  return [
    item.name,
    item.category,
    item.inferredRegion,
    ...(item.evidence || []).map(review => review.title)
  ].join(" ");
}

function candidateHasTopic(item, names) {
  const text = candidateEvidenceText(item);
  const topics = item.mentionedTopics || [];
  return names.some(name =>
    text.includes(name) || topics.some(topic => String(topic.name).includes(name) && Number(topic.count || 0) > 0)
  );
}

function candidateSpecProfile(item) {
  const regionLabel = window.taranRegionLabel(item.inferredRegion);
  const hasPrice = candidateHasTopic(item, ["비용", "견적", "금액", "식대", "대관료", "할인"]);
  const hasCapacity = candidateHasTopic(item, ["인원", "보증", "소규모", "명"]);
  const hasParking = candidateHasTopic(item, ["주차", "발렛"]);
  const hasMeal = candidateHasTopic(item, ["음식", "식사", "뷔페", "한정식", "코스"]);
  const hasRoom = candidateHasTopic(item, ["공간", "룸", "단독", "홀", "파티룸", "프라이빗"]);
  const hasStyling = candidateHasTopic(item, ["돌상", "장식", "포토존", "스냅", "사진"]);
  const spaceLabel = {
    party: "대관 파티하우스",
    private: "프라이빗 룸",
    garden: "가든·하우스웨딩",
    home: "우리집 홈파티"
  }[candidateSpace(item)] || item.category;
  return {
    regionLabel,
    spaceLabel,
    eventLabel: "백일·돌·키즈파티",
    location: regionLabel,
    price: hasPrice ? "비용 정보 있음" : "상담 전 확인",
    priceShort: hasPrice ? "비용 정보 있음" : "상담 전 확인",
    capacity: hasCapacity ? "인원 정보 있음" : "상담 전 확인",
    parking: hasParking ? "주차 정보 있음" : "상담 전 확인",
    parkingShort: hasParking ? "주차 정보 있음" : "상담 전 확인",
    meal: hasMeal ? "식사 정보 있음" : "상담 전 확인",
    room: hasRoom ? "공간 정보 있음" : "상담 전 확인",
    styling: hasStyling ? "연계 서비스 정보 있음" : "상담 전 확인",
    evidenceCount: `${Number((item.evidence || []).length).toLocaleString("ko-KR")}개 참고 후기`,
    mentionCount: "",
    latest: displayReviewDate(item.latestMentionDate),
    disclosure: ""
  };
}

function displayReviewDate(value) {
  const compact = String(value || "").replace(/[^0-9]/g, "");
  return compact.length === 8 ? `${compact.slice(0, 4)}.${compact.slice(4, 6)}.${compact.slice(6)}` : (value || "");
}

function renderCandidateSpecGrid(spec, compact = false) {
  const rows = publicFactRows(compact
    ? [
        ["지역", spec.regionLabel],
        ["공간", spec.spaceLabel]
      ]
    : [
        ["위치", spec.location],
        ["공간", spec.spaceLabel],
        ["가격", spec.price],
        ["인원", spec.capacity],
        ["주차", spec.parking],
        ["식사", spec.meal]
      ]);
  return `<dl class="candidate-spec-grid${compact ? " is-compact" : ""}">${rows.map(([label, value]) =>
    `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
  ).join("")}</dl>`;
}

function filteredReviewCandidates() {
  const query = document.querySelector("#review-candidate-query").value.trim().toLowerCase();
  const province = document.querySelector("#review-candidate-province").value;
  const district = document.querySelector("#review-candidate-region").value;
  const space = document.querySelector("#review-candidate-category").value;
  const eventContext = document.querySelector("#review-candidate-event").value;
  return reviewCandidates.filter(item => {
    const resolved = window.taranResolveRegion(item.inferredRegion);
    const regionLabel = window.taranRegionLabel(item.inferredRegion);
    return (province === "all" || resolved.province === province) &&
      (district === "all" || resolved.district === district) &&
      (space === "all" || candidateSpace(item) === space) &&
      (eventContext === "all" || candidateEvents(item).includes(eventContext)) &&
      (!query || `${item.name} ${regionLabel} ${item.category}`.toLowerCase().includes(query));
  });
}

function renderReviewCandidates(reset = false) {
  if (reset) visibleReviewCount = reviewPageSize;
  const items = filteredReviewCandidates();
  const visibleItems = items.slice(0, visibleReviewCount);
  document.querySelector("#review-candidate-count").textContent = items.length.toLocaleString("ko-KR");
  const container = document.querySelector("#review-candidate-grid");
  const moreButton = document.querySelector("#review-load-more");
  if (!items.length) {
    const eventName = eventContexts[document.querySelector("#review-candidate-event").value]?.kicker || "선택한 행사";
    container.innerHTML = `<div class="empty-state lifecycle-empty"><strong>${escapeHtml(eventName)} 파트너 정보를 정리하고 있습니다.</strong><br>공개 후기와 기본 업체 정보를 바탕으로 행사에 맞는 파트너를 순서대로 보강합니다.</div>`;
    moreButton.hidden = true;
    return;
  }
  container.innerHTML = visibleItems.map(item => {
    const spec = candidateSpecProfile(item);
    const eventLabel = candidateEvents(item).includes("kids") ? "우리아이 행사" : "가족행사";
    const activeEvent = document.querySelector("#review-candidate-event").value;
    return `<a class="review-candidate-card review-venue-card vendor-first-card" href="provider.html?id=${encodeURIComponent(item.id)}&event=${encodeURIComponent(activeEvent)}" aria-label="${escapeHtml(item.name)} 업체 상세보기">
      <div class="review-card-media"><img src="${candidateImage(item)}" alt="" loading="lazy"><span class="review-card-heart" aria-hidden="true">♡</span></div>
      <div class="review-card-content">
      <div class="review-candidate-badges"><span>가족행사 장소</span><small>${escapeHtml(eventLabel)}</small></div>
      <p class="review-venue-type">${escapeHtml(spec.regionLabel)} · ${escapeHtml(spec.spaceLabel)}</p>
      <h3>${escapeHtml(item.name)}</h3>
      ${renderCandidateSpecGrid(spec, true)}
      <span class="review-card-link">업체 정보 보기 →</span>
      </div>
    </a>`;
  }).join("");
  moreButton.hidden = visibleItems.length >= items.length;
  moreButton.textContent = `업체 더 보기 (${visibleItems.length.toLocaleString("ko-KR")} / ${items.length.toLocaleString("ko-KR")})`;
}

function renderCategorySummary() {
  const container = document.querySelector("#directory-category-summary");
  const counts = directoryItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const categories = categoryOrder.filter(category => counts[category]);
  container.innerHTML = categories.map(category => `<button class="category-chip" type="button" data-category="${escapeHtml(category)}">
    <span>${escapeHtml(category)}</span>
    <strong>${counts[category]}개</strong>
  </button>`).join("");
}

function isSampleItem(item) {
  return String(item.sourceStatus || "").includes("예시");
}

function businessBadgeLabel(item) {
  const facts = item.detailFacts || {};
  const text = [
    facts["업종"],
    facts["공간/서비스"],
    facts["공간·서비스"],
    item.category,
    item.subcategory,
    ...(item.tags || [])
  ].filter(Boolean).join(" ");

  if (/키즈카페|실내놀이터|키즈풀/i.test(text)) return "키즈카페";
  if (/출장뷔페|케이터링|도시락|컵밥/i.test(text)) return "케이터링";
  if (/한정식|한식|일식|중식|양식|뷔페|레스토랑|음식점|오리요리|두부요리|초밥|롤|파인다이닝|카페/i.test(text)) return "식당";
  if (/호텔|예식장|웨딩홀|컨벤션|연회장|연회/i.test(text)) return "연회장";
  if (/장소대여|파티룸|파티공간|하우스웨딩|가든|독립 공간|대관/i.test(text)) return "대관 공간";
  if (/스냅|사진|스튜디오|영상/i.test(text)) return "스냅·사진";
  if (/플라워|돌상|상차림|스타일링|이벤트,파티|이벤트·파티/i.test(text)) return "스타일링";
  if (/의상|드레스|예복|한복|메이크업|뷰티/i.test(text)) return "의상·뷰티";
  if (/답례품|초대장|선물/i.test(text)) return "답례품";
  return "";
}

function directoryCapabilityLabel(item) {
  const facts = item.detailFacts || {};
  const text = [
    facts["업종"],
    facts["공간/서비스"],
    facts["공간·서비스"],
    item.category,
    item.subcategory,
    ...(item.tags || [])
  ].filter(Boolean).join(" ");
  const badge = businessBadgeLabel(item);

  if (badge === "식당") return "식사 · 공간대여";
  if (badge === "키즈카페") return "키즈공간 · 공간대여";
  if (badge === "연회장") return "식사 · 연회공간";
  if (badge === "대관 공간") {
    if (/가든|하우스웨딩|야외|스몰웨딩|웨딩/i.test(text)) return "웨딩공간 · 공간대여";
    if (/키즈풀|파티룸|파티공간|생일|홈파티/i.test(text)) return "파티공간 · 공간대여";
    return "공간대여";
  }
  if (badge === "케이터링") return "출장식사";
  if (badge === "스냅·사진") return "촬영";
  if (badge === "스타일링") return "상차림 · 스타일링";
  if (badge === "의상·뷰티") return "의상 · 뷰티";
  if (badge === "답례품") return "답례품";
  return item.category || "가족행사";
}

function directoryCardIntro(item) {
  const location = directoryLocationText(item);
  const locationPrefix = location ? `${location}의 ` : "";
  const badge = businessBadgeLabel(item);
  const service = item.category || "가족행사 업체";

  if (badge === "식당") {
    return `${locationPrefix}식사 중심 가족행사 장소입니다. 모임 목적과 동선, 주차, 룸 이용 조건을 함께 비교해보세요.`;
  }
  if (badge === "키즈카페") {
    return `${locationPrefix}아이 행사와 가족 모임에 어울리는 키즈 공간입니다. 이용 시간, 안전 시설, 음식 반입 조건을 확인해보세요.`;
  }
  if (badge === "대관 공간") {
    return `${locationPrefix}소규모 행사와 모임을 위한 대관 공간입니다. 인원, 이용 시간, 스타일링 가능 여부를 비교해보세요.`;
  }
  if (badge === "연회장") {
    return `${locationPrefix}가족행사와 기념일 모임에 맞춰 볼 수 있는 연회 공간입니다. 식사 구성과 대관 조건을 함께 확인해보세요.`;
  }
  if (badge === "케이터링") {
    return `${locationPrefix}행사 식사 준비를 맡길 수 있는 케이터링 업체입니다. 인원, 메뉴 구성, 배송·출장 가능 지역을 확인해보세요.`;
  }
  if (badge === "스냅·사진") {
    return `${locationPrefix}가족행사 촬영을 비교해볼 수 있는 스냅·사진 업체입니다. 촬영 시간, 원본 제공, 행사 경험을 확인해보세요.`;
  }
  if (badge === "스타일링") {
    return `${locationPrefix}상차림과 공간 연출을 비교해볼 수 있는 스타일링 업체입니다. 콘셉트, 포함 구성, 설치 방식을 확인해보세요.`;
  }
  if (badge === "의상·뷰티") {
    return `${locationPrefix}행사 의상과 뷰티 준비를 비교해볼 수 있는 업체입니다. 피팅, 배송, 출장 가능 여부를 확인해보세요.`;
  }
  if (badge === "답례품") {
    return `${locationPrefix}답례품과 초대장을 준비할 때 비교해볼 수 있는 업체입니다. 제작 기간, 최소 수량, 배송 조건을 확인해보세요.`;
  }
  return `${locationPrefix}${service} 정보를 모아두었습니다. 우리 가족 행사 조건에 맞는지 필요한 항목을 비교해보세요.`;
}

function reviewCountValue(item) {
  const internalCount = Array.isArray(item.internalReviews) ? item.internalReviews.length : 0;
  const statsCount = Number(item.internalReviewStats?.count || item.internalReviewCount || 0);
  const externalCount = Array.isArray(item.externalReviews) ? item.externalReviews.length : 0;
  return Math.max(internalCount, statsCount, 0) + externalCount;
}

function internalRatingSummary(item) {
  const reviews = Array.isArray(item.internalReviews) ? item.internalReviews : [];
  const ratings = reviews
    .map(review => Number(review.rating ?? review.score ?? review.stars ?? 0))
    .filter(value => Number.isFinite(value) && value > 0);

  if (ratings.length) {
    const average = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
    return { rating: average, count: ratings.length };
  }

  const explicitRating = Number(item.internalReviewStats?.average || item.internalRating || item.averageRating || item.rating || 0);
  const explicitCount = Number(item.internalReviewStats?.count || item.internalReviewCount || 0);

  if (Number.isFinite(explicitRating) && explicitRating > 0) {
    return { rating: explicitRating, count: Number.isFinite(explicitCount) ? explicitCount : 0 };
  }

  return { rating: 0, count: Number.isFinite(explicitCount) ? explicitCount : 0 };
}

function internalRatingValue(item) {
  return internalRatingSummary(item).rating || 0;
}

function itemSearchText(item) {
  return [
    item.name,
    item.category,
    item.subcategory,
    item.region,
    item.area,
    item.intro,
    ...(item.tags || [])
  ].join(" ").toLowerCase();
}

function regionSortKey(item) {
  const resolved = window.taranResolveRegion(item.region);
  const regionText = [
    item.region,
    item.area,
    item.inferredRegion,
    item.address
  ].filter(Boolean).join(" ");
  if (!resolved.district) {
    const provinceCandidates = resolved.province
      ? window.taranRegionData.filter(entry => entry.province === resolved.province)
      : window.taranRegionData;
    for (const entry of provinceCandidates) {
      const foundDistrict = entry.districts.find(district => {
        const shortName = district.replace(/(특별시|광역시|특별자치시|특별자치도|자치도|시|군|구)$/g, "");
        return regionText.includes(district) || (shortName.length >= 2 && regionText.includes(shortName));
      });
      if (foundDistrict) {
        resolved.province = entry.province;
        resolved.district = foundDistrict;
        break;
      }
    }
  }
  const provinceIndex = window.taranRegionData.findIndex(entry => entry.province === resolved.province);
  const provinceEntry = window.taranRegionData.find(entry => entry.province === resolved.province);
  const districtIndex = provinceEntry ? provinceEntry.districts.indexOf(resolved.district) : -1;
  return {
    provinceIndex: provinceIndex === -1 ? 999 : provinceIndex,
    districtIndex: districtIndex === -1 ? 999 : districtIndex,
    province: resolved.province || "",
    district: resolved.district || "",
    name: item.name || ""
  };
}

function compareByRegion(a, b) {
  const left = regionSortKey(a);
  const right = regionSortKey(b);
  return left.provinceIndex - right.provinceIndex ||
    left.districtIndex - right.districtIndex ||
    left.province.localeCompare(right.province, "ko-KR") ||
    left.district.localeCompare(right.district, "ko-KR") ||
    left.name.localeCompare(right.name, "ko-KR");
}

function sortItems(items, sort) {
  const sorted = [...items];
  if (sort === "review-count") {
    sorted.sort((a, b) => reviewCountValue(b) - reviewCountValue(a) || internalRatingValue(b) - internalRatingValue(a) || compareByRegion(a, b));
    return sorted;
  }
  if (sort === "rating-high") {
    sorted.sort((a, b) => internalRatingValue(b) - internalRatingValue(a) || reviewCountValue(b) - reviewCountValue(a) || compareByRegion(a, b));
    return sorted;
  }
  if (sort === "rating-low") {
    sorted.sort((a, b) => {
      const ratingA = internalRatingValue(a);
      const ratingB = internalRatingValue(b);
      const missingA = ratingA > 0 ? 0 : 1;
      const missingB = ratingB > 0 ? 0 : 1;
      return missingA - missingB ||
        ratingA - ratingB ||
        reviewCountValue(b) - reviewCountValue(a) ||
        compareByRegion(a, b);
    });
    return sorted;
  }
  if (sort === "price-low") {
    sorted.sort((a, b) => a.price - b.price || compareByRegion(a, b));
    return sorted;
  }
  if (sort === "updated") {
    sorted.sort((a, b) => String(b.verifiedAt).localeCompare(String(a.verifiedAt)) || compareByRegion(a, b));
    return sorted;
  }
  if (sort === "category") {
    sorted.sort((a, b) => {
    const left = categoryOrder.indexOf(a.category);
    const right = categoryOrder.indexOf(b.category);
    return (left === -1 ? 99 : left) - (right === -1 ? 99 : right) || compareByRegion(a, b);
    });
    return sorted;
  }
  sorted.sort(compareByRegion);
  return sorted;
}

function isSharedPlaceholderImage(image) {
  return /assets\/images\/venue-/i.test(String(image || ""));
}

function directoryInlineAd() {
  return `<aside class="soft-monetization directory-inline-ad" aria-label="목록 중간 추천 정보">
    <span>비교 팁</span>
    <div>
      <strong>업체를 고를 때는 최근 정리 기준을 함께 보세요.</strong>
      <p>행사 유형, 지역, 공간 성격을 먼저 좁히면 우리 가족에게 맞는 파트너를 더 빠르게 찾을 수 있습니다.</p>
    </div>
  </aside>`;
}

function drawDirectory() {
  const query = document.querySelector("#directory-query").value.trim().toLowerCase();
  const category = document.querySelector("#directory-category").value;
  const province = document.querySelector("#directory-province").value;
  const district = document.querySelector("#directory-region").value;
  const budget = Number(document.querySelector("#directory-budget").value);
  const sort = document.querySelector("#directory-sort").value;
  const eventContext = document.querySelector("#review-candidate-event")?.value || requestedEvent;

  const filtered = directoryItems.filter(item => {
    return (category === "all" || item.category === category) &&
      regionMatches(item, province, district) &&
      (eventContext === "all" || (item.eventTags || []).includes(eventContext)) &&
      (requestedService === "all" || (item.serviceTags || []).includes(requestedService)) &&
      (!budget || item.price <= budget) &&
      (!query || itemSearchText(item).includes(query));
  });

  const items = sortItems(filtered, sort);
  document.querySelector("#directory-count").textContent = items.length;
  const container = document.querySelector("#directory-results");

  if (!items.length) {
    const reviewItem = reviewCoverage.regions.find(item => {
      const resolved = window.taranResolveRegion(item.name);
      return (province === "all" || resolved.province === province) &&
        (district === "all" || resolved.district === district);
    });
    const selectedRegionLabel = [province === "all" ? "" : province, district === "all" ? "" : district].filter(Boolean).join(" ") || "선택한 지역";
    container.innerHTML = reviewItem
      ? `<div class="empty-state"><strong>${escapeHtml(selectedRegionLabel)} 업체 정보를 준비하고 있습니다.</strong><br>후기 자료 ${Number(reviewItem.sourceCount).toLocaleString("ko-KR")}건을 바탕으로 파트너 목록을 순서대로 보강합니다.</div>`
      : '<div class="empty-state"><strong>검색 결과가 없습니다.</strong><br>카테고리, 지역, 예산 조건을 조금 넓혀보세요.</div>';
    return;
  }

  const cards = items.map(item => {
    const statusLabel = businessBadgeLabel(item);
    const statusMarkup = statusLabel
      ? `<span class="venue-status-badge ${isSampleItem(item) ? "is-sample" : "is-reviewed"}">${escapeHtml(statusLabel)}</span>`
      : "";
    const capabilityLabel = directoryCapabilityLabel(item);
    const placeholderImage = isSharedPlaceholderImage(item.image);
    const tags = (item.tags || []).slice(0, 4).map(tag => `<span>${escapeHtml(tag)}</span>`).join("");
    const keyFacts = publicFactRows([
      [item.primaryLabel, item.primaryValue],
      [item.secondaryLabel, item.secondaryValue],
      [item.tertiaryLabel, item.tertiaryValue]
    ]);
    const keyFactsMarkup = keyFacts.length
      ? `<div class="venue-key-facts directory-key-facts">${keyFacts.map(([label, value]) =>
          `<span><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></span>`
        ).join("")}</div>`
      : "";
    const priceMarkup = Number(item.price) > 0
      ? `<div><span>${escapeHtml(item.priceLabel)}</span><br><strong>${won(item.price)}</strong></div>`
      : "";
    const dateMarkup = "";
    const locationText = directoryLocationText(item);
    const reviewCount = reviewCountValue(item);
    const ratingSummary = internalRatingSummary(item);
    const reviewCountMarkup = reviewCount
      ? `<span class="directory-review-count">후기 ${reviewCount.toLocaleString("ko-KR")}개</span>`
      : "";
    const ratingMarkup = ratingSummary.rating
      ? `<span class="directory-rating-chip">★ ${ratingSummary.rating.toFixed(1)}${ratingSummary.count ? ` · 평가 ${ratingSummary.count.toLocaleString("ko-KR")}개` : ""}</span>`
      : "";
    const metricsMarkup = reviewCountMarkup || ratingMarkup
      ? `<div class="directory-card-metrics">${reviewCountMarkup}${ratingMarkup}</div>`
      : "";
    return `<a class="venue-card venue-card-link directory-card" href="${escapeHtml(item.detailUrl || `provider.html?id=${encodeURIComponent(item.id)}`)}" aria-label="${escapeHtml(item.name)} 상세보기">
      <div class="venue-visual directory-visual${placeholderImage ? " is-placeholder-image" : ""}">
        <img src="${escapeHtml(item.image)}" alt="" loading="lazy">
        <span class="btn-heart" aria-hidden="true">♡</span>
        ${placeholderImage ? '<span class="directory-image-note">무드 참고 이미지</span>' : ""}
      </div>
      <div class="venue-body">
        <div class="directory-card-head">
          ${statusMarkup}
          <span class="venue-card-type">${escapeHtml(capabilityLabel)}</span>
        </div>
        <h3>${escapeHtml(item.name)}</h3>
        ${locationText ? `<div class="venue-meta">${escapeHtml(locationText)}</div>` : ""}
        ${metricsMarkup}
        ${keyFactsMarkup}
        <div class="tag-list">${tags}</div>
        ${priceMarkup || dateMarkup ? `<div class="venue-price">${priceMarkup}${dateMarkup}</div>` : ""}
      </div>
    </a>`;
  });

  if (cards.length > 6) {
    cards.splice(6, 0, directoryInlineAd());
  }

  container.innerHTML = cards.join("");
}

["#directory-query", "#directory-category", "#directory-region", "#directory-budget", "#directory-sort"]
  .forEach(selector => document.querySelector(selector).addEventListener(
    selector === "#directory-query" ? "input" : "change",
    drawDirectory
  ));
document.querySelector("#directory-province").addEventListener("change", () => queueMicrotask(drawDirectory));

document.querySelector("#directory-category-summary").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  document.querySelector("#directory-category").value = button.dataset.category;
  drawDirectory();
});

document.querySelector("#review-region-list")?.addEventListener("click", event => {
  const button = event.target.closest("[data-review-region]");
  if (!button) return;
  const resolved = window.taranResolveRegion(button.dataset.reviewRegion);
  document.querySelector("#directory-province").value = resolved.province || "all";
  document.querySelector("#directory-province").dispatchEvent(new Event("change"));
  document.querySelector("#directory-region").value = resolved.district || "all";
  drawDirectory();
  document.querySelector("#review-candidate-province").value = resolved.province || "all";
  document.querySelector("#review-candidate-province").dispatchEvent(new Event("change"));
  document.querySelector("#review-candidate-region").value = resolved.district || "all";
  renderReviewCandidates(true);
  document.querySelector("#review-candidate-grid").scrollIntoView({ behavior: "smooth", block: "nearest" });
});

document.querySelector("#review-candidate-query").addEventListener("input", () => renderReviewCandidates(true));
document.querySelector("#review-candidate-event").addEventListener("change", () => {
  renderReviewCandidates(true);
  drawDirectory();
});
document.querySelector("#review-candidate-date").addEventListener("change", event => {
  const resultNote = document.querySelector(".review-candidate-resultbar > span");
  resultNote.textContent = event.target.value
    ? `${event.target.value} 기준으로 지역·공간 조건을 먼저 보여드립니다.`
    : "지역과 유형을 기준으로 파트너 목록을 보여드립니다.";
});
document.querySelector("#review-candidate-province").addEventListener("change", () => queueMicrotask(() => renderReviewCandidates(true)));
document.querySelector("#review-candidate-region").addEventListener("change", () => renderReviewCandidates(true));
document.querySelector("#review-candidate-category").addEventListener("change", () => renderReviewCandidates(true));
document.querySelector("#review-load-more").addEventListener("click", () => {
  visibleReviewCount += reviewPageSize;
  renderReviewCandidates();
});

document.querySelector("#directory-reset").addEventListener("click", () => {
  document.querySelector("#directory-query").value = "";
  document.querySelector("#directory-category").value = "all";
  document.querySelector("#directory-province").value = "all";
  document.querySelector("#directory-province").dispatchEvent(new Event("change"));
  document.querySelector("#directory-region").value = "all";
  document.querySelector("#directory-budget").value = "0";
  document.querySelector("#directory-sort").value = "recommended";
  drawDirectory();
});

setupFilters();
if (pageParams.get("q")) {
  document.querySelector("#directory-query").value = pageParams.get("q");
}
const activeContext = eventContexts[requestedEvent] || eventContexts.all;
document.querySelector("#directory-context-kicker").textContent = activeContext.kicker;
document.querySelector("#directory-context-title").innerHTML = activeContext.title.replace("\n", "<br>");
document.querySelector("#directory-context-copy").textContent = activeContext.copy;
document.querySelector(`[data-context-link="${requestedEvent}"]`)?.classList.add("is-active");
renderReviewCoverage();
setupReviewCandidateFilters();
renderReviewCandidates();
renderCategorySummary();
drawDirectory();
});
