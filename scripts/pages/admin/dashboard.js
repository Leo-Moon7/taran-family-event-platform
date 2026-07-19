(function () {
  "use strict";
  const { element, readJson } = window.TaranAdmin;
  const metrics = document.querySelector("[data-admin-metrics]");
  const tasks = document.querySelector("[data-admin-tasks]");

  function metric(label, value, suffix = "") {
    const card = element("article", undefined, "admin-metric");
    const output = value === null || value === undefined
      ? "—"
      : `${Number(value).toLocaleString("ko-KR")}${suffix}`;
    card.append(element("span", label), element("strong", output));
    return card;
  }

  function percentage(part, total) {
    if (!total) return null;
    return Math.round((part / total) * 100);
  }

  async function onlineSnapshot() {
    const [providers, groups, recipients, responses, events, claims, registrations] = await Promise.all([
      window.TaranAdminData.list("providers", { status: "eq.published", select: "id,owner_user_id,profile_completeness,updated_at", limit: 10000 }),
      window.TaranAdminData.list("inquiryGroups", { select: "id,status,created_at", limit: 10000 }),
      window.TaranAdminData.list("inquiryRecipients", { select: "id,status,sent_at,viewed_at,responded_at", limit: 10000 }),
      window.TaranAdminData.list("inquiryResponses", { select: "id,created_at", limit: 10000 }),
      window.TaranAdminData.list("adminEvents", { select: "event_name,created_at", limit: 10000 }),
      window.TaranAdminData.list("providerClaims", { status: "eq.pending", select: "id", limit: 1000 }),
      window.TaranAdminData.list("providerRegistrations", { status: "eq.pending", select: "id", limit: 1000 })
    ]);
    const cutoff = Date.now() - (90 * 86400000);
    const refreshed = providers.filter((item) => new Date(item.updated_at || 0).getTime() >= cutoff).length;
    const claimed = providers.filter((item) => item.owner_user_id).length;
    const complete = providers.filter((item) => Number(item.profile_completeness || 0) >= 80).length;
    const viewed = recipients.filter((item) => item.viewed_at || ["viewed", "responded"].includes(item.status)).length;
    const responded = recipients.filter((item) => item.responded_at || item.status === "responded").length;
    const failed = recipients.filter((item) => item.status === "delivery_failed").length;
    const unanswered = recipients.filter((item) => item.status === "sent" && Date.now() - new Date(item.sent_at || 0).getTime() >= 172800000).length;
    const eventCount = (name) => events.filter((item) => item.event_name === name).length;
    return {
      metrics: [
        ["공개 업체", providers.length],
        ["담당자 등록 업체", claimed],
        ["정보 완성도 80% 이상", complete],
        ["최근 90일 갱신률", percentage(refreshed, providers.length), "%"],
        ["견적 문의", groups.length],
        ["업체 문의 열람률", percentage(viewed, recipients.length), "%"],
        ["업체 응답률", percentage(responded, recipients.length), "%"],
        ["업체 답변", responses.length],
        ["계산기 완료", eventCount("calculator_completed")],
        ["체크리스트 생성", eventCount("checklist_created")]
      ],
      tasks: [
        ["운영 예외", claims.length + registrations.length + failed + unanswered, "inquiries.html"],
        ["업체 소유권 요청", claims.length, "providers.html#claims"],
        ["신규 업체 등록", registrations.length, "providers.html#registrations"],
        ["문의 전송 실패", failed, "inquiries.html"],
        ["장기 미응답", unanswered, "inquiries.html"]
      ]
    };
  }

  function previewSnapshot() {
    const providers = (window.publicDirectoryData || []).filter((item) => item.publicationStatus !== "hidden");
    const registrations = readJson("provider-registration-drafts", []);
    const inquiries = readJson("inquiry-drafts", []);
    return {
      metrics: [
        ["공개 업체", providers.length],
        ["담당자 등록 업체", null],
        ["정보 완성도 80% 이상", null],
        ["최근 90일 갱신률", null, "%"],
        ["견적 문의", inquiries.length],
        ["업체 문의 열람률", null, "%"],
        ["업체 응답률", null, "%"],
        ["업체 답변", null],
        ["계산기 완료", null],
        ["체크리스트 생성", null]
      ],
      tasks: [
        ["브라우저에 임시 저장된 문의", inquiries.length, "inquiries.html"],
        ["브라우저에 임시 저장된 업체 등록", registrations.length, "inquiries.html"],
        ["업체 정보 확인", providers.length, "providers.html"]
      ]
    };
  }

  async function init() {
    const access = await window.TaranAdminReady;
    if (!access.allowed) return;
    const offlineSection = document.querySelector("[data-offline-only]");
    if (offlineSection) offlineSection.hidden = access.mode !== "preview";
    const snapshot = access.mode === "online" ? await onlineSnapshot() : previewSnapshot();
    metrics?.replaceChildren();
    snapshot.metrics.forEach(([label, value, suffix]) => metrics?.append(metric(label, value, suffix || "")));
    tasks?.replaceChildren();
    snapshot.tasks.forEach(([label, value, href]) => {
      const link = element("a", undefined, "admin-task");
      link.href = href;
      link.append(element("span", label), element("strong", value ?? "—"));
      tasks?.append(link);
    });
  }

  init().catch((error) => console.error("관리자 현황을 불러오지 못했습니다.", error));
})();
