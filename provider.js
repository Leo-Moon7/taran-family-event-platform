Promise.resolve(window.memoaContentReady).finally(() => {
const providerParams = new URLSearchParams(window.location.search);
const providerId = providerParams.get("id");
const provider = (window.publicDirectoryData || []).find(item => item.id === providerId);
const contributionStorageKey = "memoa-provider-contributions";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function formatWon(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? `${number.toLocaleString("ko-KR")}원` : "";
}

function displayDate(value) {
  if (!value) return "날짜 미표기";
  return String(value).replaceAll("-", ".");
}

function isReadyValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  if (/^[-–—]+$/.test(text)) return false;
  return !/(상담\s*시\s*안내|확인\s*필요|확인\s*예정|미확인|미정|문의|없음|준비\s*중)/i.test(text);
}

function displayValue(value) {
  return isReadyValue(value) ? String(value).trim() : "";
}

function firstReadyFact(facts, labels) {
  for (const label of labels) {
    const ready = displayValue(facts?.[label]);
    if (ready) return ready;
  }
  return "";
}

function addFact(rows, label, value) {
  const ready = displayValue(value);
  if (ready) rows.push([label, ready]);
}

function safeWebsiteUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname ? url.href : "#";
  } catch (_) {
    return "#";
  }
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const isAllowed =
      host === "naver.com" ||
      host.endsWith(".naver.com") ||
      host === "naver.me" ||
      host.endsWith(".naver.me");
    return (url.protocol === "https:" || url.protocol === "http:") && isAllowed ? url.href : "#";
  } catch (_) {
    return "#";
  }
}

function providerFacts(item) {
  const facts = item.detailFacts || {};
  const official = item.officialVerification || {};
  const rows = [];

  addFact(rows, "업체명", facts["업체명"] || item.name);
  addFact(rows, "업종", facts["업종"] || item.subcategory || item.category);
  addFact(rows, "주소", facts["도로명 주소"] || facts["주소"] || official.roadAddress || official.address);
  addFact(rows, "공간·서비스", facts["공간/서비스"] || facts["공간·서비스"] || item.subcategory || item.category);

  const price =
    Number(item.price) > 0
      ? `${item.priceLabel || "예상가"} ${formatWon(item.price)}`
      : firstReadyFact(facts, ["가격", "가격 단서", "예상가", "대관료", "시간당 대관료", "식대", "성인 식대"]);
  addFact(rows, "가격", price);

  addFact(rows, "최소 수용인원", firstReadyFact(facts, ["최소 수용인원", "최소 인원", "기준 인원", "최소 주문", "보증 인원"]));
  addFact(rows, "최대 수용인원", firstReadyFact(facts, ["최대 수용인원", "최대 인원", "최대 수용", "수용 인원"]));
  addFact(rows, "주차", firstReadyFact(facts, ["주차", "주차 정보", "주차 단서"]));
  addFact(rows, "가능 행사", facts["가능 행사"] || (item.tags || []).filter(tag => /결혼|아이|부모님|가족|홈파티|돌|백일|환갑|칠순/.test(tag)).slice(0, 4).join(", "));

  const officialHref = item.officialLink || official.link;
  if (officialHref) addFact(rows, "공식 채널", "연결 가능");

  const skipLabels = new Set([
    "업체명",
    "업종",
    "주소",
    "도로명 주소",
    "공간/서비스",
    "공간·서비스",
    "가격",
    "가격 단서",
    "예상가",
    "대관료",
    "시간당 대관료",
    "식대",
    "성인 식대",
    "최소 수용인원",
    "최소 인원",
    "기준 인원",
    "최소 주문",
    "보증 인원",
    "최대 수용인원",
    "최대 인원",
    "최대 수용",
    "수용 인원",
    "주차",
    "주차 정보",
    "주차 단서",
    "전화",
    "주요 행사 지역",
    "가능 행사",
    "공식 채널"
  ]);
  const usedLabels = new Set(rows.map(([label]) => label));

  Object.entries(facts).forEach(([label, value]) => {
    if (skipLabels.has(label) || usedLabels.has(label)) return;
    if (!isReadyValue(value)) return;
    rows.push([label, value]);
  });

  return rows.slice(0, 10);
}

function renderToolStrip() {
  document.querySelectorAll(".provider-tool-strip a").forEach(link => {
    if (!link.querySelector(".tool-arrow")) {
      link.insertAdjacentHTML("beforeend", '<i class="tool-arrow" aria-hidden="true">→</i>');
    }
  });
}

function renderReviews(item) {
  const externalReviews = Array.isArray(item.externalReviews) ? item.externalReviews : [];
  const count = document.querySelector("#provider-external-review-count");
  const list = document.querySelector("#provider-external-review-list");
  const section = document.querySelector("#provider-external-reviews");
  if (!section || !list) return;

  section.hidden = false;
  if (count) count.textContent = externalReviews.length.toLocaleString("ko-KR");

  if (!externalReviews.length) {
    list.innerHTML = `
      <article class="provider-review-empty">
        <strong>아직 연결된 외부 후기가 없습니다.</strong>
        <p>견적서나 방문 경험이 공유되면 이 영역에 후기 원문과 참고 정보를 연결합니다.</p>
        <a href="#provider-quotes">견적·정보 공유하기 →</a>
      </article>
    `;
    return;
  }

  list.innerHTML = externalReviews
    .map(review => {
      const url = safeExternalUrl(review.url);
      return `<article class="provider-review-card">
        <div><span>네이버 블로그</span><time>${escapeHtml(displayDate(review.publishedDate))}</time></div>
        <h3>${escapeHtml(review.title || "후기 원문")}</h3>
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer nofollow"${url === "#" ? " aria-disabled=\"true\"" : ""}>후기 원문 보기 →</a>
      </article>`;
    })
    .join("");
}

function renderProvider() {
  renderToolStrip();

  if (!provider) {
    document.querySelector("#provider-name").textContent = "업체 정보를 찾을 수 없습니다.";
    document.querySelector("#provider-intro").textContent = "업체 전체보기에서 다시 선택해 주세요.";
    document.querySelector("#provider-facts-section")?.setAttribute("hidden", "");
    document.querySelector("#provider-external-reviews")?.setAttribute("hidden", "");
    return;
  }

  document.title = `${provider.name} | 메모아`;
  document.querySelector("#provider-category").textContent = `${provider.category || "업체"} · ${provider.subcategory || "가족행사"}`;
  document.querySelector("#provider-name").textContent = provider.name;
  document.querySelector("#provider-intro").textContent = provider.intro || "가족행사 상담을 검토할 수 있는 파트너입니다.";
  document.querySelector("#provider-image").src = provider.image || "assets/images/venue-partyroom.webp";

  document.querySelector("#provider-tags").innerHTML = (provider.tags || [])
    .slice(0, 8)
    .map(tag => `<span>${escapeHtml(tag)}</span>`)
    .join("");

  const priceCard = document.querySelector(".provider-price-card");
  if (Number(provider.price) > 0) {
    document.querySelector("#provider-price-label").textContent = provider.priceLabel || "예상가";
    document.querySelector("#provider-price").textContent = formatWon(provider.price);
  } else if (priceCard) {
    priceCard.hidden = true;
  }

  const officialLink = document.querySelector("#provider-official-link");
  const officialHref = safeWebsiteUrl(provider.officialLink || provider.officialVerification?.link || "");
  if (officialLink && officialHref !== "#") {
    officialLink.href = officialHref;
    officialLink.hidden = false;
  }

  const facts = providerFacts(provider);
  const factsSection = document.querySelector("#provider-facts-section");
  const factsGrid = document.querySelector("#provider-facts");
  if (factsSection) factsSection.hidden = !facts.length;
  if (factsGrid) {
    factsGrid.innerHTML = facts
      .map(([label, value]) => `<div class="provider-fact-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
      .join("");
  }

  const checks = (provider.checkpoints || []).filter(isReadyValue);
  const checksSection = document.querySelector("#provider-checks")?.closest(".detail-section-card");
  if (checksSection) checksSection.hidden = !checks.length;
  document.querySelector("#provider-checks").innerHTML = checks
    .map(check => `<li>${escapeHtml(check)}</li>`)
    .join("");

  renderReviews(provider);

  const contributionForm = document.querySelector("#provider-contribution-form");
  const contributionResult = document.querySelector("#provider-contribution-result");
  if (contributionForm) {
    contributionForm.addEventListener("submit", event => {
      event.preventDefault();
      const formData = new FormData(contributionForm);
      const stored = JSON.parse(localStorage.getItem(contributionStorageKey) || "[]");
      const fileInput = contributionForm.querySelector('[name="quoteFiles"]');
      const files = [...(fileInput?.files || [])].map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }));

      stored.unshift({
        providerId: provider.id,
        providerName: provider.name,
        eventType: formData.get("eventType"),
        guestCount: formData.get("guestCount"),
        quoteAmount: formData.get("quoteAmount"),
        includedItems: formData.get("includedItems"),
        files,
        submittedAt: new Date().toISOString()
      });

      localStorage.setItem(contributionStorageKey, JSON.stringify(stored.slice(0, 50)));
      contributionForm.reset();
      if (contributionResult) {
        contributionResult.textContent = "공유 내용이 저장되었습니다. 확인 절차가 끝나면 포인트가 지급됩니다.";
      }
    });
  }
}

renderProvider();
});
