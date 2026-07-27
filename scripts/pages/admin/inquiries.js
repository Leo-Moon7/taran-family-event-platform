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

  async function loadOperationsQueues() {
    const queues = [
      { key: "providers", rpc: "taran_list_admin_provider_operations", limit: 5000 },
      { key: "claims", rpc: "taran_list_admin_provider_claims", limit: 300 },
      { key: "registrations", rpc: "taran_list_admin_provider_registrations", limit: 300 }
    ];
    const results = await Promise.allSettled(queues.map((queue) => (
      window.TaranApi.rpc(queue.rpc, { p_limit: queue.limit })
    )));
    const snapshot = { providers: null, claims: null, registrations: null };
    results.forEach((result, index) => {
      const queue = queues[index];
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        snapshot[queue.key] = result.value;
        return;
      }
      const reason = result.status === "rejected"
        ? result.reason
        : new Error("관리 목록 응답 형식이 올바르지 않습니다.");
      console.error(`${queue.key} 운영 목록을 불러오지 못했습니다.`, reason);
    });
    return snapshot;
  }

  function buildLoadErrorRows({ claims, registrations, providers }) {
    const errorRows = [];
    if (!Array.isArray(claims)) {
      errorRows.push({
        id: "claim-load-error",
        type: "claim",
        createdAt: "",
        label: "업체 소유권 목록 불러오기 실패",
        target: "소유권 요청",
        reason: "페이지를 새로고침해 다시 시도해 주세요.",
        status: "불러오기 실패",
        href: "inquiries.html",
        actionLabel: "다시 시도",
        isLoadError: true
      });
    }
    if (!Array.isArray(registrations)) {
      errorRows.push({
        id: "registration-load-error",
        type: "registration",
        createdAt: "",
        label: "신규 업체 등록 목록 불러오기 실패",
        target: "등록 요청",
        reason: "페이지를 새로고침해 다시 시도해 주세요.",
        status: "불러오기 실패",
        href: "inquiries.html",
        actionLabel: "다시 시도",
        isLoadError: true
      });
    }
    if (!Array.isArray(providers)) {
      errorRows.push({
        id: "provider-load-error",
        type: "provider-load",
        types: ["nonresponse", "stale"],
        createdAt: "",
        label: "업체 운영 정보 불러오기 실패",
        target: "담당·갱신 업체",
        reason: "페이지를 새로고침해 다시 시도해 주세요.",
        status: "불러오기 실패",
        href: "inquiries.html",
        actionLabel: "다시 시도",
        isLoadError: true
      });
    }
    return errorRows;
  }

  function buildOnlineRows({ claims, registrations, recipients, providers, notificationJobs }) {
    const providerRows = Array.isArray(providers) ? providers : [];
    const publishedProviders = providerRows.filter((item) => item.status === "published");
    const providerNames = new Map(providerRows.map((row) => [String(row.id), row.name || row.id]));
    const claimRows = (Array.isArray(claims) ? claims : [])
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
    const registrationRows = (Array.isArray(registrations) ? registrations : [])
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
    const repeatedNonresponseRows = publishedProviders
      .filter((item) => {
        if (!item.has_owner || item.inquiry_enabled !== false) return false;
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
    const staleRows = publishedProviders
      .filter((item) => {
        if (!item.has_owner) return false;
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
      ...staleRows,
      ...buildLoadErrorRows({ claims, registrations, providers })
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
      const typeMatch = type === "all" || item.type === type || item.types?.includes(type);
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
      const link = element("a", item.actionLabel || "확인");
      link.href = item.href;
      action.append(link);
      row.append(state, action);
      table?.append(row);
    });
    const exceptionCount = filtered.filter((item) => !item.isLoadError).length;
    const loadErrorCount = filtered.filter((item) => item.isLoadError).length;
    if (count) {
      count.textContent = loadErrorCount
        ? `확인 필요 ${exceptionCount.toLocaleString("ko-KR")}건 · 불러오기 실패 ${loadErrorCount.toLocaleString("ko-KR")}개 목록`
        : `확인 필요 ${exceptionCount.toLocaleString("ko-KR")}건`;
    }
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
      const [operations, recipients, notificationJobs] = await Promise.all([
        loadOperationsQueues(),
        safeList("inquiryRecipients", { order: "sent_at.desc", limit: 500 }),
        safeList("notificationJobs", { order: "created_at.desc", limit: 500 })
      ]);
      rows = buildOnlineRows({ ...operations, recipients, notificationJobs });
    } else {
      rows = buildPreviewRows();
    }
    filter?.addEventListener("submit", (event) => { event.preventDefault(); render(); });
    render();
  }

  init().catch((error) => console.error("운영 예외 목록을 불러오지 못했습니다.", error));
})();
