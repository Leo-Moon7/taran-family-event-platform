(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const providerId = params.get("id");
  const provider = [...(window.publicDirectoryData || []), ...(window.publicVenueData || [])].find(item => item.id === providerId);
  const form = document.querySelector("#claim-form");
  const errorRoot = document.querySelector("#claim-error");
  const submitButton = form?.querySelector("[type='submit']");
  const phoneInput = document.querySelector("#claim-phone");
  const businessInput = document.querySelector("#claim-business-number");

  function formatPhone(value) {
    const numbers = String(value || "").replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }

  function formatBusinessNumber(value) {
    const numbers = String(value || "").replace(/\D/g, "").slice(0, 10);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5)}`;
  }

  function showError(message) {
    if (errorRoot) errorRoot.textContent = message || "";
  }

  function showComplete() {
    if (form) form.hidden = true;
    const side = document.querySelector(".claim-side");
    if (side) side.hidden = true;
    const result = document.querySelector("#claim-result");
    if (result) result.hidden = false;
  }

  async function submitClaim(event) {
    event.preventDefault();
    showError("");
    const account = await window.TaranAuth.ready;
    if (!account) {
      window.location.href = window.TaranAuth.loginUrl(`claim.html${window.location.search}`);
      return;
    }
    if (!window.TaranConfig?.isSupabaseConfigured) {
      showError("온라인 저장 연결 후 이용할 수 있습니다.");
      return;
    }
    if (!provider) {
      showError("권한을 요청할 업체 정보를 찾을 수 없습니다.");
      return;
    }

    const managerName = document.querySelector("#claim-manager").value.trim();
    const workEmail = document.querySelector("#claim-email").value.trim();
    const phone = phoneInput.value;
    const businessNumber = businessInput.value;
    const documentFile = document.querySelector("#claim-document").files[0];
    const consent = document.querySelector("#claim-consent").checked;
    const adInterest = document.querySelector("#claim-ad-interest").checked;
    const eventTypes = [...document.querySelectorAll("#claim-event-tags input:checked")].map(input => input.value);

    if (managerName.length < 2 || !/^\S+@\S+\.\S+$/.test(workEmail) || !/^010-\d{4}-\d{4}$/.test(phone) || !/^\d{3}-\d{2}-\d{5}$/.test(businessNumber)) {
      showError("담당자 정보와 사업자등록번호 형식을 확인해 주세요.");
      return;
    }
    if (!documentFile || !consent) {
      showError("사업자 확인 서류를 선택하고 개인정보 수집에 동의해 주세요.");
      return;
    }
    if (!eventTypes.length) {
      showError("진행 가능한 행사를 한 개 이상 선택해 주세요.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "서류를 안전하게 전송하는 중…";
    try {
      const documentPath = await window.TaranApi.uploadPrivate(documentFile, "provider-claims");
      await window.TaranApi.upsert(window.TaranConfig.tables.providerClaims, {
        user_id: account.id,
        provider_id: provider.id,
        provider_name: provider.name,
        manager_name: managerName,
        work_email: workEmail,
        phone,
        business_number: businessNumber,
        event_types: eventTypes,
        document_path: documentPath,
        ad_interest: adInterest,
        status: "pending",
        updated_at: new Date().toISOString()
      }, "user_id,provider_id");
      showComplete();
    } catch (error) {
      showError(error.message || "권한 요청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      submitButton.disabled = false;
      submitButton.textContent = "무료 수정 권한 검수 요청";
    }
  }

  async function init() {
    if (!provider) {
      showError("권한을 요청할 업체를 선택해 주세요.");
      if (submitButton) submitButton.disabled = true;
      return;
    }
    document.querySelector("#claim-venue-name").textContent = provider.name;
    document.querySelector("#claim-venue-meta").textContent = [provider.region, provider.area, provider.type].filter(Boolean).join(" · ");
    document.querySelector("#claim-login-link").href = window.TaranAuth.loginUrl(`claim.html${window.location.search}`);
    const account = await window.TaranAuth.ready;
    if (account) {
      document.querySelector("#claim-login-link").hidden = true;
      const email = document.querySelector("#claim-email");
      if (email && !email.value) email.value = account.email || "";
    }
  }

  phoneInput?.addEventListener("input", () => { phoneInput.value = formatPhone(phoneInput.value); });
  businessInput?.addEventListener("input", () => { businessInput.value = formatBusinessNumber(businessInput.value); });
  form?.addEventListener("submit", submitClaim);
  init().catch(error => showError(error.message));
})();
