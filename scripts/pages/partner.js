(async function initializePartnerEditor() {
  "use strict";

  const account = await window.TaranAuth.ready;
  const requestedId = new URLSearchParams(location.search).get("id");
  const notice = document.querySelector("#partner-notice");
  const form = document.querySelector("#partner-form");
  const error = document.querySelector("#partner-error");
  const saveButton = document.querySelector("#partner-save");
  let row = null;

  const setNotice = (message, isError = false) => {
    notice.textContent = message;
    notice.classList.toggle("notice--error", isError);
    notice.hidden = false;
  };
  const value = (id) => document.querySelector(id).value.trim();
  const setValue = (id, next) => { document.querySelector(id).value = String(next || ""); };
  const fact = (facts, ...keys) => keys.map((key) => facts?.[key]).find((item) => String(item || "").trim()) || "";

  if (!account) {
    location.href = window.TaranAuth.loginUrl(`partner.html${requestedId ? `?id=${encodeURIComponent(requestedId)}` : ""}`);
    return;
  }
  if (!window.TaranAuth.isConfigured()) {
    setNotice("온라인 저장소가 연결된 운영 환경에서 이용할 수 있습니다.", true);
    return;
  }

  try {
    const query = { owner_user_id: `eq.${account.id}`, order: "updated_at.desc", limit: 20 };
    if (requestedId) query.id = `eq.${requestedId}`;
    const rows = await window.TaranApi.select(window.TaranConfig.tables.providers, query);
    row = rows[0];
    if (!row) {
      setNotice("승인된 업체가 없습니다. 업체 상세 화면에서 담당자 권한을 먼저 요청해 주세요.", true);
      return;
    }

    const item = row.data || {};
    const facts = item.detailFacts || {};
    setValue("#partner-name", item.name);
    setValue("#partner-category", item.category || item.subcategory);
    setValue("#partner-region", item.region);
    setValue("#partner-area", item.area);
    setValue("#partner-address", item.address || fact(facts, "도로명 주소", "주소"));
    setValue("#partner-ideal", fact(facts, "적정 인원", "권장 인원"));
    setValue("#partner-maximum", fact(facts, "최대 수용인원", "최대 인원", "수용 인원"));
    setValue("#partner-guarantee", fact(facts, "최소 보증 인원", "보증 인원", "최소 주문 인원"));
    setValue("#partner-price", fact(facts, "가격", "가격 안내", "성인 식대", "대관료"));
    setValue("#partner-parking", fact(facts, "주차", "주차 정보", "주차 가능 대수"));
    setValue("#partner-hours", fact(facts, "문의 가능 시간", "영업시간"));
    setValue("#partner-food", fact(facts, "외부 음식", "음식 반입"));
    setValue("#partner-external", fact(facts, "외부 업체", "외부 업체 이용", "돌상 반입"));
    setValue("#partner-policy", fact(facts, "취소·환불", "취소 규정", "환불 규정"));
    document.querySelectorAll('input[name="event"]').forEach((input) => { input.checked = (item.eventTags || []).includes(input.value); });
    document.querySelector("#partner-preview").href = `provider.html?id=${encodeURIComponent(row.id)}`;
    notice.hidden = true;
    form.hidden = false;
  } catch (loadError) {
    setNotice(loadError.message || "업체 정보를 불러오지 못했습니다.", true);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";
    if (!row || !value("#partner-name") || !value("#partner-region") || !value("#partner-area")) {
      error.textContent = "업체명과 지역을 입력해 주세요.";
      return;
    }
    const current = row.data || {};
    const details = { ...(current.detailFacts || {}) };
    const mappings = [
      ["적정 인원", "#partner-ideal"], ["최대 수용인원", "#partner-maximum"], ["최소 보증 인원", "#partner-guarantee"],
      ["가격", "#partner-price"], ["주차", "#partner-parking"], ["문의 가능 시간", "#partner-hours"],
      ["외부 음식", "#partner-food"], ["외부 업체 이용", "#partner-external"], ["취소·환불", "#partner-policy"]
    ];
    mappings.forEach(([label, selector]) => {
      const next = value(selector);
      if (next) details[label] = next; else delete details[label];
    });
    const data = {
      name: value("#partner-name"), category: value("#partner-category"), subcategory: value("#partner-category"),
      region: value("#partner-region"), area: value("#partner-area"), address: value("#partner-address"),
      eventTags: [...document.querySelectorAll('input[name="event"]:checked')].map((input) => input.value),
      detailFacts: details
    };
    saveButton.disabled = true;
    saveButton.textContent = "저장 중…";
    try {
      const updated = await window.TaranApi.rpc("taran_update_owned_provider", { p_provider_id: row.id, p_data: data });
      row = Array.isArray(updated) ? updated[0] : updated;
      setNotice("변경 내용이 저장되었습니다.");
      form.hidden = false;
    } catch (saveError) {
      error.textContent = saveError.message || "저장하지 못했습니다.";
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "변경 내용 저장";
    }
  });
})();
