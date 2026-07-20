(async function initializePartnerEditor() {
  "use strict";

  const account = await window.TaranAuth.ready;
  const requestedId = new URLSearchParams(location.search).get("id");
  const notice = document.querySelector("#partner-notice");
  const form = document.querySelector("#partner-form");
  const error = document.querySelector("#partner-error");
  const saveButton = document.querySelector("#partner-save");
  const inquirySection = document.querySelector("#partner-inquiries");
  const inquiryList = document.querySelector("#partner-inquiry-list");
  const inquiryEmpty = document.querySelector("#partner-inquiry-empty");
  const profileHealth = document.querySelector("#partner-profile-health");
  const completenessOutput = document.querySelector("#partner-completeness");
  const progress = document.querySelector(".partner-progress");
  const progressBar = document.querySelector("#partner-progress-bar");
  const missingFields = document.querySelector("#partner-missing-fields");
  const freshnessOutput = document.querySelector("#partner-freshness");
  const responseRate = document.querySelector("#partner-response-rate");
  const responseTime = document.querySelector("#partner-response-time");
  const inquiryStatus = document.querySelector("#partner-inquiry-status");
  let row = null;

  const setNotice = (message, isError = false) => {
    notice.textContent = message;
    notice.classList.toggle("notice--error", isError);
    notice.hidden = false;
  };
  const value = (id) => document.querySelector(id).value.trim();
  const setValue = (id, next) => { document.querySelector(id).value = String(next || ""); };
  const fact = (facts, ...keys) => keys.map((key) => facts?.[key]).find((item) => String(item || "").trim()) || "";
  const money = (value) => value ? `${Number(value).toLocaleString("ko-KR")}원` : "미정";
  const firstNumber = (next) => window.TaranProviderProfile.firstNumber(next);

  function renderProfileHealth(provider) {
    const checks = window.TaranProviderProfile.checks(provider);
    const score = window.TaranProviderProfile.completeness(provider);
    const missing = checks.filter((item) => !item.done).map((item) => item.label);
    const freshness = window.TaranProviderProfile.freshness(provider);
    completenessOutput.textContent = `${score}%`;
    progress.setAttribute("aria-valuenow", String(score));
    progressBar.style.width = `${score}%`;
    missingFields.textContent = missing.length
      ? `추가하면 좋은 정보: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? ` 외 ${missing.length - 4}개` : ""}`
      : "고객 비교에 필요한 기본 정보가 모두 입력되었습니다.";
    freshnessOutput.textContent = freshness.days === null
      ? freshness.label
      : `마지막 확인 ${freshness.days}일 전 · ${freshness.label}`;
    freshnessOutput.dataset.level = freshness.level;
    responseRate.textContent = provider.response_rate === null || provider.response_rate === undefined
      ? "집계 전"
      : `${Math.round(Number(provider.response_rate))}%`;
    responseTime.textContent = window.TaranProviderProfile.responseTime(provider.average_response_minutes);
    inquiryStatus.textContent = provider.inquiry_enabled ? "받는 중" : "일시 중지";
    profileHealth.hidden = false;
  }

  function deadlineLabel(expiresAt) {
    const remaining = new Date(expiresAt || 0).getTime() - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) return "답변 시간이 종료되었습니다.";
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.max(1, Math.ceil((remaining % 3600000) / 60000));
    return hours > 0 ? `답변 마감까지 ${hours}시간 ${minutes}분` : `답변 마감까지 ${minutes}분`;
  }

  async function submitResponse(recipient, group, formElement) {
    const data = new FormData(formElement);
    const available = data.get("available") === "true";
    const response = {
      inquiry_recipient_id: recipient.id,
      provider_user_id: account.id,
      available,
      estimated_price: Number(data.get("estimatedPrice") || 0) || null,
      meal_price: Number(data.get("mealPrice") || 0) || null,
      rental_fee: Number(data.get("rentalFee") || 0) || null,
      minimum_guarantee: Number(data.get("minimumGuarantee") || 0) || null,
      included_items: String(data.get("includedItems") || "").split(",").map((item) => item.trim()).filter(Boolean),
      extra_costs: String(data.get("extraCosts") || "").split(",").map((item) => item.trim()).filter(Boolean),
      response_note: String(data.get("responseNote") || "").trim(),
      updated_at: new Date().toISOString()
    };
    const button = formElement.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await window.TaranApi.upsert(window.TaranConfig.tables.inquiryResponses, response, "inquiry_recipient_id");
      await window.TaranApi.update(window.TaranConfig.tables.inquiryRecipients, {
        status: available ? "responded" : "declined",
        responded_at: new Date().toISOString()
      }, { id: `eq.${recipient.id}` });
      formElement.replaceChildren();
      const complete = document.createElement("p");
      complete.className = "notice";
      complete.textContent = available ? "답변을 보냈습니다." : "진행 불가로 답변했습니다.";
      formElement.append(complete);
    } catch (responseError) {
      const message = formElement.querySelector("[data-response-error]");
      message.textContent = responseError.message || "답변을 보내지 못했습니다.";
      button.disabled = false;
    }
  }

  function inquiryCard(recipient, group) {
    const article = document.createElement("article");
    article.className = "partner-inquiry-card";
    const heading = document.createElement("div");
    heading.className = "partner-inquiry-card__heading";
    const title = document.createElement("h3");
    title.textContent = `${group.event_type} · ${group.guest_count}명`;
    const status = document.createElement("span");
    status.className = "badge";
    status.textContent = recipient.status === "viewed" ? "열람" : "신규 문의";
    heading.append(title, status);
    const deadline = document.createElement("p");
    deadline.className = "partner-inquiry-card__deadline";
    deadline.textContent = deadlineLabel(recipient.expires_at);
    const facts = document.createElement("dl");
    [
      ["희망 지역", group.region],
      ["행사일", group.event_date || (group.date_flexible ? "날짜 협의" : "미정")],
      ["예산", `${money(group.budget_min)} ~ ${money(group.budget_max)}`],
      ["필수 조건", Array.isArray(group.requirements) ? group.requirements.join(", ") : "-"],
      ["요청사항", group.request_note || "-"]
    ].forEach(([label, value]) => {
      const wrapper = document.createElement("div");
      const term = document.createElement("dt");
      term.textContent = label;
      const description = document.createElement("dd");
      description.textContent = value;
      wrapper.append(term, description);
      facts.append(wrapper);
    });
    const responseForm = document.createElement("form");
    responseForm.className = "partner-response-form";
    responseForm.innerHTML = `
      <label>진행 가능 여부<select class="select" name="available" required><option value="true">진행 가능</option><option value="false">진행 불가</option></select></label>
      <label>예상 총액<input class="input" name="estimatedPrice" type="number" min="0" step="10000" placeholder="예: 2500000"></label>
      <label>1인 식대<input class="input" name="mealPrice" type="number" min="0" step="1000"></label>
      <label>대관료<input class="input" name="rentalFee" type="number" min="0" step="10000"></label>
      <label>최소 보증 인원<input class="input" name="minimumGuarantee" type="number" min="0"></label>
      <label class="field--full">포함 항목<input class="input" name="includedItems" placeholder="식사, 대관, 기본 상차림"></label>
      <label class="field--full">추가 비용<input class="input" name="extraCosts" placeholder="주말 가산금, 외부 업체 반입비"></label>
      <label class="field--full">답변 메모<textarea class="textarea" name="responseNote" rows="3"></textarea></label>
      <p class="field__message field__message--error" data-response-error></p>
      <button class="button button--primary" type="submit">고객에게 답변 보내기</button>`;
    responseForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitResponse(recipient, group, responseForm);
    });
    article.append(heading, deadline, facts, responseForm);
    return article;
  }

  async function loadInquiries() {
    try {
      await window.TaranApi.rpc("taran_apply_marketplace_maintenance");
      await window.TaranApi.rpc("taran_acknowledge_provider_notifications", {
        p_provider_id: row.id
      });
    } catch (_error) {
      /* 004 마이그레이션 적용 전에도 기존 문의 목록은 계속 표시합니다. */
    }
    const recipients = await window.TaranApi.select(window.TaranConfig.tables.inquiryRecipients, {
      provider_id: `eq.${row.id}`,
      status: "in.(sent,viewed)",
      order: "sent_at.desc",
      limit: 100
    });
    inquirySection.hidden = false;
    inquiryList.replaceChildren();
    if (!recipients.length) {
      inquiryEmpty.hidden = false;
      return;
    }
    inquiryEmpty.hidden = true;
    const newlyViewed = recipients.filter((recipient) => recipient.status === "sent");
    if (newlyViewed.length) {
      const results = await Promise.allSettled(
        newlyViewed.map((recipient) => window.TaranApi.rpc("taran_mark_inquiry_viewed", {
          p_recipient_id: recipient.id
        }))
      );
      results.forEach((result, index) => {
        if (result.status === "fulfilled") newlyViewed[index].status = "viewed";
      });
    }
    const ids = [...new Set(recipients.map((item) => item.inquiry_group_id))];
    const groups = await window.TaranApi.select(window.TaranConfig.tables.inquiryGroups, {
      id: `in.(${ids.join(",")})`,
      limit: 100
    });
    const groupMap = new Map(groups.map((item) => [item.id, item]));
    recipients.forEach((recipient) => {
      const group = groupMap.get(recipient.inquiry_group_id);
      if (group) inquiryList.append(inquiryCard(recipient, group));
    });
  }

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
    renderProfileHealth(row);
    notice.hidden = true;
    form.hidden = false;
    loadInquiries().catch((inquiryError) => {
      inquirySection.hidden = false;
      inquiryEmpty.hidden = false;
      inquiryEmpty.textContent = inquiryError.message || "견적 문의를 불러오지 못했습니다.";
    });
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
      price: value("#partner-price"),
      eventTags: [...document.querySelectorAll('input[name="event"]:checked')].map((input) => input.value),
      serviceRegions: [value("#partner-region"), value("#partner-area")].filter(Boolean),
      minimumGuests: firstNumber(value("#partner-ideal")),
      maximumGuests: firstNumber(value("#partner-maximum")),
      minimumGuarantee: firstNumber(value("#partner-guarantee")),
      parkingCount: firstNumber(value("#partner-parking")),
      outsideFoodPolicy: value("#partner-food"),
      outsideVendorPolicy: value("#partner-external"),
      cancellationSummary: value("#partner-policy"),
      detailFacts: details
    };
    saveButton.disabled = true;
    saveButton.textContent = "저장 중…";
    try {
      const updated = await window.TaranApi.rpc("taran_update_owned_provider", { p_provider_id: row.id, p_data: data });
      row = Array.isArray(updated) ? updated[0] : updated;
      renderProfileHealth(row);
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
