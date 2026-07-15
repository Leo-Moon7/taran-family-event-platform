(function () {
  "use strict";
  const { element, readJson, setEmptyState } = window.TaranAdmin;
  const table = document.querySelector("[data-admin-table]");
  const empty = document.querySelector("[data-admin-empty]");
  const rows = readJson("provider-contributions", []);
  rows.forEach(item => {
    const row = document.createElement("tr");
    [String(item.submittedAt || "").slice(0, 10), item.providerName || "-", item.eventType || "-", item.quoteAmount || "-", "검토 대기"]
      .forEach(value => row.append(element("td", value)));
    table?.append(row);
  });
  setEmptyState(empty, rows.length);
})();
