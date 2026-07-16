(function () {
  "use strict";

  const config = window.TaranConfig || {};
  const auditedTables = new Set(["siteCopy", "providers", "articles", "banners"]);

  async function context() {
    return window.TaranAdminReady || { allowed: true, mode: "preview" };
  }

  async function list(tableKey, query = {}, fallback = []) {
    const access = await context();
    if (!access.allowed) return [];
    if (access.mode !== "online") return Array.isArray(fallback) ? fallback : [];
    return window.TaranApi.select(config.tables[tableKey], query);
  }

  async function record(action, tableKey) {
    try {
      await window.TaranApi.rpc("taran_track_event", {
        p_event_name: "page_view",
        p_page_path: `admin/${tableKey}`,
        p_metadata: { action }
      });
    } catch (_error) { /* 저장 성공 후 통계 기록 실패는 작업을 되돌리지 않습니다. */ }
  }

  async function upsert(tableKey, row, conflictKey) {
    const access = await context();
    if (access.mode !== "online") throw new Error("온라인 관리자 저장소가 연결된 환경에서만 저장할 수 있습니다.");
    const payload = auditedTables.has(tableKey) ? { ...row, updated_by: access.account.id } : row;
    const result = await window.TaranApi.upsert(config.tables[tableKey], payload, conflictKey);
    await record("upsert", tableKey);
    return result;
  }

  async function update(tableKey, values, filters) {
    const access = await context();
    if (access.mode !== "online") throw new Error("온라인 관리자 저장소가 연결된 환경에서만 수정할 수 있습니다.");
    const payload = auditedTables.has(tableKey) ? { ...values, updated_by: access.account.id } : values;
    const result = await window.TaranApi.update(config.tables[tableKey], payload, filters);
    await record("update", tableKey);
    return result;
  }

  async function remove(tableKey, filters) {
    const access = await context();
    if (access.mode !== "online") throw new Error("온라인 관리자 저장소가 연결된 환경에서만 삭제할 수 있습니다.");
    const result = await window.TaranApi.remove(config.tables[tableKey], filters);
    await record("remove", tableKey);
    return result;
  }

  window.TaranAdminData = Object.freeze({ context, list, upsert, update, remove });
})();
