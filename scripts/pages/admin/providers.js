(function () {
  "use strict";
  const { element, reviewCount, openEditor, addPageAction } = window.TaranAdmin;
  const table = document.querySelector("[data-admin-table]");
  const form = document.querySelector("[data-admin-filter]");
  const count = document.querySelector("[data-admin-result-count]");
  const empty = document.querySelector("[data-admin-empty]");
  let source = [];
  let online = false;
  let page = 1;
  const pageSize = 30;
  const reviewTable = document.querySelector("[data-review-table]");
  const reviewSection = document.querySelector("[data-review-section]");
  const reviewEmpty = document.querySelector("[data-review-empty]");
  const claimTable = document.querySelector("[data-claim-table]");
  const claimSection = document.querySelector("[data-claim-section]");
  const claimEmpty = document.querySelector("[data-claim-empty]");
  const registrationTable = document.querySelector("[data-registration-table]");
  const registrationSection = document.querySelector("[data-registration-section]");
  const registrationEmpty = document.querySelector("[data-registration-empty]");
  const fields = [
    { name: "id", label: "업체 관리 번호", required: true, placeholder: "예: provider-seoul-001" },
    { name: "name", label: "업체명", required: true },
    { name: "category", label: "업체 유형", required: true, placeholder: "예: 식당, 공간 대여, 스냅" },
    { name: "region", label: "시·도", required: true, placeholder: "예: 서울특별시" },
    { name: "area", label: "시·군·구", placeholder: "예: 강남구" },
    { name: "address", label: "도로명 주소" },
    { name: "eventTypes", label: "진행 가능한 행사", type: "checkbox-group", options: (window.SonpumEventTypes?.items || []).map(item => ({ value: item.id, label: item.label })), help: "해당 업체가 실제로 진행할 수 있는 행사를 모두 선택해 주세요." },
    { name: "minGuests", label: "최소 인원", type: "number" },
    { name: "maxGuests", label: "최대 인원", type: "number" },
    { name: "price", label: "대표 가격 안내", placeholder: "예: 1인 65,000원부터" },
    { name: "phone", label: "대표 전화" },
    { name: "website", label: "대표 채널 주소", type: "url" },
    { name: "status", label: "공개 상태", type: "select", options: [
      { value: "draft", label: "검수 중" }, { value: "published", label: "공개" }, { value: "archived", label: "비공개" }
    ] }
  ];

  function safeId(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""); }
  function editorValues(item = {}) {
    const rawEvents = item.eventTypes || item.events || [];
    const eventTypes = rawEvents.map(value => window.SonpumEventTypes?.normalize(value, rawEvents) || value).filter(value => value !== "legacyWedding");
    return { ...item, eventTypes, status: item.publicationStatus === "hidden" ? "archived" : item.publicationStatus || "draft" };
  }
  async function save(values, originalId) {
    const id = safeId(values.id);
    if (!id) throw new Error("업체 관리 번호를 영문으로 입력해 주세요.");
    const minGuests = values.minGuests ? Number(values.minGuests) : null;
    const maxGuests = values.maxGuests ? Number(values.maxGuests) : null;
    if (minGuests && maxGuests && minGuests > maxGuests) throw new Error("최소 인원은 최대 인원보다 클 수 없습니다.");
    const data = {
      name: values.name.trim(), category: values.category.trim(), region: values.region.trim(), area: values.area.trim(),
      address: values.address.trim(), eventTypes: Array.isArray(values.eventTypes) ? values.eventTypes : [],
      minGuests, maxGuests, price: values.price.trim(), phone: values.phone.trim(), website: values.website.trim(),
      informationCheckedAt: new Date().toISOString().slice(0, 10)
    };
    await window.TaranAdminData.upsert("providers", { id, data, status: values.status || "draft", updated_at: new Date().toISOString() }, "id");
    if (originalId && originalId !== id) await window.TaranAdminData.remove("providers", { id: `eq.${originalId}` });
    await load();
  }
  function edit(item) { openEditor({ title: item ? "업체 정보 수정" : "업체 등록", fields, initial: editorValues(item), onSubmit: values => save(values, item?.id) }); }

  function renderPagination(total) {
    const nav = document.querySelector("[data-admin-pagination]");
    nav?.replaceChildren();
    const pages = Math.ceil(total / pageSize);
    for (let index = 1; index <= pages; index += 1) {
      const button = element("button", index, index === page ? "is-current" : "");
      button.type = "button";
      if (index === page) button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => { page = index; render(); });
      nav?.append(button);
    }
  }
  async function toggle(item, button) {
    button.disabled = true;
    const status = item.publicationStatus === "hidden" ? "published" : "archived";
    try {
      await window.TaranAdminData.update("providers", { status }, { id: `eq.${item.id}` });
      item.publicationStatus = status === "published" ? "published" : "hidden";
      render();
    } catch (error) { alert(error.message); }
  }
  function render() {
    const query = form?.elements.query.value.trim().toLowerCase() || "";
    const status = form?.elements.status.value || "all";
    const rows = source.filter(item => {
      const matchesQuery = !query || [item.name, item.region, item.area].join(" ").toLowerCase().includes(query);
      const matchesStatus = status === "all" || (status === "published" ? item.publicationStatus === "published" : item.publicationStatus !== "published");
      return matchesQuery && matchesStatus;
    });
    table?.replaceChildren();
    rows.slice((page - 1) * pageSize, page * pageSize).forEach(item => {
      const row = document.createElement("tr");
      [item.name || "업체명 없음", [item.region, item.area].filter(Boolean).join(" "), item.category || item.subcategory || "-", `${reviewCount(item)}개`]
        .forEach(value => row.append(element("td", value)));
      const stateCell = document.createElement("td");
      stateCell.append(element("span", item.publicationStatus === "published" ? "공개" : item.publicationStatus === "draft" ? "검수 중" : "비공개", `admin-status${item.publicationStatus === "published" ? "" : " is-hidden"}`));
      const manage = document.createElement("td");
      const link = element("a", "상세 보기");
      link.href = `../provider.html?id=${encodeURIComponent(item.id)}`;
      manage.append(link);
      if (online) {
        const editButton = element("button", "수정", "admin-text-button");
        editButton.type = "button";
        editButton.addEventListener("click", () => edit(item));
        const stateButton = element("button", item.publicationStatus === "published" ? "숨기기" : "공개", "admin-text-button");
        stateButton.type = "button";
        stateButton.addEventListener("click", () => toggle(item, stateButton));
        manage.append(editButton, stateButton);
      }
      row.append(stateCell, manage);
      table?.append(row);
    });
    if (count) count.textContent = `검색 결과 ${rows.length.toLocaleString("ko-KR")}개`;
    if (empty) empty.hidden = Boolean(rows.length);
    renderPagination(rows.length);
  }
  async function load() {
    if (online) {
      const rows = await window.TaranAdminData.list("providers", { order: "updated_at.desc" });
      source = rows.map(row => ({ ...(row.data || {}), id: row.id, publicationStatus: row.status === "archived" ? "hidden" : row.status }));
    } else source = window.publicDirectoryData || [];
    render();
  }
  async function moderateReview(id, status, button) {
    button.disabled = true;
    try {
      await window.TaranAdminData.update("reviews", { status, updated_at: new Date().toISOString() }, { id: `eq.${id}` });
      await loadReviews();
    } catch (error) { alert(error.message); button.disabled = false; }
  }
  async function loadReviews() {
    if (!online || !reviewTable || !reviewSection) return;
    reviewSection.hidden = false;
    const rows = await window.TaranAdminData.list("reviews", { status: "eq.pending", order: "created_at.asc", limit: 100 });
    reviewTable.replaceChildren();
    rows.forEach(item => {
      const row = document.createElement("tr");
      [String(item.created_at || "").slice(0, 10), item.provider_id || "-", `${item.rating || "-"}점`, item.author_name || "-", item.content || "-"]
        .forEach(value => row.append(element("td", value)));
      const manage = document.createElement("td");
      const approve = element("button", "공개", "admin-text-button");
      approve.type = "button";
      approve.addEventListener("click", () => moderateReview(item.id, "published", approve));
      const hide = element("button", "숨기기", "admin-text-button");
      hide.type = "button";
      hide.addEventListener("click", () => moderateReview(item.id, "hidden", hide));
      manage.append(approve, hide);
      row.append(manage);
      reviewTable.append(row);
    });
    if (reviewEmpty) reviewEmpty.hidden = Boolean(rows.length);
  }
  async function moderateClaim(item, status, button) {
    button.disabled = true;
    try {
      const access = await window.TaranAdminData.context();
      if (status === "approved") {
        await window.TaranAdminData.update("providers", {
          owner_user_id: item.user_id
        }, { id: `eq.${item.provider_id}` });
      }
      await window.TaranAdminData.update("providerClaims", {
        status,
        reviewed_by: access.account.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { id: `eq.${item.id}` });
      await loadClaims();
    } catch (error) { alert(error.message); button.disabled = false; }
  }
  async function loadClaims() {
    if (!online || !claimTable || !claimSection) return;
    claimSection.hidden = false;
    const rows = await window.TaranAdminData.list("providerClaims", { order: "created_at.asc", limit: 100 });
    claimTable.replaceChildren();
    rows.forEach(item => {
      const row = document.createElement("tr");
      [String(item.created_at || "").slice(0, 10), item.provider_name || item.provider_id, item.manager_name || "-", `${item.work_email || "-"} ${item.phone || ""}`, item.ad_interest ? "희망" : "미희망"]
        .forEach(value => row.append(element("td", value)));
      row.append(element("td", item.status === "approved" ? "승인" : item.status === "rejected" ? "반려" : "대기"));
      const manage = document.createElement("td");
      const documentButton = element("button", "서류 보기", "admin-text-button");
      documentButton.type = "button";
      documentButton.addEventListener("click", async () => {
        documentButton.disabled = true;
        try {
          const url = await window.TaranApi.createPrivateSignedUrl(item.document_path);
          window.open(url, "_blank", "noopener,noreferrer");
        } catch (error) { alert(error.message); }
        finally { documentButton.disabled = false; }
      });
      manage.append(documentButton);
      if (item.status === "pending") {
        const approve = element("button", "승인", "admin-text-button");
        approve.type = "button";
        approve.addEventListener("click", () => moderateClaim(item, "approved", approve));
        const reject = element("button", "반려", "admin-text-button");
        reject.type = "button";
        reject.addEventListener("click", () => moderateClaim(item, "rejected", reject));
        manage.append(approve, reject);
      } else manage.textContent = "처리 완료";
      row.append(manage);
      claimTable.append(row);
    });
    if (claimEmpty) claimEmpty.hidden = Boolean(rows.length);
  }

  async function moderateRegistration(item, status, button) {
    button.disabled = true;
    try {
      const access = await window.TaranAdminData.context();
      if (status === "approved") {
        const data = item.data || {};
        const id = safeId(data.id || data.name || data.provider_name || `provider-${item.id}`);
        const providerData = {
          name: data.name || data.provider_name,
          category: data.industry || "업체",
          address: data.address || data.region || "",
          eventTypes: data.event_tags || [],
          minGuests: data.minimum_guests || null,
          maxGuests: data.maximum_guests || null,
          minimumGuarantee: data.minimum_guarantee || null,
          rentalFee: data.rental_fee || null,
          adultMealPriceMin: data.adult_meal_price_min || null,
          parkingCount: data.parking_count || null,
          phone: data.phone || "",
          website: data.official_link || "",
          ownerRegistered: true,
          informationCheckedAt: new Date().toISOString().slice(0, 10)
        };
        await window.TaranAdminData.upsert("providers", {
          id,
          data: providerData,
          status: "published",
          owner_user_id: item.user_id,
          profile_status: "claimed",
          event_types: providerData.eventTypes,
          minimum_guests: providerData.minGuests,
          maximum_guests: providerData.maxGuests,
          minimum_guarantee: providerData.minimumGuarantee,
          adult_meal_price_min: providerData.adultMealPriceMin,
          rental_fee: providerData.rentalFee,
          parking_count: providerData.parkingCount,
          inquiry_enabled: true,
          updated_at: new Date().toISOString()
        }, "id");
      }
      await window.TaranAdminData.update("providerRegistrations", {
        status,
        reviewed_by: access.account.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { id: `eq.${item.id}` });
      await loadRegistrations();
      await load();
    } catch (error) {
      alert(error.message || "등록 요청을 처리하지 못했습니다.");
      button.disabled = false;
    }
  }

  async function loadRegistrations() {
    if (!online || !registrationTable || !registrationSection) return;
    registrationSection.hidden = false;
    const rows = await window.TaranAdminData.list("providerRegistrations", { order: "created_at.asc", limit: 200 });
    registrationTable.replaceChildren();
    rows.forEach((item) => {
      const data = item.data || {};
      const row = document.createElement("tr");
      [
        String(item.created_at || "").slice(0, 10),
        data.name || data.provider_name || "-",
        data.industry || "-",
        data.address || data.region || "-",
        data.owner_name || data.owner_email || "-"
      ].forEach((value) => row.append(element("td", value)));
      row.append(element("td", item.status === "approved" ? "승인" : item.status === "rejected" ? "반려" : "대기"));
      const manage = document.createElement("td");
      if (item.status === "pending") {
        const approve = element("button", "승인·공개", "admin-text-button");
        approve.type = "button";
        approve.addEventListener("click", () => moderateRegistration(item, "approved", approve));
        const reject = element("button", "반려", "admin-text-button");
        reject.type = "button";
        reject.addEventListener("click", () => moderateRegistration(item, "rejected", reject));
        manage.append(approve, reject);
      } else {
        manage.textContent = "처리 완료";
      }
      row.append(manage);
      registrationTable.append(row);
    });
    if (registrationEmpty) registrationEmpty.hidden = Boolean(rows.length);
  }
  async function init() {
    const access = await window.TaranAdminReady;
    if (!access.allowed) return;
    online = access.mode === "online";
    if (online) addPageAction("새 업체 등록", () => edit(null));
    form?.addEventListener("submit", event => { event.preventDefault(); page = 1; render(); });
    await load();
    await loadReviews();
    await loadClaims();
    await loadRegistrations();
  }
  init().catch(error => console.error("업체 관리 목록을 불러오지 못했습니다.", error));
})();
