(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const type = String(params.get("type") || "").trim();
  const providerId = String(params.get("providerId") || "").trim().slice(0, 40);
  const providerName = String(params.get("providerName") || "").trim().slice(0, 160);
  const sourceType = String(params.get("sourceType") || "").trim().slice(0, 120);
  const observedAt = String(params.get("observedAt") || "").trim().slice(0, 20);
  const sourceUrlValue = String(params.get("sourceUrl") || "").trim();
  const isCandidateCorrection = type === "information-error" && /^NVR-DOL-\d{3}$/.test(providerId) && Boolean(providerName);

  function safeHttpUrl(value) {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_error) { return ""; }
  }

  const typeSelect = document.querySelector("#contact-type");
  if (typeSelect && [...typeSelect.options].some((option) => option.value === type)) typeSelect.value = type;
  if (!isCandidateCorrection) return;

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
  source.textContent = [sourceType || "NAVER 지역검색 API 관측", observedAt ? `관측일 ${observedAt}` : ""].filter(Boolean).join(" · ");
  relatedPage.value = new URL(`provider.html?id=${encodeURIComponent(providerId)}`, window.location.href).href;
  if (!message.value) {
    message.value = [
      `[정보 확인 전 후보 수정 제안]`,
      `업체 ID: ${providerId}`,
      `업체명: ${providerName}`,
      `관측 출처: ${sourceType || "NAVER 지역검색 API 관측"}`,
      `관측일: ${observedAt || "확인 전"}`,
      sourceUrl ? `검색 결과 확인 링크: ${sourceUrl}` : "",
      "",
      "수정이 필요한 항목:",
      "확인 가능한 공개 출처:",
      "요청 내용:"
    ].filter((line) => line !== "").join("\n");
  }
})();
