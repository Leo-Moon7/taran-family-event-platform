(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const type = String(params.get("type") || "").trim();
  const providerId = String(params.get("providerId") || "").trim().slice(0, 40);
  const providerName = String(params.get("providerName") || "").trim().slice(0, 160);
  const sourceType = String(params.get("sourceType") || "").trim().slice(0, 120);
  const observedAt = String(params.get("observedAt") || "").trim().slice(0, 20);
  const sourceUrlValue = String(params.get("sourceUrl") || "").trim();
  const isProviderCorrection = type === "information-error" && /^NVR-DOL-\d{3}$/.test(providerId) && Boolean(providerName);

  function safeHttpUrl(value) {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_error) { return ""; }
  }

  const typeSelect = document.querySelector("#contact-type");
  if (typeSelect && [...typeSelect.options].some((option) => option.value === type)) typeSelect.value = type;
  if (!isProviderCorrection) return;

  const context = document.querySelector("#contact-provider-context");
  const providerIdInput = document.querySelector("#contact-provider-id");
  const providerNameInput = document.querySelector("#contact-provider-name");
  const source = document.querySelector("#contact-provider-source");
  const relatedPage = document.querySelector("#contact-page-url");
  const message = document.querySelector("#contact-message");
  const sourceUrl = safeHttpUrl(sourceUrlValue);

  context.hidden = false;
  providerIdInput.value = providerId;
  providerNameInput.value = providerName;
  source.textContent = [sourceType ? `정보 출처: ${sourceType}` : "업체 상세 페이지 정보", observedAt ? `정보 업데이트 ${observedAt}` : ""].filter(Boolean).join(" · ");
  relatedPage.value = new URL(`provider.html?id=${encodeURIComponent(providerId)}`, window.location.href).href;
  if (!message.value) {
    message.value = [
      `[업체 정보 수정 제안]`,
      `업체 ID: ${providerId}`,
      `업체명: ${providerName}`,
      observedAt ? `정보 업데이트: ${observedAt}` : "",
      sourceUrl ? `현재 확인한 페이지: ${sourceUrl}` : "",
      "",
      "수정이 필요한 항목:",
      "정확한 정보:",
      "확인 가능한 공개 출처:",
      "요청 내용:"
    ].filter((line) => line !== "").join("\n");
  }
})();
