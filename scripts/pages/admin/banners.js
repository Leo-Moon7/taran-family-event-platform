(function () {
  "use strict";
  const { element, readJson, setEmptyState, openEditor, addPageAction } = window.TaranAdmin;
  const table = document.querySelector("[data-admin-table]");
  const empty = document.querySelector("[data-admin-empty]");
  let rows = [];
  let online = false;
  const fields = [
    { name: "id", label: "배너 관리 번호", required: true, placeholder: "예: home-summer" },
    { name: "title", label: "배너 제목", required: true },
    { name: "body", label: "안내 문구", type: "textarea", rows: 3, required: true },
    { name: "placement", label: "노출 위치", type: "select", options: [
      { value: "home-hero", label: "홈 상단" }, { value: "home-middle", label: "홈 중간" }, { value: "articles-top", label: "준비백과 상단" }
    ] },
    { name: "ctaLabel", label: "버튼 문구" },
    { name: "ctaUrl", label: "버튼 이동 주소", placeholder: "예: venues.html" },
    { name: "startAt", label: "노출 시작", type: "datetime-local" },
    { name: "endAt", label: "노출 종료", type: "datetime-local" },
    { name: "status", label: "공개 상태", type: "select", options: [
      { value: "draft", label: "임시 저장" }, { value: "published", label: "공개" }, { value: "archived", label: "종료" }
    ] }
  ];
  function safeId(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""); }
  async function save(values, originalId) {
    const id = safeId(values.id);
    if (!id) throw new Error("배너 관리 번호를 영문으로 입력해 주세요.");
    const data = { title: values.title.trim(), body: values.body.trim(), ctaLabel: values.ctaLabel.trim(), ctaUrl: values.ctaUrl.trim(), startAt: values.startAt, endAt: values.endAt };
    await window.TaranAdminData.upsert("banners", { id, site_id: "taran", placement: values.placement, data, status: values.status || "draft", sort_order: 0, updated_at: new Date().toISOString() }, "id");
    if (originalId && originalId !== id) await window.TaranAdminData.remove("banners", { id: `eq.${originalId}` });
    await load();
  }
  function edit(item) { openEditor({ title: item ? "배너 수정" : "배너 등록", fields, initial: item || { placement: "home-middle", status: "draft" }, onSubmit: values => save(values, item?.id) }); }
  function render() {
    table?.replaceChildren();
    rows.forEach(item => {
      const row = document.createElement("tr");
      [item.title || item.name || "배너", item.placement || "-", [item.startDate || item.startAt, item.endDate || item.endAt].filter(Boolean).join(" ~ ") || "상시", item.status === "published" ? "공개" : item.status === "archived" ? "종료" : "임시 저장"]
        .forEach(value => row.append(element("td", value)));
      const manage = document.createElement("td");
      if (online) {
        const button = element("button", "수정", "admin-text-button");
        button.type = "button";
        button.addEventListener("click", () => edit(item));
        manage.append(button);
      }
      row.append(manage);
      table?.append(row);
    });
    setEmptyState(empty, rows.length);
  }
  async function load() {
    if (online) {
      const records = await window.TaranAdminData.list("banners", { order: "sort_order.asc" });
      rows = records.map(row => ({ ...(row.data || {}), id: row.id, placement: row.placement, status: row.status }));
    } else rows = readJson("admin-banners", []);
    render();
  }
  async function init() {
    const access = await window.TaranAdminReady;
    if (!access.allowed) return;
    online = access.mode === "online";
    if (online) addPageAction("새 배너 등록", () => edit(null));
    await load();
  }
  init().catch(error => console.error("배너 목록을 불러오지 못했습니다.", error));
})();
