(function () {
  "use strict";
  const { element, reviewCount } = window.TaranAdmin;
  const table = document.querySelector("[data-admin-table]");
  const form = document.querySelector("[data-admin-filter]");
  const count = document.querySelector("[data-admin-result-count]");
  const empty = document.querySelector("[data-admin-empty]");
  const source = window.publicDirectoryData || [];
  let page = 1;
  const pageSize = 30;

  function renderPagination(total) {
    const nav = document.querySelector("[data-admin-pagination]");
    nav.replaceChildren();
    const pages = Math.ceil(total / pageSize);
    if (pages <= 1) return;
    for (let index = 1; index <= pages; index += 1) {
      const button = element("button", index, index === page ? "is-current" : "");
      button.type = "button";
      if (index === page) button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => { page = index; render(); });
      nav.append(button);
    }
  }

  function render() {
    const query = form?.elements.query.value.trim().toLowerCase() || "";
    const status = form?.elements.status.value || "all";
    const rows = source.filter(item => {
      const matchesQuery = !query || [item.name, item.region, item.area].join(" ").toLowerCase().includes(query);
      const matchesStatus = status === "all" || (status === "published" ? item.publicationStatus !== "hidden" : item.publicationStatus === "hidden");
      return matchesQuery && matchesStatus;
    });
    table.replaceChildren();
    rows.slice((page - 1) * pageSize, page * pageSize).forEach(item => {
      const row = document.createElement("tr");
      [item.name, [item.region, item.area].filter(Boolean).join(" "), item.category || item.subcategory || "-", `${reviewCount(item)}개`]
        .forEach(value => row.append(element("td", value)));
      const stateCell = document.createElement("td");
      stateCell.append(element("span", item.publicationStatus === "hidden" ? "비공개" : "공개", `admin-status${item.publicationStatus === "hidden" ? " is-hidden" : ""}`));
      const manage = document.createElement("td");
      const link = element("a", "상세 보기");
      link.href = `../provider.html?id=${encodeURIComponent(item.id)}`;
      manage.append(link);
      row.append(stateCell, manage);
      table.append(row);
    });
    count.textContent = `검색 결과 ${rows.length.toLocaleString("ko-KR")}개`;
    empty.hidden = Boolean(rows.length);
    renderPagination(rows.length);
  }
  form?.addEventListener("submit", event => { event.preventDefault(); page = 1; render(); });
  render();
})();
