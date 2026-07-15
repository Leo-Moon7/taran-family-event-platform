let crawlReviewState = {};
try { crawlReviewState = JSON.parse(localStorage.getItem("sonpum-haebang-crawl-review") || "{}"); } catch (_) { crawlReviewState = {}; }

function crawlStatusLabel(status) {
  if (status === "published") return "발행 승인";
  if (status === "rejected") return "보류";
  return "승인 대기";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function renderSchemaSummary() {
  const container = document.querySelector("#schema-summary");
  if (!container || !window.crawlReviewSchema) return;
  const { commonFields, categoryFields } = window.crawlReviewSchema;
  const commonHtml = `<article class="schema-card schema-card-common">
    <span>공통 항목</span>
    <h3>모든 업체에 반드시 저장</h3>
    <div>${commonFields.map(field => `<b>${escapeHtml(field)}</b>`).join("")}</div>
  </article>`;
  const categoryHtml = Object.entries(categoryFields).map(([category, fields]) => `<article class="schema-card">
    <span>${escapeHtml(category)}</span>
    <h3>유형별 필수 스펙</h3>
    <div>${fields.map(field => `<b>${escapeHtml(field)}</b>`).join("")}</div>
  </article>`).join("");
  container.innerHTML = commonHtml + categoryHtml;
}

function renderCrawlQueue() {
  const container = document.querySelector("#crawl-review-list");
  container.innerHTML = window.crawlQueueData.map(item => {
    const status = crawlReviewState[item.id] || item.status;
    const specs = Object.entries(item.specs || {});
    const checks = item.validationChecks || ["공식 출처 확인", "영업 여부 확인", "가격 기준일 확인", "전화 또는 DM 확인"];
    return `<article class="review-card" data-crawl-id="${item.id}">
      <div class="review-card-top"><div><span>${escapeHtml(item.category)} · ${escapeHtml(item.region)}</span><h3>${escapeHtml(item.name)}</h3><small>${escapeHtml(item.source)} · 수집 ${escapeHtml(item.collectedAt)}</small></div><b class="review-status ${status}">${crawlStatusLabel(status)}</b></div>
      <div class="review-quality"><span>수집 완성도 ${item.completeness}%</span><i><em style="width:${item.completeness}%"></em></i></div>
      <div class="review-specs">${specs.map(([label, value]) => `<dl><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></dl>`).join("")}</div>
      <div class="review-issues"><strong>검수 전 확인 필요</strong><ul>${item.issues.map(issue => `<li>${escapeHtml(issue)}</li>`).join("")}</ul></div>
      <div class="review-checks">${checks.map(check => `<label><input type="checkbox"> ${escapeHtml(check)}</label>`).join("")}</div>
      <p class="review-message" aria-live="polite"></p>
      <div class="review-actions"><button class="button button-primary" type="button" data-review-action="publish">검수 후 발행</button><button class="button button-quiet" type="button" data-review-action="reject">보류</button></div>
    </article>`;
  }).join("");
}

document.querySelector("#crawl-review-list").addEventListener("click", event => {
  const button = event.target.closest("[data-review-action]");
  if (!button) return;
  const card = button.closest("[data-crawl-id]");
  const id = card.dataset.crawlId;
  const message = card.querySelector(".review-message");
  if (button.dataset.reviewAction === "publish") {
    const checks = [...card.querySelectorAll('.review-checks input')];
    const checked = checks.every(input => input.checked);
    if (!checked) {
      message.textContent = `${checks.length}개 검수 항목을 모두 확인해야 발행할 수 있습니다.`;
      return;
    }
    crawlReviewState[id] = "published";
    message.textContent = "발행 승인 상태로 변경했습니다. 실제 서비스에서는 공개 DB로 이동합니다.";
  } else {
    crawlReviewState[id] = "rejected";
    message.textContent = "보류 처리했습니다. 공개 목록에는 노출되지 않습니다.";
  }
  localStorage.setItem("sonpum-haebang-crawl-review", JSON.stringify(crawlReviewState));
  card.querySelector(".review-status").className = `review-status ${crawlReviewState[id]}`;
  card.querySelector(".review-status").textContent = crawlStatusLabel(crawlReviewState[id]);
});

function readClaims() {
  try { return JSON.parse(localStorage.getItem("sonpum-haebang-claims") || "[]"); } catch (_) { return []; }
}

function claimStatusLabel(status) {
  if (status === "approved") return "권한 승인";
  if (status === "rejected") return "보완 요청";
  return "검수 대기";
}

function renderClaims() {
  const claims = readClaims();
  const container = document.querySelector("#claim-review-list");
  if (!claims.length) {
    container.innerHTML = '<div class="review-empty"><strong>접수된 권한 요청이 없습니다.</strong><a href="claim.html?id=songpa-sample-a">시제품 요청 만들어보기 →</a></div>';
    return;
  }
  container.innerHTML = claims.map(claim => `<article class="review-card claim-review-card" data-claim-id="${escapeHtml(claim.id)}">
    <div class="review-card-top"><div><span>업체 소유권 요청</span><h3>${escapeHtml(claim.venueName)}</h3><small>${new Date(claim.submittedAt).toLocaleString("ko-KR")} · Basic 무료${claim.adInterest || claim.premiumInterest ? " · Premium 광고 관심" : ""}</small></div><b class="review-status ${claim.status}">${claimStatusLabel(claim.status)}</b></div>
    <div class="review-checks"><label><input type="checkbox"> 사업자등록증</label><label><input type="checkbox"> 상호·대표자</label><label><input type="checkbox"> 업무 연락처</label><label><input type="checkbox"> 업체 연관성</label></div>
    <p class="review-message" aria-live="polite"></p>
    <div class="review-actions"><button class="button button-primary" type="button" data-claim-action="approve">수정 권한 승인</button><button class="button button-quiet" type="button" data-claim-action="reject">보완 요청</button><a class="text-link" href="vendor-dashboard.html?id=${encodeURIComponent(claim.venueId)}">대시보드 상태 →</a></div>
  </article>`).join("");
}

document.querySelector("#claim-review-list").addEventListener("click", event => {
  const button = event.target.closest("[data-claim-action]");
  if (!button) return;
  const card = button.closest("[data-claim-id]");
  const claims = readClaims();
  const claim = claims.find(item => item.id === card.dataset.claimId);
  const message = card.querySelector(".review-message");
  if (button.dataset.claimAction === "approve") {
    const checked = [...card.querySelectorAll('.review-checks input')].every(input => input.checked);
    if (!checked) {
      message.textContent = "담당자 확인 4개 항목을 모두 검수해주세요.";
      return;
    }
    claim.status = "approved";
    claim.businessDocumentChecked = true;
    claim.approvedAt = new Date().toISOString();
    message.textContent = "해당 업체에만 수정 권한을 부여했습니다.";
  } else {
    claim.status = "rejected";
    message.textContent = "보완 요청 상태로 변경했습니다.";
  }
  localStorage.setItem("sonpum-haebang-claims", JSON.stringify(claims));
  card.querySelector(".review-status").className = `review-status ${claim.status}`;
  card.querySelector(".review-status").textContent = claimStatusLabel(claim.status);
});

renderSchemaSummary();
renderCrawlQueue();
renderClaims();
