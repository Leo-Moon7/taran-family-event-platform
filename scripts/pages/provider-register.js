(function () {
  "use strict";

  const form = document.getElementById("register-form");
  const status = document.querySelector("[data-register-status]");
  const next = document.getElementById("register-next");
  const prev = document.getElementById("register-prev");
  const submit = document.getElementById("register-submit");
  const environment = document.querySelector("[data-register-environment]");
  const completeTitle = document.querySelector("[data-register-complete-title]");
  const completeCopy = document.querySelector("[data-register-complete-copy]");
  let step = 1;

  function show() {
    document.querySelectorAll("[data-register-step]").forEach((section) => {
      const active = Number(section.dataset.registerStep) === step;
      section.hidden = !active;
      section.querySelectorAll("input, select, textarea").forEach((field) => {
        field.disabled = field.hasAttribute("data-always-disabled") || !active;
      });
    });
    document.querySelectorAll("[data-step-indicator]").forEach((item) => {
      item.classList.toggle("is-current", Number(item.dataset.stepIndicator) === step);
    });
    prev.hidden = step === 1;
    next.hidden = step === 4;
    submit.hidden = step !== 4;
    status.textContent = "";
  }

  function errorMessage(field) {
    const label = field.labels?.[0]?.textContent?.trim() || "필수 항목";
    if (field.validity.valueMissing) return `“${label}” 항목을 입력하거나 선택해 주세요.`;
    if (field.validity.typeMismatch) return field.type === "email" ? "이메일 주소 형식을 확인해 주세요." : "입력 형식을 확인해 주세요.";
    if (field.validity.rangeUnderflow) return `${field.min} 이상의 값을 입력해 주세요.`;
    if (field.validity.tooLong) return `${field.maxLength}자 이내로 입력해 주세요.`;
    return "입력 내용을 다시 확인해 주세요.";
  }

  function clearErrors(section) {
    section.querySelectorAll(".field-error").forEach((error) => error.remove());
    section.querySelectorAll("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
    section.querySelector(".choice-set")?.removeAttribute("aria-invalid");
  }

  function showFieldError(field, message) {
    field.setAttribute("aria-invalid", "true");
    const error = document.createElement("small");
    error.className = "field-error";
    error.textContent = message;
    field.insertAdjacentElement("afterend", error);
  }

  function validateStep() {
    const section = document.querySelector(`[data-register-step="${step}"]`);
    clearErrors(section);
    const required = [...section.querySelectorAll("[required]")];
    const invalid = required.filter((field) => !field.checkValidity());
    invalid.forEach((field) => showFieldError(field, errorMessage(field)));

    if (step === 2 && !section.querySelector('input[name="eventTags"]:checked')) {
      const choiceSet = section.querySelector(".choice-set");
      choiceSet.setAttribute("aria-invalid", "true");
      const error = document.createElement("small");
      error.className = "field-error field-error--group";
      error.textContent = "진행 가능한 행사를 한 개 이상 선택해 주세요.";
      choiceSet.insertAdjacentElement("afterend", error);
      status.textContent = error.textContent;
      section.querySelector('input[name="eventTags"]')?.focus();
      return false;
    }

    const minimum = Number(section.querySelector('[name="minimumGuests"]')?.value || 0);
    const maximumField = section.querySelector('[name="maximumGuests"]');
    const maximum = Number(maximumField?.value || 0);
    if (step === 2 && minimum && maximum && minimum > maximum) {
      showFieldError(maximumField, "최대 수용 인원은 최소 수용 인원보다 커야 합니다.");
      status.textContent = "수용 인원 범위를 다시 확인해 주세요.";
      maximumField.focus();
      return false;
    }

    if (invalid.length) {
      status.textContent = "표시된 입력 항목을 확인해 주세요.";
      invalid[0].focus();
      return false;
    }
    status.textContent = "";
    return true;
  }

  function collectFormData() {
    const controls = [...form.querySelectorAll("input, select, textarea")];
    controls.forEach((field) => {
      if (!field.hasAttribute("data-always-disabled")) field.disabled = false;
    });
    const data = new FormData(form);
    show();
    return data;
  }

  function payload(data) {
    return {
      id: crypto.randomUUID(),
      name: String(data.get("name") || "").trim(),
      industry: String(data.get("industry") || ""),
      address: String(data.get("address") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      official_link: String(data.get("officialLink") || "").trim(),
      event_tags: data.getAll("eventTags"),
      minimum_guests: Number(data.get("minimumGuests") || 0) || null,
      maximum_guests: Number(data.get("maximumGuests") || 0) || null,
      minimum_guarantee: Number(data.get("minimumGuarantee") || 0) || null,
      rental_fee: Number(data.get("rentalFee") || 0) || null,
      adult_meal_price_min: Number(data.get("adultMealPriceMin") || 0) || null,
      parking_count: Number(data.get("parkingCount") || 0) || null,
      package_description: String(data.get("packageDescription") || "").trim(),
      private_space: data.get("privateSpace") === "on",
      outside_food: data.get("outsideFood") === "on",
      outside_vendor: data.get("outsideVendor") === "on",
      wheelchair: data.get("wheelchair") === "on",
      owner_name: String(data.get("ownerName") || "").trim(),
      owner_email: String(data.get("ownerEmail") || "").trim(),
      consent_version: String(data.get("privacyConsent") || ""),
      status: "pending",
      created_at: new Date().toISOString()
    };
  }

  next.addEventListener("click", () => {
    if (!validateStep()) return;
    step += 1;
    show();
    document.querySelector(`[data-register-step="${step}"] h2`)?.setAttribute("tabindex", "-1");
    document.querySelector(`[data-register-step="${step}"] h2`)?.focus();
  });
  prev.addEventListener("click", () => {
    step = Math.max(1, step - 1);
    show();
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    status.textContent = "";
    submit.disabled = true;
    submit.classList.add("is-loading");
    try {
      const data = collectFormData();
      const record = payload(data);
      if (window.TaranConfig?.isSupabaseConfigured) {
        const account = await window.TaranAuth?.ready;
        if (!account) throw new Error("업체 등록은 로그인 후 제출할 수 있습니다.");
        await window.TaranApi.rpc("taran_submit_provider_registration", { p_payload: {
          provider_name: record.name,
          region: record.address,
          ...record,
          document_path: ""
        } });
        completeTitle.textContent = "업체 등록 신청이 접수되었습니다.";
        completeCopy.textContent = "담당자 관계와 입력 정보를 확인한 뒤 공개 가능 여부를 안내합니다.";
        window.TaranAnalytics?.track("provider_registration_submitted", "provider-register.html", {
          industry: record.industry,
          eventTags: record.event_tags
        }).catch(() => {});
      } else {
        completeTitle.textContent = "입력 내용 확인을 마쳤습니다.";
        completeCopy.textContent = "현재 온라인 미리보기에서는 신청 내용을 서버나 브라우저에 저장하지 않습니다. 실제 접수 연결 후 다시 제출해 주세요.";
      }
      form.hidden = true;
      document.querySelector(".register-steps").hidden = true;
      const complete = document.getElementById("register-complete");
      complete.hidden = false;
      status.textContent = window.TaranConfig?.isSupabaseConfigured
        ? "등록 신청을 접수했습니다."
        : "미리보기 확인을 마쳤습니다. 입력 내용은 저장하지 않았습니다.";
      complete.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      status.textContent = error.message || "등록 요청 중 문제가 발생했습니다.";
      submit.disabled = false;
    } finally {
      submit.classList.remove("is-loading");
    }
  });

  if (environment) {
    const online = Boolean(window.TaranConfig?.isSupabaseConfigured);
    environment.classList.toggle("is-online", online);
    environment.querySelector("strong").textContent = online ? "온라인 등록 접수 연결됨" : "현재는 등록 화면 미리보기입니다.";
    environment.querySelector("p").textContent = online
      ? "제출 전 로그인 상태를 확인하며, 사업자 확인 자료는 이 화면에서 받지 않습니다."
      : "입력 내용을 서버나 브라우저에 저장하지 않습니다. 실제 접수가 연결되면 다시 안내합니다.";
    submit.textContent = online ? "등록 신청 제출" : "입력 내용 확인";
  }
  show();
})();
