const vendorParams = new URLSearchParams(window.location.search);
const vendorVenueId = vendorParams.get("id") || window.publicVenueData[0].id;
const vendorVenue = window.publicVenueData.find(item => item.id === vendorVenueId);
let vendorClaims = [];
try { vendorClaims = JSON.parse(localStorage.getItem("taran-provider-claims") || "[]"); } catch (_) { vendorClaims = []; }
let vendorClaim = vendorClaims.find(item => item.venueId === vendorVenueId);

const statusBox = document.querySelector("#vendor-status");
const gate = document.querySelector("#vendor-gate");
const layout = document.querySelector("#vendor-layout");
const actionLink = document.querySelector("#vendor-action-link");
actionLink.href = `claim.html?id=${encodeURIComponent(vendorVenueId)}`;

function showGate(title, copy, status) {
  document.querySelector("#vendor-gate-title").textContent = title;
  document.querySelector("#vendor-gate-copy").textContent = copy;
  statusBox.querySelector("strong").textContent = status;
}

if (!vendorVenue) {
  showGate("업체 정보를 찾을 수 없습니다.", "공개 업체 목록에서 다시 선택해주세요.", "확인 필요");
  actionLink.href = "venues.html";
  actionLink.textContent = "업체 목록 보기";
} else if (!vendorClaim) {
  showGate("아직 권한 요청이 없습니다.", "업체 담당자 인증을 먼저 요청해주세요.", "미요청");
} else if (vendorClaim.status === "pending") {
  showGate("관리자 검수 대기 중입니다.", "사업자 확인이 끝나기 전에는 업체 정보를 수정할 수 없습니다.", "승인 대기");
  actionLink.href = "admin-review.html#claims";
  actionLink.textContent = "시제품 검수 화면 보기";
} else if (vendorClaim.status === "rejected") {
  showGate("담당자 확인이 보류되었습니다.", "사업자 정보나 담당자 연락처를 보완해 다시 요청해주세요.", "보완 필요");
} else {
  gate.hidden = true;
  layout.hidden = false;
  statusBox.querySelector("strong").textContent = "수정 권한 승인";
  document.querySelector("#vendor-subtitle").textContent = "승인받은 업체의 예약 조건과 가격을 직접 관리합니다.";
  document.querySelector("#vendor-venue-name").textContent = vendorVenue.name;
  document.querySelector("#vendor-public-link").href = `provider.html?id=${encodeURIComponent(vendorVenue.id)}`;
  const fields = {
    "vendor-price": vendorVenue.price,
    "vendor-child-price": vendorVenue.childPrice,
    "vendor-min-guests": vendorVenue.minGuests,
    "vendor-capacity": vendorVenue.capacity,
    "vendor-rental": vendorVenue.baseRental,
    "vendor-table-fee": vendorVenue.externalTableFee,
    "vendor-parking": vendorVenue.parkingDetail,
    "vendor-room": vendorVenue.roomDetail,
    "vendor-food": vendorVenue.foodPolicy,
    "vendor-times": vendorVenue.timeSlots
  };
  Object.entries(fields).forEach(([id, value]) => { document.querySelector(`#${id}`).value = value; });
  const wantsPremiumInfo = vendorClaim.adInterest || vendorClaim.premiumInterest;
  document.querySelector("#vendor-plan-name").textContent = wantsPremiumInfo ? "Basic + 광고 관심" : "Basic";
  document.querySelector("#vendor-plan-copy").textContent = wantsPremiumInfo
    ? "무료 수정 권한은 승인됐고, Premium 광고 상담 관심이 표시되어 있습니다."
    : "기본 정보 수정 기능을 이용 중입니다.";
}

document.querySelector("#vendor-editor").addEventListener("submit", event => {
  event.preventDefault();
  if (!vendorClaim || vendorClaim.status !== "approved") return;
  const numberValue = id => Math.max(0, Number(document.querySelector(`#${id}`).value) || 0);
  const edits = {
    price: numberValue("vendor-price"),
    childPrice: numberValue("vendor-child-price"),
    minGuests: numberValue("vendor-min-guests"),
    capacity: numberValue("vendor-capacity"),
    baseRental: numberValue("vendor-rental"),
    externalTableFee: numberValue("vendor-table-fee"),
    parkingDetail: document.querySelector("#vendor-parking").value.trim(),
    roomDetail: document.querySelector("#vendor-room").value.trim(),
    foodPolicy: document.querySelector("#vendor-food").value.trim(),
    timeSlots: document.querySelector("#vendor-times").value.trim(),
    verifiedAt: new Date().toLocaleDateString("ko-KR").replace(/\. /g, ".").replace(/\.$/, ""),
    sourceStatus: "승인된 업체 담당자 직접 수정 · 시제품",
    ownerStatus: "claimed"
  };
  let allEdits = {};
  try { allEdits = JSON.parse(localStorage.getItem("taran-provider-edits") || "{}"); } catch (_) { allEdits = {}; }
  allEdits[vendorVenue.id] = edits;
  localStorage.setItem("taran-provider-edits", JSON.stringify(allEdits));
  document.querySelector("#vendor-message").textContent = "저장되었습니다. 공개 페이지를 새로 열면 변경 내용을 확인할 수 있습니다.";
});

document.querySelector("#premium-interest").addEventListener("click", () => {
  if (!vendorClaim || vendorClaim.status !== "approved") return;
  vendorClaim.adInterest = true;
  vendorClaim.premiumInterest = true;
  localStorage.setItem("taran-provider-claims", JSON.stringify(vendorClaims));
  document.querySelector("#vendor-plan-name").textContent = "Basic + 광고 관심";
  document.querySelector("#vendor-plan-copy").textContent = "무료 수정 권한은 승인됐고, Premium 광고 상담 관심이 표시되어 있습니다.";
  document.querySelector("#vendor-message").textContent = "Premium 상담 관심 상태로 표시했습니다. 실제 결제나 신청 전송은 발생하지 않습니다.";
});
