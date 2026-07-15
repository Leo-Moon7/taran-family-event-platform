const contributionKey = "nopoom-contributions";
const approvedPointKey = "nopoom-approved-points";

const form = document.querySelector("#contribution-form");
const preview = document.querySelector("#point-preview");
const result = document.querySelector("#contribution-result");
const availablePoint = document.querySelector("#available-point");
const pendingPoint = document.querySelector("#pending-point");
const giftResult = document.querySelector("#gift-result");

function storedContributions() {
  try {
    return JSON.parse(localStorage.getItem(contributionKey) || "[]");
  } catch {
    return [];
  }
}

function approvedPoints() {
  return Number(localStorage.getItem(approvedPointKey) || 0);
}

function pendingPoints() {
  return storedContributions()
    .filter(item => item.status === "review_pending")
    .reduce((sum, item) => sum + Number(item.points || 0), 0);
}

function selectedContributionType() {
  return form?.querySelector('[name="contributionType"]:checked')?.value || "quote";
}

function uploadedFiles() {
  return [...(form?.querySelector('[name="evidenceFiles"]')?.files || [])];
}

function calculatePoints() {
  const type = selectedContributionType();
  const files = uploadedFiles();
  const detailLength = String(form?.includedItems?.value || "").trim().length;
  let points = type === "quote" ? 1000 : type === "vendor" ? 600 : 300;
  if (files.length >= 3) points += 700;
  else if (files.length > 0) points += 300;
  if (detailLength >= 60) points += 300;
  return Math.min(points, 2500);
}

function formatPoint(value) {
  return `${Number(value || 0).toLocaleString("ko-KR")}P`;
}

function renderWallet() {
  const approved = approvedPoints();
  const pending = pendingPoints();
  availablePoint.textContent = formatPoint(approved);
  pendingPoint.textContent = formatPoint(pending);
  document.querySelectorAll("#gift-grid button").forEach(button => {
    const cost = Number(button.dataset.cost);
    button.disabled = approved < cost;
  });
}

function renderPreview() {
  preview.textContent = formatPoint(calculatePoints());
}

form?.addEventListener("input", renderPreview);
form?.addEventListener("change", renderPreview);

form?.addEventListener("submit", event => {
  event.preventDefault();
  const formData = new FormData(form);
  const files = uploadedFiles().map(file => ({
    name: file.name,
    type: file.type,
    size: file.size
  }));
  const points = calculatePoints();
  const stored = storedContributions();
  stored.unshift({
    id: `contribution-${Date.now()}`,
    status: "review_pending",
    points,
    contributionType: formData.get("contributionType"),
    providerName: formData.get("providerName"),
    eventType: formData.get("eventType"),
    region: formData.get("region"),
    quoteAmount: formData.get("quoteAmount"),
    includedItems: formData.get("includedItems"),
    files,
    submittedAt: new Date().toISOString()
  });
  localStorage.setItem(contributionKey, JSON.stringify(stored.slice(0, 80)));
  form.reset();
  renderPreview();
  renderWallet();
  result.textContent = `공유 내용이 저장되었습니다. 예상 ${formatPoint(points)}가 확인 후 적립됩니다.`;
});

document.querySelector("#gift-grid")?.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  const cost = Number(button.dataset.cost);
  const approved = approvedPoints();
  if (approved < cost) {
    giftResult.textContent = `현재 승인 완료 포인트가 부족합니다. ${formatPoint(cost)}부터 교환할 수 있어요.`;
    return;
  }
  localStorage.setItem(approvedPointKey, String(approved - cost));
  renderWallet();
  giftResult.textContent = "교환 신청이 접수되었습니다. 실제 서비스에서는 기프티콘 발송 정보를 확인합니다.";
});

renderPreview();
renderWallet();
