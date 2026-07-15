const claimParams = new URLSearchParams(window.location.search);
const claimVenueId = claimParams.get("id");
const claimVenue = window.publicVenueData.find(item => item.id === claimVenueId) || window.publicVenueData[0];

document.querySelector("#claim-venue-name").textContent = claimVenue.name;
document.querySelector("#claim-venue-meta").textContent = `${claimVenue.region} · ${claimVenue.area} · ${claimVenue.type}`;
document.querySelector("#claim-login-link").href = window.SonpumAuth.loginUrl(`claim.html${window.location.search}`);

const claimPhone = document.querySelector("#claim-phone");
const businessNumber = document.querySelector("#claim-business-number");

function formatClaimPhone(value) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}

function formatBusinessNumber(value) {
  const numbers = value.replace(/\D/g, "").slice(0, 10);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5)}`;
}

claimPhone.addEventListener("input", () => { claimPhone.value = formatClaimPhone(claimPhone.value); });
businessNumber.addEventListener("input", () => { businessNumber.value = formatBusinessNumber(businessNumber.value); });

document.querySelector("#claim-form").addEventListener("submit", event => {
  event.preventDefault();
  const error = document.querySelector("#claim-error");
  const manager = document.querySelector("#claim-manager").value.trim();
  const email = document.querySelector("#claim-email").value.trim();
  const phone = claimPhone.value;
  const number = businessNumber.value;
  const documentSelected = document.querySelector("#claim-document").files.length > 0;
  const consent = document.querySelector("#claim-consent").checked;
  const adInterest = document.querySelector("#claim-ad-interest").checked;
  const eventTags = [...document.querySelectorAll("#claim-event-tags input:checked")].map(input => input.value);

  error.textContent = "";
  if (manager.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !/^010-\d{4}-\d{4}$/.test(phone) || !/^\d{3}-\d{2}-\d{5}$/.test(number)) {
    error.textContent = "담당자 정보와 사업자등록번호 형식을 확인해주세요.";
    return;
  }
  if (!documentSelected || !consent) {
    error.textContent = "사업자 확인 자료를 선택하고 검수 동의에 체크해주세요.";
    return;
  }
  if (!eventTags.length) {
    error.textContent = "진행 가능한 가족행사를 한 개 이상 선택해주세요.";
    return;
  }

  let claims = [];
  try { claims = JSON.parse(localStorage.getItem("sonpum-haebang-claims") || "[]"); } catch (_) { claims = []; }
  const request = {
    id: `claim-${claimVenue.id}`,
    venueId: claimVenue.id,
    venueName: claimVenue.name,
    plan: "basic",
    adInterest,
    eventTags,
    status: "pending",
    submittedAt: new Date().toISOString(),
    businessDocumentChecked: false
  };
  const previousIndex = claims.findIndex(item => item.venueId === claimVenue.id);
  if (previousIndex >= 0) claims[previousIndex] = request; else claims.push(request);
  localStorage.setItem("sonpum-haebang-claims", JSON.stringify(claims));

  document.querySelector("#claim-form").hidden = true;
  document.querySelector(".claim-side").hidden = true;
  document.querySelector("#claim-result").hidden = false;
  document.querySelector("#claim-dashboard-link").href = `vendor-dashboard.html?id=${encodeURIComponent(claimVenue.id)}`;
});
