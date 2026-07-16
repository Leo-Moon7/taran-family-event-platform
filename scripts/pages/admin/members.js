(function () {
  "use strict";
  const { element, setEmptyState } = window.TaranAdmin;
  async function init() {
    const access = await window.TaranAdminReady;
    if (!access.allowed) return;
    const rows = access.mode === "online" ? await window.TaranAdminData.list("customers", { order: "updated_at.desc", limit: 200 }) : [];
    const table = document.querySelector("[data-admin-table]");
    rows.forEach(item => {
      const data = item.data || {};
      const row = document.createElement("tr");
      [data.name || data.displayName || "이름 미입력", data.accountType === "provider" ? "업체" : "고객", item.status === "blocked" ? "이용 제한" : item.status === "pending" ? "확인 대기" : "이용 중", item.updated_at || "-"]
        .forEach(value => row.append(element("td", value)));
      table?.append(row);
    });
    setEmptyState(document.querySelector("[data-admin-empty]"), rows.length);
  }
  init().catch(error => console.error("회원 목록을 불러오지 못했습니다.", error));
})();
