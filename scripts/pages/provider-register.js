(function () {
  "use strict";
  const form = document.getElementById("register-form");
  const status = document.querySelector("[data-register-status]");
  const next = document.getElementById("register-next");
  const prev = document.getElementById("register-prev");
  const submit = document.getElementById("register-submit");
  let step = 1;

  function show() {
    document.querySelectorAll("[data-register-step]").forEach((section) => { section.hidden = Number(section.dataset.registerStep) !== step; });
    document.querySelectorAll("[data-step-indicator]").forEach((item) => item.classList.toggle("is-current", Number(item.dataset.stepIndicator) === step));
    prev.hidden = step === 1;
    next.hidden = step === 4;
    submit.hidden = step !== 4;
  }
  function validateStep() {
    const section = document.querySelector(`[data-register-step="${step}"]`);
    const required = [...section.querySelectorAll("[required]")];
    return required.every((field) => field.reportValidity());
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
      status: "pending",
      created_at: new Date().toISOString()
    };
  }
  next.addEventListener("click", () => { if (validateStep()) { step += 1; show(); } });
  prev.addEventListener("click", () => { step = Math.max(1, step - 1); show(); });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    status.textContent = "";
    submit.disabled = true;
    submit.classList.add("is-loading");
    try {
      const data = new FormData(form);
      const record = payload(data);
      const proof = data.get("proof");
      if (proof?.size > 10 * 1024 * 1024) throw new Error("확인 자료는 10MB 이하만 올릴 수 있습니다.");
      if (window.TaranConfig?.isSupabaseConfigured) {
        if (proof?.size) record.proof_path = await window.TaranApi.uploadPrivate(proof, "provider-registration");
        await window.TaranApi.rpc("taran_submit_provider_registration", { p_payload: {
          provider_name: record.name,
          region: record.address,
          ...record,
          document_path: record.proof_path || ""
        } });
      } else {
        const drafts = JSON.parse(window.TaranStorage.get("provider-registration-drafts", "[]") || "[]");
        window.TaranStorage.set("provider-registration-drafts", JSON.stringify([record, ...drafts].slice(0, 20)));
      }
      window.TaranAnalytics?.track("provider_registration_submitted", "provider-register.html", { industry: record.industry, eventTags: record.event_tags }).catch(() => {});
      form.hidden = true;
      document.querySelector(".register-steps").hidden = true;
      const complete = document.getElementById("register-complete");
      complete.hidden = false;
      if (!window.TaranConfig?.isSupabaseConfigured) {
        complete.querySelector("h2").textContent = "업체 정보를 이 브라우저에 임시 저장했습니다.";
        complete.querySelector("p").textContent = "온라인 저장소가 연결된 운영 환경에서 로그인하면 실제 등록 요청을 보낼 수 있습니다.";
      }
    } catch (error) {
      status.textContent = error.message || "등록 요청 중 문제가 발생했습니다.";
      submit.disabled = false;
    } finally {
      submit.classList.remove("is-loading");
    }
  });
  show();
})();
