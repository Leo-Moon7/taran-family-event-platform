(async function initializeAccount() {
  const account = await window.SonpumAuth.ready;
  if (!account) {
    window.location.href = window.SonpumAuth.loginUrl("account.html");
    return;
  }
  document.querySelector("#account-name").textContent = account.display_name;
  document.querySelector("#info-name").textContent = account.display_name;
  document.querySelector("#info-email").textContent = account.email;

  let savedSlugs = [];
  try {
    const saved = await window.SonpumAuth.api("/api/member/saved-venues");
    savedSlugs = saved.venue_slugs;
  } catch (_) {}
  const savedVenues = window.publicVenueData.filter(venue => savedSlugs.includes(venue.id));
  document.querySelector("#saved-count").textContent = savedVenues.length;
  document.querySelector("#saved-list").innerHTML = savedVenues.length
    ? savedVenues.map(venue => `<a href="venue.html?id=${encodeURIComponent(venue.id)}"><span>${venue.area} · ${venue.type}</span><strong>${venue.name}</strong><small>상세 정보 보기 →</small></a>`).join("")
    : `<div class="saved-empty"><strong>아직 저장한 업체가 없어요.</strong><span>업체 상세 화면에서 관심 업체로 저장해보세요.</span></div>`;

  document.querySelector("#logout-button").addEventListener("click", async () => {
    await window.SonpumAuth.api("/api/auth/logout", { method: "POST" });
    window.location.href = "index.html";
  });

  document.querySelector("#delete-account-button").addEventListener("click", async () => {
    if (!window.confirm("계정과 저장한 관심 업체, 예산, 체크리스트를 모두 삭제할까요?")) return;
    await window.SonpumAuth.api("/api/auth/account", { method: "DELETE" });
    window.location.href = "index.html";
  });
})();
