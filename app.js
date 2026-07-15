const venueData = window.publicVenueData || [];
const reviewCoverage = window.reviewCoverageData || { regions: [] };
const formatWon = value => `${Math.round(value).toLocaleString("ko-KR")}원`;

function setupNationwideRegions() {
  window.taranSetupRegionSelects(
    document.querySelector("#region-province"),
    document.querySelector("#region")
  );
}

function regionMatches(venue, province, district) {
  const resolved = window.taranResolveRegion(venue.region);
  return (province === "all" || resolved.province === province) &&
    (district === "all" || resolved.district === district);
}

function eventMatches(venue, eventContext) {
  if (eventContext === "all") return true;
  const byType = {
    "호텔": ["wedding", "kids", "parents"],
    "한정식": ["wedding", "kids", "parents"],
    "파티룸": ["wedding", "kids", "home"]
  };
  return (venue.eventTags || byType[venue.type] || ["kids"]).includes(eventContext);
}

function spaceMatches(venue, spaceType) {
  if (spaceType === "all") return true;
  const mapped = venue.spaceType || (venue.type === "파티룸" ? "party" : "private");
  return mapped === spaceType;
}

function reviewCountFor(province, district) {
  return reviewCoverage.regions.reduce((total, item) => {
    const resolved = window.taranResolveRegion(item.name);
    const matches = (province === "all" || resolved.province === province) &&
      (district === "all" || resolved.district === district);
    return total + (matches ? Number(item.sourceCount || 0) : 0);
  }, 0);
}

function selectedRegionLabel(province, district) {
  return [province === "all" ? "" : province, district === "all" ? "" : district]
    .filter(Boolean).join(" ") || "선택한 지역";
}

function renderVenues(items, province = "all", district = "all") {
  const container = document.querySelector("#venue-results");
  document.querySelector("#result-count").textContent = items.length;
  if (!items.length) {
    const reviewCount = reviewCountFor(province, district);
    container.innerHTML = reviewCount
      ? `<div class="empty-state"><strong>${selectedRegionLabel(province, district)} 업체 정보를 검토하고 있습니다.</strong><br>후기 자료 ${reviewCount.toLocaleString("ko-KR")}건에서 후보를 찾고 있으며, 조건 확인이 끝난 업체부터 공개합니다.</div>`
      : '<div class="empty-state"><strong>조건에 맞는 장소가 없습니다.</strong><br>지역이나 인원을 조금 넓혀보세요.</div>';
    return;
  }
  container.innerHTML = items.map(venue => `
    <a class="venue-card venue-card-link" href="venue.html?id=${venue.id}" aria-label="${venue.name} 상세보기">
      <div class="venue-visual">
        <img src="${venue.image}" alt="" loading="lazy">
        <span>검수 기준</span>
      </div>
      <div class="venue-body">
        <h3>${venue.name}</h3>
        <div class="venue-meta">${window.taranRegionLabel(venue.region)} ${venue.area} · 보증 ${venue.minGuests}명 · 최대 ${venue.capacity}명</div>
        <div class="tag-list">${venue.tags.map(tag => `<span>${tag}</span>`).join("")}</div>
        <div class="venue-price"><div><span>성인 1인 예상</span><br><strong>${formatWon(venue.price)}</strong></div><span>최종 갱신 ${venue.verifiedAt}</span></div>
      </div>
    </a>`).join("");
}

document.querySelector("#filter-form").addEventListener("submit", event => {
  event.preventDefault();
  const province = document.querySelector("#region-province").value;
  const district = document.querySelector("#region").value;
  const eventContext = document.querySelector("#event-context").value;
  const guests = Number(document.querySelector("#guest-count").value) || 0;
  const type = document.querySelector("#venue-type").value;
  const filtered = venueData.filter(venue =>
    regionMatches(venue, province, district) &&
    eventMatches(venue, eventContext) &&
    spaceMatches(venue, type) &&
    venue.minGuests <= guests &&
    venue.capacity >= guests
  );
  renderVenues(filtered, province, district);
  document.querySelector("#venue-results").scrollIntoView({ behavior: "smooth", block: "nearest" });
});

setupNationwideRegions();
renderVenues(venueData.filter(venue => venue.minGuests <= 20 && venue.capacity >= 20).slice(0, 5));
