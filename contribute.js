(function () {
  "use strict";
  const contributionKey = "contributions";
  const approvedPointKey = "approved-points";
  const form = document.querySelector("#contribution-form");
  const preview = document.querySelector("#point-preview");
  const result = document.querySelector("#contribution-result");
  const availablePoint = document.querySelector("#available-point");
  const pendingPoint = document.querySelector("#pending-point");
  const giftResult = document.querySelector("#gift-result");
  let approved = 0;
  let pending = 0;

  function localRows() {
    try { return JSON.parse(window.TaranStorage?.get(contributionKey, "[]") || "[]"); } catch (_error) { return []; }
  }
  function selectedType() { return form?.querySelector('[name="contributionType"]:checked')?.value || "quote"; }
  function uploadedFiles() { return [...(form?.querySelector('[name="evidenceFiles"]')?.files || [])]; }
  function calculatePoints() {
    const type = selectedType();
    const files = uploadedFiles();
    const detailLength = String(form?.includedItems?.value || "").trim().length;
    let points = type === "quote" ? 1000 : type === "vendor" ? 600 : 300;
    if (files.length >= 3) points += 700; else if (files.length) points += 300;
    if (detailLength >= 60) points += 300;
    return Math.min(points, 2500);
  }
  function formatPoint(value) { return `${Number(value || 0).toLocaleString("ko-KR")}P`; }
  function renderWallet() {
    availablePoint.textContent = formatPoint(approved);
    pendingPoint.textContent = formatPoint(pending);
    document.querySelectorAll("#gift-grid button").forEach(button => { button.disabled = approved < Number(button.dataset.cost); });
  }
  function renderPreview() { preview.textContent = formatPoint(calculatePoints()); }

  async function loadWallet() {
    const account = await window.TaranAuth.ready;
    if (window.TaranConfig.isSupabaseConfigured && account) {
      const [ledger, contributions] = await Promise.all([
        window.TaranApi.select(window.TaranConfig.tables.points, { user_id: `eq.${account.id}`, select: "amount" }),
        window.TaranApi.select(window.TaranConfig.tables.contributions, { user_id: `eq.${account.id}`, status: "eq.pending", select: "data" })
      ]);
      approved = ledger.reduce((sum, row) => sum + Number(row.amount || 0), 0);
      pending = contributions.reduce((sum, row) => sum + Number(row.data?.expectedPoints || 0), 0);
    } else if (location.protocol === "file:") {
      approved = Number(window.TaranStorage?.get(approvedPointKey, "0") || 0);
      pending = localRows().filter(item => item.status === "review_pending").reduce((sum, item) => sum + Number(item.points || 0), 0);
    }
    renderWallet();
  }

  async function submitContribution(event) {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    const account = await window.TaranAuth.ready;
    if (window.TaranConfig.isSupabaseConfigured && !account) {
      window.location.href = window.TaranAuth.loginUrl("contribute.html");
      return;
    }
    if (!window.TaranConfig.isSupabaseConfigured && location.protocol !== "file:") {
      result.textContent = "정보 공유 접수는 온라인 저장소 연결 후 이용할 수 있습니다.";
      return;
    }
    button.disabled = true;
    const formData = new FormData(form);
    const files = uploadedFiles();
    const points = calculatePoints();
    try {
      if (window.TaranConfig.isSupabaseConfigured) {
        const filePaths = [];
        for (const file of files) filePaths.push(await window.TaranApi.uploadPrivate(file));
        const rawType = String(formData.get("contributionType"));
        await window.TaranApi.upsert(window.TaranConfig.tables.contributions, {
          user_id: account.id,
          provider_id: null,
          contribution_type: rawType === "vendor" ? "provider_info" : rawType,
          data: {
            providerName: String(formData.get("providerName") || "").trim(), eventType: String(formData.get("eventType") || "").trim(),
            region: String(formData.get("region") || "").trim(), quoteAmount: String(formData.get("quoteAmount") || "").trim(),
            includedItems: String(formData.get("includedItems") || "").trim(), expectedPoints: points
          },
          file_paths: filePaths,
          status: "pending"
        });
      } else {
        const rows = localRows();
        rows.unshift({ id: `contribution-${Date.now()}`, status: "review_pending", points, contributionType: formData.get("contributionType"), providerName: formData.get("providerName"), eventType: formData.get("eventType"), region: formData.get("region"), quoteAmount: formData.get("quoteAmount"), includedItems: formData.get("includedItems"), files: files.map(file => ({ name: file.name, type: file.type, size: file.size })), submittedAt: new Date().toISOString() });
        window.TaranStorage.set(contributionKey, JSON.stringify(rows.slice(0, 80)));
      }
      form.reset();
      renderPreview();
      result.textContent = `공유 내용이 접수되었습니다. 검토 후 최대 ${formatPoint(points)}가 적립됩니다.`;
      await loadWallet();
    } catch (error) { result.textContent = error.message || "공유 내용을 접수하지 못했습니다."; }
    finally { button.disabled = false; }
  }

  async function redeem(event) {
    const button = event.target.closest("button[data-reward-id]");
    if (!button) return;
    if (!window.TaranConfig.isSupabaseConfigured) {
      giftResult.textContent = location.protocol === "file:" ? "미리보기에서는 포인트 교환이 실행되지 않습니다." : "포인트 교환은 온라인 저장소 연결 후 이용할 수 있습니다.";
      return;
    }
    const account = await window.TaranAuth.ready;
    if (!account) { window.location.href = window.TaranAuth.loginUrl("contribute.html"); return; }
    button.disabled = true;
    try {
      await window.TaranApi.rpc("taran_redeem_reward", { p_reward_id: button.dataset.rewardId });
      giftResult.textContent = "교환 신청이 접수되었습니다. 발송 상태는 내 정보에서 확인할 수 있습니다.";
      await loadWallet();
    } catch (error) { giftResult.textContent = error.message || "교환 신청을 처리하지 못했습니다."; }
    finally { button.disabled = false; }
  }

  form?.addEventListener("input", renderPreview);
  form?.addEventListener("change", renderPreview);
  form?.addEventListener("submit", submitContribution);
  document.querySelector("#gift-grid")?.addEventListener("click", redeem);
  renderPreview();
  loadWallet().catch(error => { console.error(error); giftResult.textContent = "포인트 정보를 불러오지 못했습니다."; });
})();
