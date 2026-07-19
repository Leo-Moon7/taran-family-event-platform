(function () {
  "use strict";

  const form = document.getElementById("inquiry-form");
  const status = document.querySelector("[data-inquiry-status]");
  const providerBox = document.getElementById("inquiry-providers");
  const ids = window.TaranInquiryFlow.providerIds();
  const providers = ids.map((id) => (window.publicDirectoryData || []).find((item) => String(item.id) === id)).filter(Boolean);
  const params = new URLSearchParams(location.search);

  function prefill() {
    const fields = {
      eventType: params.get("event"),
      region: params.get("region"),
      guestCount: params.get("guests"),
      budgetMax: params.get("budget"),
      eventDate: params.get("date")
    };
    Object.entries(fields).forEach(([name, value]) => {
      const element = form.elements.namedItem(name);
      if (element && value) element.value = value;
    });
  }

  function renderProviders() {
    providerBox.replaceChildren();
    if (!providers.length) {
      const message = document.createElement("p");
      message.textContent = "문의할 업체가 선택되지 않았습니다.";
      providerBox.append(message);
      form.querySelector('[type="submit"]').disabled = true;
      return;
    }
    providers.forEach((provider) => {
      const article = document.createElement("article");
      const name = document.createElement("strong");
      name.textContent = provider.name;
      const area = document.createElement("span");
      area.textContent = [provider.region, provider.area].filter(Boolean).join(" ");
      article.append(name, area);
      providerBox.append(article);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    const button = form.querySelector('[type="submit"]');
    const payload = window.TaranInquiryFlow.normalize(new FormData(form), providers.map((item) => String(item.id)));
    if (payload.budgetMin && payload.budgetMax && payload.budgetMin > payload.budgetMax) {
      status.textContent = "최대 예산은 최소 예산보다 커야 합니다.";
      return;
    }
    button.disabled = true;
    button.classList.add("is-loading");
    try {
      const result = await window.TaranInquiryFlow.submit(payload);
      window.TaranAnalytics?.track("inquiry_submitted", "inquiry.html", { providerCount: providers.length, eventType: payload.event_type }).catch(() => {});
      form.parentElement.hidden = true;
      const complete = document.getElementById("inquiry-complete");
      complete.hidden = false;
      if (result.mode === "local") {
        complete.querySelector("h2").textContent = "문의 내용을 이 브라우저에 임시 저장했습니다.";
        complete.querySelector("p").textContent = "온라인 저장소가 연결되기 전에는 업체로 전송되지 않습니다.";
        complete.querySelector('a[href^="account"]')?.remove();
      }
    } catch (error) {
      status.textContent = error.message || "문의 접수 중 문제가 발생했습니다.";
      button.disabled = false;
    } finally {
      button.classList.remove("is-loading");
    }
  });

  prefill();
  renderProviders();
})();
