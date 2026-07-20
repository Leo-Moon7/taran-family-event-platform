const params = new URLSearchParams(window.location.search);
const requestedId = params.get("id");
const detailEventContext = params.get("event") || "kids";
const detailEventLabels = { wedding: "웨딩·상견례", kids: "우리아이", parents: "부모님", home: "가족·홈파티" };
const publishedVenues = window.publicVenueData || [];
const reviewVenueCandidates = window.reviewVenueCandidateData || [];
const reviewCandidate = reviewVenueCandidates.find(item => item.id === requestedId);
const venue = publishedVenues.find(item => item.id === requestedId) || (!reviewCandidate ? publishedVenues[0] : null);
const money = value => `${Number(value).toLocaleString("ko-KR")}원`;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch (_) {
    return "#";
  }
}

function displayDate(value) {
  const compact = String(value || "").replace(/[^0-9]/g, "");
  return compact.length === 8 ? `${compact.slice(0, 4)}.${compact.slice(4, 6)}.${compact.slice(6)}` : (value || "미확인");
}

function internalReviewRatingText(review) {
  const rating = Number(review?.rating ?? review?.score ?? review?.stars ?? 0);
  return Number.isFinite(rating) && rating > 0 ? `★ ${rating.toFixed(1)}` : "";
}

function candidateSpace(item) {
  if (["파티공간", "연회/컨벤션"].includes(item.category)) return "party";
  if (["호텔", "한정식", "레스토랑", "뷔페", "장소 후보"].includes(item.category)) return "private";
  return "private";
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
  const regionLabel = venueLocationText(item);
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
    price: hasPrice ? "가격 문의" : "상담 시 안내",
    capacity: hasCapacity ? "인원 조건 업체 문의" : "상담 시 안내",
    parking: hasParking ? "주차 정보 업체 문의" : "상담 시 안내",
    meal: hasMeal ? "식사 관련 후기 있음" : "상담 시 안내",
    room: hasRoom ? "공간 관련 후기 있음" : "상담 시 안내",
    styling: hasStyling ? "돌상·사진 후기 있음" : "상담 시 안내",
    evidenceCount: `${Number((item.evidence || []).length).toLocaleString("ko-KR")}개 외부 후기`,
    mentionCount: `${Number(item.mentionCount || 0).toLocaleString("ko-KR")}건 반복 언급`,
    latest: displayDate(item.latestMentionDate),
    disclosure: item.disclosureMentionCount ? `광고·협찬 표시 단어 ${item.disclosureMentionCount}건` : "광고성 여부 개별 확인"
  };
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function cleanAreaLabel(value) {
  let text = String(value ?? "").trim();
  if (!text) return "";
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

function venueLocationText(item) {
  const regionRaw = String(item?.region ?? item?.inferredRegion ?? "").trim();
  const areaRaw = String(item?.area ?? "").trim();
  const region = window.taranResolveRegion(regionRaw);
  const area = window.taranResolveRegion(areaRaw);
  const province = region.province || area.province || "";
  const district = region.district || area.district || normalizeDistrictForDisplay(areaRaw, province);
  const base = [province, district].filter(Boolean).join(" ");
  return base || window.taranRegionLabel(regionRaw);
}

function renderReviewPanels(item, showExternalFirst = false) {
  const internalReviews = item.internalReviews || [];
  const externalReviews = item.evidence || [];
  setText("#internal-review-count", internalReviews.length);
  setText("#external-review-count", externalReviews.length);

  const internalPanel = document.querySelector("#internal-review-panel");
  internalPanel.innerHTML = internalReviews.length
    ? `<div class="internal-review-list">${internalReviews.map(review => `<article>
        <div><strong>${escapeHtml(review.author || "손품해방 고객")}</strong><span>${escapeHtml([internalReviewRatingText(review), displayDate(review.createdAt)].filter(Boolean).join(" · "))}</span></div>
        <p>${escapeHtml(review.body)}</p>
      </article>`).join("")}</div>`
    : `<div class="review-empty-state">
        <strong>아직 손품해방 고객 리뷰가 없습니다.</strong>
        <p>손품해방에서 실제 이용 여부가 확인된 고객의 리뷰만 이곳에 표시할 예정입니다.</p>
        <button type="button" disabled>실제 이용 확인 후 작성 가능</button>
      </div>`;

  const externalPanel = document.querySelector("#external-review-panel");
  externalPanel.innerHTML = externalReviews.length
    ? `<div class="external-review-notice"><strong>외부 후기 참고 안내</strong><p>외부 블로그 후기는 손품해방 고객 리뷰와 구분해 표시합니다. 가격과 운영 조건은 실제 상담 시 업체에서 최종 안내합니다.</p></div>
      <div class="external-review-list">${externalReviews.map(review => `<article>
        <div><span>네이버 블로그</span><time>${escapeHtml(displayDate(review.publishedDate))}</time></div>
        <h3>${escapeHtml(review.title)}</h3>
        <a href="${escapeHtml(safeExternalUrl(review.url))}" target="_blank" rel="noopener noreferrer nofollow">블로그 원문 보기 ↗</a>
      </article>`).join("")}</div>`
    : `<div class="review-empty-state"><strong>연결된 외부 후기가 없습니다.</strong><p>업체명과 지점이 정확히 확인된 후기부터 순차적으로 연결합니다.</p></div>`;

  const activateTab = name => {
    document.querySelectorAll("[data-review-tab]").forEach(button => {
      const active = button.dataset.reviewTab === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    internalPanel.hidden = name !== "internal";
    externalPanel.hidden = name !== "external";
  };
  document.querySelector(".venue-review-tabs").addEventListener("click", event => {
    const button = event.target.closest("[data-review-tab]");
    if (button) activateTab(button.dataset.reviewTab);
  });
  activateTab(showExternalFirst ? "external" : "internal");
}

function renderCandidate(candidate) {
  const regionLabel = venueLocationText(candidate);
  const spec = candidateSpecProfile(candidate);
  document.body.classList.add("review-candidate-detail");
  document.querySelectorAll(".verified-only").forEach(element => { element.hidden = true; });
  document.title = `${candidate.name} 업체 정보 | 손품해방`;
  setText("#breadcrumb-name", candidate.name);
  setText("#detail-location", `${regionLabel} · ${candidate.category}`);
  setText("#detail-name", candidate.name);
  setText("#detail-intro", "가족행사 준비에 참고할 수 있도록 기본 정보를 정리한 업체입니다. 실제 가격과 예약 가능 여부는 상담 전 다시 확인해 주세요.");
  const topicNames = (candidate.mentionedTopics || []).slice(0, 3).map(topic => topic.name);
  document.querySelector("#detail-tags").innerHTML = ["가족행사", "장소", "상담 전 확인", ...topicNames]
    .map(tag => `<span>${escapeHtml(tag)}</span>`).join("");

  const verificationBox = document.querySelector("#detail-verification");
  verificationBox.classList.add("is-sample");
  setText("#verification-label", "기본 정보 등록");
  setText("#verification-copy", "가격, 예약 가능일, 포함 항목은 상담 전 업체에 다시 확인해 주세요.");
  setText("#verification-date-label", "최근 후기 작성일");
  setText("#hero-verified-at", displayDate(candidate.latestMentionDate));

  document.querySelector(".detail-quick-summary").innerHTML = `
    <div><span>위치</span><strong>${escapeHtml(spec.location)}</strong></div>
    <div><span>공간 유형</span><strong>${escapeHtml(spec.spaceLabel)}</strong></div>
    <div><span>가격</span><strong>${escapeHtml(spec.price)}</strong></div>
    <div><span>주차</span><strong>${escapeHtml(spec.parking)}</strong></div>`;

  const factGrid = document.querySelector("#fact-grid");
  factGrid.classList.add("candidate-condition-grid");
  factGrid.innerHTML = [
    ["행사 유형", spec.eventLabel],
    ["위치", spec.location],
    ["공간 유형", spec.spaceLabel],
    ["가격·식대", spec.price],
    ["인원·보증", spec.capacity],
    ["주차", spec.parking],
    ["식사", spec.meal],
    ["공간 분위기", spec.room],
    ["연계 준비", spec.styling],
    ["참고 후기", `${spec.evidenceCount} · 최근 ${spec.latest}`]
  ].map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");

  const candidateGalleryImages = candidate.category === "한정식"
    ? ["assets/images/venue-hanjeongsik.webp", "assets/images/venue-partyroom.webp", "assets/images/venue-hotel.webp"]
    : ["assets/images/venue-hotel.webp", "assets/images/venue-hanjeongsik.webp", "assets/images/venue-partyroom.webp"];
  document.querySelectorAll(".detail-gallery > div").forEach((panel, index) => {
    panel.style.backgroundImage = `linear-gradient(180deg, rgba(74,59,50,.06), rgba(74,59,50,.58)), url("${candidateGalleryImages[index]}")`;
    panel.querySelector("span").textContent = "공간 분위기 참고 이미지";
  });

  document.querySelector("#caution-list").innerHTML = [
    "가격, 상세 주소, 예약 가능 날짜는 업체 상담 시 최종 안내됩니다.",
    "손품해방 고객 리뷰와 외부 블로그 후기는 별도로 구분해 보여드립니다.",
    "업체와 연결되면 연락처와 패키지 가격을 순차적으로 보강합니다."
  ].map(item => `<li>${escapeHtml(item)}</li>`).join("");

  setText("#publication-status", "후기 기반 공개");
  setText("#source-status", "후기 기반 등록");
  setText("#source-date-label", "최근 후기 작성일");
  setText("#verified-at", displayDate(candidate.latestMentionDate));
  setText("#source-note", "외부 후기 자료를 바탕으로 장소 유형과 준비 항목을 먼저 정리했습니다. 정확한 주소, 연락처, 가격, 예약 조건은 업체 상담 시 최종 안내됩니다.");
  setText("#side-name", candidate.name);
  setText("#side-address", spec.location);

  const saveButton = document.querySelector("#save-venue");
  const saveKey = `taran-saved-candidate-${candidate.id}`;
  let savedCandidate = localStorage.getItem(saveKey) === "1";
  const paintCandidateSave = () => {
    saveButton.textContent = savedCandidate ? "♥ 관심 업체 저장됨" : "♡ 관심 업체 저장";
    saveButton.classList.toggle("is-saved", savedCandidate);
    const stickyText = document.querySelector("#sticky-save span");
    if (stickyText) stickyText.textContent = savedCandidate ? "저장됨" : "관심 저장";
  };
  saveButton.disabled = false;
  saveButton.nextElementSibling.textContent = "관심 있는 업체를 저장하고 나중에 다시 볼 수 있습니다.";
  saveButton.addEventListener("click", async () => {
    const account = await window.TaranAuth.ready;
    if (!account) {
      window.location.href = window.TaranAuth.loginUrl(`provider.html${window.location.search}`);
      return;
    }
    savedCandidate = !savedCandidate;
    localStorage.setItem(saveKey, savedCandidate ? "1" : "0");
    paintCandidateSave();
    setText("#detail-notice", savedCandidate ? "관심 업체에 저장했습니다." : "관심 업체 저장을 해제했습니다.");
  });
  paintCandidateSave();
  const inquiryButton = document.querySelector("#inquiry-button");
  inquiryButton.hidden = true;
  const claimLink = document.querySelector("#claim-listing-link");
  claimLink.textContent = "업체 담당자 권한 요청";
  claimLink.href = `claim.html?id=${encodeURIComponent(candidate.id)}`;
  const stickySave = document.querySelector("#sticky-save");
  const stickyInquiry = document.querySelector("#sticky-inquiry");
  stickySave.disabled = false;
  stickyInquiry.hidden = true;
  stickySave.addEventListener("click", () => saveButton.click());
  document.querySelector("#correction-button").addEventListener("click", () => {
    window.location.href = `contribute.html?provider=${encodeURIComponent(candidate.id)}`;
  });
  renderReviewPanels(candidate, true);
}

function renderPublishedVenue(item) {
  const isSample = String(item.sourceStatus).includes("검수 준비") || String(item.sourceStatus).includes("확인 예정");
  const verificationLabel = isSample ? "정보 확인 예정" : "관리자 검수 완료";
  document.title = `${item.name} | 손품해방`;
  setText("#breadcrumb-name", item.name);
  setText("#detail-location", `${venueLocationText(item)} · ${item.type}`);
  setText("#detail-name", item.name);
  setText("#detail-intro", item.intro);
  const eventLabels = (item.eventTags || []).map(tag => detailEventLabels[tag]).filter(Boolean);
  document.querySelector("#detail-tags").innerHTML = [...eventLabels, ...item.tags].map(tag => `<span>${escapeHtml(tag)}</span>`).join("");
  setText("#adult-price-detail", money(item.price));
  setText("#child-price-detail", money(item.childPrice));
  setText("#min-guests-detail", `${item.minGuests}명부터`);
  setText("#min-food-cost-detail", money(item.price * item.minGuests));
  setText("#rental-cost-detail", money(item.baseRental));
  setText("#table-fee-detail", item.externalTableFee ? money(item.externalTableFee) : (isSample ? "없음 예시" : "없음"));
  setText("#shortage-detail", item.shortagePenalty);
  setText("#food-policy-detail", item.foodPolicy);
  setText("#time-slots-detail", item.timeSlots);
  document.querySelector("#caution-list").innerHTML = item.cautions.map(text => `<li>${escapeHtml(text)}</li>`).join("");
  setText("#source-status", item.sourceStatus);
  setText("#verified-at", item.verifiedAt);
  setText("#publication-status", isSample ? "검수 기준 공개" : "관리자 승인 공개");
  setText("#source-date-label", isSample ? "정보 확인 예정일" : "업체 정보 확인일");
  setText("#source-note", isSample
    ? "현재 내용은 화면 기능을 확인하기 위한 예시입니다. 실제 업체 조사 후 공식 홈페이지·전화 확인일과 출처로 교체합니다."
    : "크롤링 자료를 자동 공개하지 않고, 관리자가 공식 채널과 전화 확인 내용을 검수한 뒤 공개합니다.");
  setText("#side-name", item.name);
  setText("#side-address", item.address);
  document.querySelector("#claim-listing-link").textContent = "업체 담당자 권한 요청";
  document.querySelector("#claim-listing-link").href = `claim.html?id=${encodeURIComponent(item.id)}`;

  const verificationBox = document.querySelector("#detail-verification");
  verificationBox.classList.add(isSample ? "is-sample" : "is-reviewed");
  setText("#verification-label", verificationLabel);
  setText("#verification-copy", isSample ? "정식 발행 전 검수 기준을 확인하기 위한 공개 준비 데이터입니다." : "관리자가 공식 채널과 업체 확인을 거친 정보입니다.");
  setText("#verification-date-label", isSample ? "정보 확인 예정일" : "정보 확인일");
  setText("#hero-verified-at", item.verifiedAt);
  setText("#quick-adult-price", money(item.price));
  setText("#quick-capacity", `${item.minGuests}명부터 · 최대 ${item.capacity}명`);
  setText("#quick-parking", item.parking ? `${item.parkingSpaces}대 · ${item.freeParkingHours}시간` : "주차 문의");
  setText("#quick-type", item.type);

  const contextImages = item.contextPortfolio?.[detailEventContext] || [];
  const alternateImages = [
    contextImages[0] || item.image,
    contextImages[1] || (item.type === "호텔" ? "assets/images/venue-hanjeongsik.webp" : "assets/images/venue-hotel.webp"),
    item.type === "파티룸" ? "assets/images/venue-garden.webp" : "assets/images/venue-partyroom.webp"
  ];
  document.querySelectorAll(".detail-gallery > div").forEach((panel, index) => {
    panel.style.backgroundImage = `linear-gradient(180deg, rgba(21,60,54,.02), rgba(21,60,54,.32)), url("${alternateImages[index]}")`;
  });
  document.querySelector("#fact-grid").innerHTML = [
    ["보증·수용인원", `${item.minGuests}명부터 최대 ${item.capacity}명`],
    ["공간 형태", item.roomDetail],
    ["주차", item.parking ? `${item.parkingSpaces}대 · ${item.freeParkingHours}시간 무료${isSample ? " 예시" : ""}` : item.parkingDetail],
    ["행사 시간", item.timeSlots]
  ].map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");

  const saveButton = document.querySelector("#save-venue");
  let saved = false;
  const paintSaveButton = () => {
    saveButton.textContent = saved ? "♥ 관심 업체 저장됨" : "♡ 관심 업체 저장";
    saveButton.classList.toggle("is-saved", saved);
  };
  saveButton.addEventListener("click", async () => {
    const account = await window.TaranAuth.ready;
    if (!account) {
      window.location.href = window.TaranAuth.loginUrl(`provider.html${window.location.search}`);
      return;
    }
    try {
      await window.TaranAuth.api(`/api/member/saved-venues/${encodeURIComponent(item.id)}`, { method: saved ? "DELETE" : "PUT" });
      saved = !saved;
      paintSaveButton();
    } catch (error) { setText("#detail-notice", error.message); }
  });
  (async () => {
    const account = await window.TaranAuth.ready;
    if (account) {
      try {
        const result = await window.TaranAuth.api("/api/member/saved-venues");
        saved = result.venue_slugs.includes(item.id);
      } catch (_) {}
    }
    paintSaveButton();
  })();
  document.querySelector("#inquiry-button").hidden = true;
  document.querySelector("#correction-button").addEventListener("click", () => { window.location.href = `contribute.html?provider=${encodeURIComponent(item.id)}`; });
  document.querySelector("#sticky-save").addEventListener("click", () => saveButton.click());
  document.querySelector("#sticky-inquiry").hidden = true;
  renderReviewPanels({ internalReviews: item.internalReviews || [], evidence: item.evidence || [] });
}

if (reviewCandidate) renderCandidate(reviewCandidate);
else if (venue) renderPublishedVenue(venue);
else window.location.href = "venues.html";
