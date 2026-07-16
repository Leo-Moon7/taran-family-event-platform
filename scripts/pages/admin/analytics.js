(function () {
  "use strict";
  const { element, setEmptyState } = window.TaranAdmin;
  async function init() {
    const access = await window.TaranAdminReady;
    if (!access.allowed) return;
    const rows = access.mode === "online" ? await window.TaranAdminData.list("adminEvents", { order: "created_at.desc", limit: 200 }) : [];
    const today = new Date().toISOString().slice(0, 10);
    const todayRows = rows.filter(item => String(item.created_at || "").startsWith(today));
    const uniquePages = new Set(rows.map(item => item.page_path).filter(Boolean));
    const metrics = document.querySelector("[data-admin-metrics]");
    [["오늘 기록", todayRows.length], ["최근 기록", rows.length], ["이용 화면", uniquePages.size]].forEach(([label, value]) => {
      const card = element("article", undefined, "admin-metric");
      card.append(element("span", label), element("strong", value));
      metrics?.append(card);
    });
    const period = document.querySelector("[data-admin-period]");
    if (period) period.textContent = rows.length ? `최근 ${rows.length}개 실제 기록 · 마지막 집계 ${rows[0]?.created_at || "-"}` : "실제 이용 기록이 쌓이면 표시합니다.";
    const table = document.querySelector("[data-admin-table]");
    rows.slice(0, 50).forEach(item => {
      const row = document.createElement("tr");
      [item.event_name || "-", item.page_path || "-", item.created_at || "-"].forEach(value => row.append(element("td", value)));
      table?.append(row);
    });
    setEmptyState(document.querySelector("[data-admin-empty]"), rows.length);
  }
  init().catch(error => console.error("통계를 불러오지 못했습니다.", error));
})();
