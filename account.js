(async function initializeAccount() {
  const account = await window.TaranAuth.ready;
  if (!account) {
    window.location.href = window.TaranAuth.loginUrl("account.html");
    return;
  }
  document.querySelector("#account-name").textContent = account.display_name;
  document.querySelector("#info-name").textContent = account.display_name;
  document.querySelector("#info-email").textContent = account.email;

  if (window.TaranAuth.isConfigured()) {
    try {
      const owned = await window.TaranApi.select(window.TaranConfig.tables.providers, {
        owner_user_id: `eq.${account.id}`,
        select: "id,data,status",
        order: "updated_at.desc"
      });
      if (owned.length) {
        const card = document.createElement("article");
        card.className = "account-card";
        const heading = document.createElement("div");
        heading.className = "account-card-heading";
        const title = document.createElement("h2");
        title.textContent = "내 업체 관리";
        const count = document.createElement("strong");
        count.textContent = `${owned.length}곳`;
        heading.append(title, count);
        const list = document.createElement("div");
        list.className = "saved-list";
        owned.forEach((row) => {
          const link = document.createElement("a");
          link.href = `partner.html?id=${encodeURIComponent(row.id)}`;
          const name = document.createElement("strong");
          name.textContent = row.data?.name || row.id;
          const action = document.createElement("span");
          action.textContent = "업체 정보 수정 →";
          link.append(name, action);
          list.append(link);
        });
        card.append(heading, list);
        document.querySelector(".account-layout")?.append(card);
      }
    } catch (_error) { /* 업체 권한이 없는 일반 회원에게는 별도 영역을 표시하지 않습니다. */ }
  }

  async function loadInquiries() {
    const list = document.querySelector("#account-inquiry-list");
    const empty = document.querySelector("#account-inquiry-empty");
    const count = document.querySelector("#inquiry-count");
    if (!window.TaranAuth.isConfigured()) {
      const drafts = JSON.parse(window.TaranStorage?.get("inquiry-drafts", "[]") || "[]");
      count.textContent = `${drafts.length}건`;
      empty.hidden = Boolean(drafts.length);
      drafts.forEach((item) => {
        const card = document.createElement("article");
        const title = document.createElement("strong");
        title.textContent = `${item.event_type || "가족행사"} · ${item.guest_count || "-"}명`;
        const state = document.createElement("span");
        state.textContent = "브라우저 임시 저장";
        card.append(title, state);
        list.append(card);
      });
      return;
    }
    const groups = await window.TaranApi.select(window.TaranConfig.tables.inquiryGroups, {
      user_id: `eq.${account.id}`,
      order: "created_at.desc",
      limit: 100
    });
    count.textContent = `${groups.length}건`;
    empty.hidden = Boolean(groups.length);
    if (!groups.length) return;
    const ids = groups.map((item) => item.id);
    const [recipients, responses] = await Promise.all([
      window.TaranApi.select(window.TaranConfig.tables.inquiryRecipients, { inquiry_group_id: `in.(${ids.join(",")})`, limit: 300 }),
      window.TaranApi.select(window.TaranConfig.tables.inquiryResponses, { limit: 300 })
    ]);
    groups.forEach((group) => {
      const groupRecipients = recipients.filter((item) => item.inquiry_group_id === group.id);
      const responseIds = new Set(responses.map((item) => item.inquiry_recipient_id));
      const answered = groupRecipients.filter((item) => responseIds.has(item.id) || item.status === "responded").length;
      const card = document.createElement("article");
      card.className = "account-inquiry-item";
      const heading = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = `${group.event_type} · ${group.region}`;
      const date = document.createElement("span");
      date.textContent = String(group.created_at || "").slice(0, 10);
      heading.append(title, date);
      const summary = document.createElement("p");
      summary.textContent = `${group.guest_count}명 · ${groupRecipients.length}곳 문의 · ${answered}곳 답변`;
      const state = document.createElement("span");
      state.className = "badge";
      state.textContent = answered ? "답변 도착" : "업체 확인 중";
      card.append(heading, summary, state);
      list.append(card);
    });
  }
  await loadInquiries().catch(() => {
    const empty = document.querySelector("#account-inquiry-empty");
    empty.hidden = false;
    empty.querySelector("strong").textContent = "문의 내역을 불러오지 못했습니다.";
    empty.querySelector("span").textContent = "잠시 후 다시 확인해 주세요.";
  });

  let savedSlugs = [];
  try {
    const saved = await window.TaranAuth.api("/api/member/saved-venues");
    savedSlugs = saved.venue_slugs;
  } catch (_) {}
  const directory = window.publicDirectoryData || window.publicVenueData || [];
  const savedVenues = directory.filter(venue => savedSlugs.includes(venue.id));
  document.querySelector("#saved-count").textContent = savedVenues.length;
  const savedList = document.querySelector("#saved-list");
  savedList.replaceChildren();
  if (savedVenues.length) {
    savedVenues.forEach(venue => {
      const link = document.createElement("a");
      link.href = `provider.html?id=${encodeURIComponent(venue.id)}`;
      const meta = document.createElement("span");
      meta.textContent = [venue.region, venue.area, venue.category || venue.type].filter(Boolean).join(" · ");
      const name = document.createElement("strong");
      name.textContent = venue.name;
      const action = document.createElement("small");
      action.textContent = "상세 정보 보기 →";
      link.append(meta, name, action);
      savedList.append(link);
    });
  } else {
    const wrapper = document.createElement("div");
    wrapper.className = "saved-empty";
    const title = document.createElement("strong");
    title.textContent = "아직 저장한 업체가 없어요.";
    const description = document.createElement("span");
    description.textContent = "업체 상세 화면에서 관심 업체로 저장해보세요.";
    wrapper.append(title, description);
    savedList.append(wrapper);
  }

  document.querySelector("#logout-button").addEventListener("click", async () => {
    await window.TaranAuth.api("/api/auth/logout", { method: "POST" });
    window.location.href = "index.html";
  });

  const deleteButton = document.querySelector("#delete-account-button");
  if (deleteButton) {
    deleteButton.hidden = !window.TaranAuth.isConfigured();
    deleteButton.addEventListener("click", async () => {
      if (!window.confirm("회원 탈퇴를 요청하면 저장한 업체와 준비 내용이 삭제되고 로그아웃됩니다. 계속할까요?")) return;
      deleteButton.disabled = true;
      try {
        await window.TaranAuth.api("/api/auth/account", { method: "DELETE" });
        window.alert("탈퇴 요청이 접수되었습니다. 법정 보관 의무가 없는 계정 정보는 운영자가 확인 후 삭제합니다.");
        window.location.href = "index.html";
      } catch (error) {
        window.alert(error.message || "탈퇴 요청을 접수하지 못했습니다.");
        deleteButton.disabled = false;
      }
    });
  }
})();
