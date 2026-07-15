(function () {
  "use strict";
  const { element, readJson, setEmptyState } = window.TaranAdmin;
  const table = document.querySelector("[data-admin-table]");
  const empty = document.querySelector("[data-admin-empty]");
  const rows = readJson("admin-banners", []);
  rows.forEach(item => {
    const row = document.createElement("tr");
    [item.title || item.name || "배너", item.placement || "-", [item.startDate, item.endDate].filter(Boolean).join(" ~ ") || "상시", item.status || "임시 저장"]
      .forEach(value => row.append(element("td", value)));
    table?.append(row);
  });
  setEmptyState(empty, rows.length);
})();
