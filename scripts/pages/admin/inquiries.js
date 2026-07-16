(function () {
  "use strict";
  const { element, readJson, setEmptyState } = window.TaranAdmin;
  const table = document.querySelector("[data-admin-table]");
  const empty = document.querySelector("[data-admin-empty]");
  let rows = [];
  let access;
  function statusLabel(value) { return ({ pending: "검토 대기", approved: "승인", rejected: "반려", contacted: "연락 완료", completed: "처리 완료", cancelled: "취소" })[value] || value || "검토 대기"; }
  async function reviewContribution(item, approve, button) {
    button.disabled = true;
    try { await window.TaranApi.rpc("taran_review_contribution", { p_contribution_id: item.id, p_approve: approve }); await load(); }
    catch (error) { alert(error.message || "처리하지 못했습니다."); }
    finally { button.disabled = false; }
  }
  function render() {
    table?.replaceChildren();
    rows.forEach(item => {
      const row = document.createElement("tr");
      [String(item.createdAt || "").slice(0, 10), item.kind, item.providerName || "-", item.eventType || "-", item.amount || "-", statusLabel(item.status)]
        .forEach(value => row.append(element("td", value)));
      const manage = document.createElement("td");
      if (access.mode === "online" && item.source === "contribution" && item.status === "pending") {
        const approve = element("button", "승인", "admin-text-button"); approve.type = "button"; approve.addEventListener("click", () => reviewContribution(item, true, approve));
        const reject = element("button", "반려", "admin-text-button"); reject.type = "button"; reject.addEventListener("click", () => reviewContribution(item, false, reject));
        manage.append(approve, reject);
      }
      row.append(manage); table?.append(row);
    });
    setEmptyState(empty, rows.length);
  }
  async function load() {
    if (access.mode === "online") {
      const [inquiries, contributions] = await Promise.all([
        window.TaranAdminData.list("inquiries", { order: "created_at.desc" }), window.TaranAdminData.list("contributions", { order: "created_at.desc" })
      ]);
      rows = [
        ...inquiries.map(item => ({ id: item.id, source: "inquiry", kind: "견적 문의", createdAt: item.created_at, providerName: item.provider_name, eventType: item.event_type, amount: item.budget, status: item.status })),
        ...contributions.map(item => ({ id: item.id, source: "contribution", kind: item.contribution_type === "quote" ? "견적 공유" : item.contribution_type === "photo" ? "사진 공유" : "업체 정보", createdAt: item.created_at, providerName: item.data?.providerName, eventType: item.data?.eventType, amount: item.data?.quoteAmount || `${Number(item.data?.expectedPoints || 0).toLocaleString("ko-KR")}P`, status: item.status }))
      ].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    } else rows = readJson("provider-contributions", []).map(item => ({ ...item, kind: "정보 공유", createdAt: item.submittedAt, amount: item.quoteAmount, source: "local" }));
    render();
  }
  async function init() { access = await window.TaranAdminReady; if (!access.allowed) return; await load(); }
  init().catch(error => console.error("견적과 정보 공유 목록을 불러오지 못했습니다.", error));
})();
