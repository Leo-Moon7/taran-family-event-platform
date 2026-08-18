(function () {
  "use strict";

  const { element, readJson, setEmptyState } = window.TaranAdmin;
  const table = document.querySelector("[data-admin-table]");
  const empty = document.querySelector("[data-admin-empty]");
  const count = document.querySelector("[data-exception-count]");
  const filter = document.querySelector("[data-exception-filter]");
  let rows = [];

  function hoursSince(value) {
    const time = new Date(value || 0).getTime();
    return time ? (Date.now() - time) / 3600000 : 0;
  }

  function buildOnlineRows({ claims, registrations, recipients, providers, notificationJobs }) {
    const providerNames = new Map(providers.map((row) => [String(row.id), row.data?.name || row.id]));
    const claimRows = claims
      .filter((item) => item.status === "pending")
      .map((item) => ({
        id: item.id,
        type: "claim",
        createdAt: item.created_at,
        label: "업체 소유권",
        target: item.provider_name || providerNames.get(String(item.provider_id)) || item.provider_id,
        reason: "담당자 관계와 제출 서류 확인",
        status: "검토 대기",
        href: "providers.html#claims"
      }));
    const registrationRows = registrations
      .filter((item) => item.status === "pending")
      .map((item) => ({
        id: item.id,
        type: "registration",
        createdAt: item.created_at,
        label: "신규 업체 등록",
        target: item.data?.provider_name || item.data?.name || "신규 업체",
        reason: "업체 기본정보와 담당자 확인",
        status: "검토 대기",
        href: "providers.html#registrations"
      }));
    const deliveryRows = recipients
      .filter((item) => item.status === "delivery_failed")
      .map((item) => ({
        id: item.id,
        type: "delivery",
        createdAt: item.sent_at,
        label: "문의 전송 실패",
        target: providerNames.get(String(item.provider_id)) || item.provider_id,
        reason: `문의 ${String(item.inquiry_group_id).slice(0, 8)} 재전송 필요`,
        status: "전송 실패",
        href: `../provider.html?id=${encodeURIComponent(item.provider_id)}`
      }));
    const unansweredRows = recipients
      .filter((item) => (
        item.status === "expired"
        || (["sent", "viewed"].includes(item.status) && (
          new Date(item.expires_at || 0).getTime() <= Date.now()
          || hoursSince(item.sent_at) >= 24
        ))
      ))
      .map((item) => ({
        id: item.id,
        type: "unanswered",
        createdAt: item.sent_at,
        label: "24시간 미응답",
        target: providerNames.get(String(item.provider_id)) || item.provider_id,
        reason: item.status === "expired"
          ? "답변 가능 시간이 종료됨"
          : `${Math.floor(hoursSince(item.sent_at))}시간 동안 답변 없음`,
        status: "확인 필요",
        href: `../provider.html?id=${encodeURIComponent(item.provider_id)}`
      }));
    const notificationRows = notificationJobs
      .filter((item) => item.status === "failed")
      .map((item) => ({
        id: item.id,
        type: "notification",
        createdAt: item.updated_at || item.created_at,
        label: "알림 처리 실패",
        target: providerNames.get(String(item.provider_id)) || item.provider_id || "수신 대상",
        reason: item.error_message || `${item.event_type} 알림 재처리 필요`,
        status: "전송 실패",
        href: "inquiries.html"
      }));
    const repeatedNonresponseRows = providers
      .filter((item) => {
        if (!item.owner_user_id || item.status !== "published" || item.inquiry_enabled !== false) return false;
        const checkedAt = item.last_verified_at || item.updated_at;
        const isFreshEnough = hoursSince(checkedAt) < (180 * 24);
        return isFreshEnough && Number(item.response_rate) < 20;
      })
      .map((item) => ({
        id: item.id,
        type: "nonresponse",
        createdAt: item.updated_at,
        label: "반복 미응답 업체",
        target: providerNames.get(String(item.id)) || item.id,
        reason: `최근 응답률 ${Math.round(Number(item.response_rate || 0))}% · 새 문의 자동 배정 중지`,
        status: "응답 확인",
        href: `../provider.html?id=${encodeURIComponent(item.id)}`
      }));
    const staleRows = providers
      .filter((item) => {
        if (!item.owner_user_id || item.status !== "published") return false;
        const checkedAt = item.last_verified_at || item.updated_at;
        return hoursSince(checkedAt) >= (180 * 24);
      })
      .map((item) => ({
        id: item.id,
        type: "stale",
        createdAt: item.last_verified_at || item.updated_at,
        label: "업체 정보 갱신",
        target: providerNames.get(String(item.id)) || item.id,
        reason: "마지막 확인 후 180일이 지나 문의 수신이 중지됨",
        status: "갱신 필요",
        href: `../provider.html?id=${encodeURIComponent(item.id)}`
      }));
    return [
      ...claimRows,
      ...registrationRows,
      ...deliveryRows,
      ...unansweredRows,
      ...notificationRows,
      ...repeatedNonresponseRows,
      ...staleRows
    ]
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function buildPreviewRows() {
    const providerDrafts = readJson("provider-registration-drafts", []);
    const inquiryDrafts = readJson("inquiry-drafts", []);
    return [
      ...providerDrafts.map((item) => ({
        id: item.id,
        type: "registration",
        createdAt: item.created_at,
        label: "신규 업체 등록",
        target: item.name || "신규 업체",
        reason: "온라인 저장소 연결 후 전송 필요",
        status: "브라우저 임시 저장",
        href: "../provider-register.html"
      })),
      ...inquiryDrafts.map((item) => ({
        id: item.client_id,
        type: "delivery",
        createdAt: item.created_at,
        label: "견적 문의",
        target: `${item.provider_ids?.length || 0}개 업체`,
        reason: "온라인 저장소 연결 후 전송 필요",
        status: "브라우저 임시 저장",
        href: "../inquiry.html"
      }))
    ].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function render() {
    const type = filter?.elements.type.value || "all";
    const query = String(filter?.elements.query.value || "").trim().toLowerCase();
    const filtered = rows.filter((item) => {
      const typeMatch = type === "all" || item.type === type;
      const queryMatch = !query || [item.id, item.target, item.reason].join(" ").toLowerCase().includes(query);
      return typeMatch && queryMatch;
    });
    table?.replaceChildren();
    filtered.forEach((item) => {
      const row = document.createElement("tr");
      [
        String(item.createdAt || "").slice(0, 10) || "-",
        item.label,
        item.target,
        item.reason
      ].forEach((value) => row.append(element("td", value)));
      const state = document.createElement("td");
      state.append(element("span", item.status, "admin-status is-attention"));
      const action = document.createElement("td");
      const link = element("a", "확인");
      link.href = item.href;
      action.append(link);
      row.append(state, action);
      table?.append(row);
    });
    if (count) count.textContent = `확인 필요 ${filtered.length.toLocaleString("ko-KR")}건`;
    setEmptyState(empty, filtered.length);
  }

  async function init() {
    const access = await window.TaranAdminReady;
    if (!access.allowed) return;
    if (access.mode === "online") {
      try {
        await window.TaranApi.rpc("taran_apply_marketplace_maintenance");
      } catch (_error) {
        /* 004 마이그레이션 적용 전에는 기존 예외 목록만 표시합니다. */
      }
      const safeList = async (tableKey, query) => {
        try { return await window.TaranAdminData.list(tableKey, query); } catch (_error) { return []; }
      };
      const [claims, registrations, recipients, providers, notificationJobs] = await Promise.all([
        safeList("providerClaims", { order: "created_at.desc", limit: 300 }),
        safeList("providerRegistrations", { order: "created_at.desc", limit: 300 }),
        safeList("inquiryRecipients", { order: "sent_at.desc", limit: 500 }),
        safeList("providers", {
          select: "id,data,status,owner_user_id,updated_at,last_verified_at,inquiry_enabled,response_rate",
          limit: 5000
        }),
        safeList("notificationJobs", { order: "created_at.desc", limit: 500 })
      ]);
      rows = buildOnlineRows({ claims, registrations, recipients, providers, notificationJobs });
    } else {
      rows = buildPreviewRows();
    }
    filter?.addEventListener("submit", (event) => { event.preventDefault(); render(); });
    render();
  }

  init().catch((error) => console.error("운영 예외 목록을 불러오지 못했습니다.", error));
})();
