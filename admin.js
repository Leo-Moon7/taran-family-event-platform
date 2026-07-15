(function () {
  const storageKey = "memoa-admin-overrides-preview";
  const configStorageKey = "taran-admin-db-config";
  const baseConfig = window.memoaAdminConfig || window.memoaContentConfig || {};
  const savedConfig = (() => {
    try {
      return JSON.parse(localStorage.getItem(configStorageKey) || "{}");
    } catch (error) {
      return {};
    }
  })();
  const config = {
    ...baseConfig,
    ...savedConfig,
    tables: {
      ...((baseConfig && baseConfig.tables) || {}),
      ...((savedConfig && savedConfig.tables) || {})
    }
  };
  const tables = {
    siteCopy: "memoa_site_copy",
    providers: "memoa_providers",
    articles: "memoa_articles",
    banners: "memoa_banners",
    customers: "memoa_customers",
    revisions: "memoa_content_revisions",
    adminEvents: "memoa_admin_events",
    ...(config.tables || {})
  };

  const defaultCopy = [
    { label: "메인 배지", selector: ".memoa-badge", text: "프리미엄 가족행사 큐레이션" },
    { label: "메인 제목", selector: "#memoa-hero-title", html: "가족의 중요한 날,<br>더 쉽고 완벽하게 준비하세요." },
    { label: "메인 설명", selector: ".memoa-hero-copy p", text: "행사 종류와 조건을 입력하면 장소, 업체, 예상 비용과 준비 일정을 한 번에 확인할 수 있어요." },
    { label: "카테고리 제목", selector: "#memoa-category-title", text: "어떤 날을 준비하시나요?" },
    { label: "업체 섹션 제목", selector: "#memoa-partner-title", text: "조건에 맞는 장소와 업체를 먼저 보여드려요." }
  ];

  const defaultBanners = [
    {
      id: "home-point",
      placement: "home-point",
      status: "published",
      eyebrow: "memoa point",
      title: "견적서나 업체 정보를 공유하면 포인트를 쌓을 수 있어요.",
      body: "공유한 자료는 업체 조건표를 보강하는 데만 사용하고, 원본 파일은 검토 후 보관하지 않는 기준으로 운영합니다.",
      ctaLabel: "정보 공유하기",
      ctaUrl: "contribute.html",
      image: "",
      startDate: "",
      endDate: ""
    },
    {
      id: "directory-guide",
      placement: "directory-bottom",
      status: "published",
      eyebrow: "비교 팁",
      title: "업체를 고를 때는 최근 후기와 기본 조건을 함께 보세요.",
      body: "행사 유형, 지역, 공간 성격을 먼저 좁히면 우리 가족에게 맞는 후보를 더 빠르게 찾을 수 있습니다.",
      ctaLabel: "준비백과 보기",
      ctaUrl: "articles.html",
      image: "",
      startDate: "",
      endDate: ""
    }
  ];

  const sampleCustomers = [
    { id: "sample-customer-1", name: "김메모", email: "memo***@example.com", phone: "010-****-1207", savedCount: 4, contributionCount: 1, points: 1200, lastActive: "2026.07.14", status: "active" },
    { id: "sample-customer-2", name: "이준비", email: "ready***@example.com", phone: "010-****-8811", savedCount: 2, contributionCount: 0, points: 300, lastActive: "2026.07.13", status: "pending" }
  ];

  const statSeed = [
    { label: "00시", count: 46 },
    { label: "01시", count: 113 },
    { label: "02시", count: 52 },
    { label: "03시", count: 40 },
    { label: "04시", count: 98 },
    { label: "05시", count: 30 },
    { label: "06시", count: 44 },
    { label: "07시", count: 66 },
    { label: "08시", count: 62 },
    { label: "09시", count: 76 },
    { label: "10시", count: 42 }
  ];

  let state = loadState();
  let supabaseClient = null;
  let currentUser = null;
  let recentActions = [];

  function today() {
    return new Date().toISOString().slice(0, 10).replace(/-/g, ".");
  }

  function nowLabel() {
    return new Date().toLocaleString("ko-KR", { hour12: false });
  }

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function loadState() {
    try {
      const preview = localStorage.getItem(storageKey);
      if (preview) return normalizeState(JSON.parse(preview));
    } catch (error) {
      console.warn("미리보기 데이터를 읽지 못했습니다.", error);
    }
    return normalizeState(window.memoaContentOverrides || emptyState());
  }

  function emptyState() {
    return { version: today(), siteCopy: [], providers: [], articles: [], banners: [], customers: [] };
  }

  function normalizeState(value) {
    return {
      version: value?.version || today(),
      siteCopy: Array.isArray(value?.siteCopy) ? value.siteCopy : [],
      providers: Array.isArray(value?.providers) ? value.providers : [],
      articles: Array.isArray(value?.articles) ? value.articles : [],
      banners: Array.isArray(value?.banners) ? value.banners : [],
      customers: Array.isArray(value?.customers) ? value.customers : []
    };
  }

  function publicState() {
    syncCopyFromRows();
    return {
      version: state.version || today(),
      siteCopy: state.siteCopy,
      providers: state.providers,
      articles: state.articles,
      banners: state.banners
    };
  }

  function splitList(value) {
    return String(value || "")
      .split(/[,|\n]/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function parseJson(value, fallback) {
    if (!String(value || "").trim()) return fallback;
    try {
      return JSON.parse(value);
    } catch (error) {
      alert("JSON 형식이 올바르지 않습니다.");
      return fallback;
    }
  }

  function parseSections(text) {
    const sections = [];
    let current = null;
    String(text || "").split(/\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith("## ")) {
        current = { heading: trimmed.replace(/^##\s+/, ""), body: [] };
        sections.push(current);
      } else {
        if (!current) {
          current = { heading: "본문", body: [] };
          sections.push(current);
        }
        current.body.push(trimmed);
      }
    });
    return sections;
  }

  function sectionsToText(sections) {
    return (sections || [])
      .map(section => `## ${section.heading}\n${(section.body || []).join("\n")}`)
      .join("\n\n");
  }

  function escapeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function escapeAttr(value) {
    return escapeText(value);
  }

  function setText(selector, value) {
    $all(selector).forEach(el => {
      el.textContent = value;
    });
  }

  function fillConfigFields() {
    const urlInput = $("[data-config-field=\"supabaseUrl\"]");
    const keyInput = $("[data-config-field=\"supabaseAnonKey\"]");
    if (urlInput) urlInput.value = config.supabaseUrl || "";
    if (keyInput) keyInput.value = config.supabaseAnonKey || "";
  }

  function saveConfigFields() {
    const supabaseUrl = $("[data-config-field=\"supabaseUrl\"]")?.value.trim() || "";
    const supabaseAnonKey = $("[data-config-field=\"supabaseAnonKey\"]")?.value.trim() || "";
    if (!supabaseUrl || !supabaseAnonKey) {
      alert("Project URL과 anon public key를 모두 입력해 주세요.");
      return;
    }
    localStorage.setItem(configStorageKey, JSON.stringify({ supabaseUrl, supabaseAnonKey }));
    alert("연결 정보를 이 브라우저에 저장했습니다. 새로고침 후 로그인하면 온라인 저장을 테스트할 수 있습니다.");
  }

  function download(filename, content, type = "application/json") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function upsert(list, item, key) {
    const index = list.findIndex(existing => existing && existing[key] === item[key]);
    if (index >= 0) list[index] = item;
    else list.unshift(item);
  }

  function allProviders() {
    const base = Array.isArray(window.publicDirectoryData) ? window.publicDirectoryData : [];
    const merged = [...base];
    state.providers.forEach(item => upsert(merged, item, "id"));
    return merged;
  }

  function visibleProviders() {
    return allProviders().filter(item => (item.publicationStatus || "published") === "published");
  }

  function updateDashboard() {
    state.version = today();
    const siteId = config.siteId || "memoa";
    const dbReady = isDbConfigured();
    const providers = visibleProviders();
    const reviewing = allProviders().filter(item => ["draft", "reviewing", "hidden"].includes(item.publicationStatus || item.status)).length;
    const quoteCount = state.customers.reduce((sum, customer) => sum + Number(customer.contributionCount || 0), 0);

    setText("[data-site-id]", siteId);
    setText("[data-count-copy]", state.siteCopy.length);
    setText("[data-count-provider]", state.providers.length);
    setText("[data-count-article]", state.articles.length);
    setText("[data-count-banner]", activeBanners().length);
    setText("[data-count-customer]", customerData().length);
    setText("[data-count-quote]", quoteCount);
    setText("[data-count-reviewing]", reviewing);
    setText("[data-public-provider-count]", providers.length);
    setText("[data-db-mode]", dbReady ? (currentUser ? "온라인 DB 연결" : "DB 설정 완료 · 로그인 필요") : "로컬/파일 내보내기");
    setText("[data-current-user]", currentUser?.email || "로그인 전");
    renderRecentActions();
  }

  function addRecent(action, actor = currentUser?.email || "local") {
    recentActions.unshift({ action, time: nowLabel(), actor });
    recentActions = recentActions.slice(0, 6);
    renderRecentActions();
  }

  function renderRecentActions() {
    const root = $("[data-recent-actions]");
    if (!root) return;
    const rows = recentActions.length ? recentActions : [{ action: "관리자 화면 준비", time: "-", actor: "local" }];
    root.innerHTML = rows.map(row => `
      <tr>
        <td>${escapeText(row.action)}</td>
        <td>${escapeText(row.time)}</td>
        <td>${escapeText(row.actor)}</td>
      </tr>
    `).join("");
  }

  function renderCopyList() {
    const root = $("[data-copy-list]");
    if (!root) return;
    const items = state.siteCopy.length ? state.siteCopy : defaultCopy;
    root.innerHTML = items.map((item, index) => {
      const mode = item.html ? "html" : "text";
      const value = item.html || item.text || "";
      return `
        <article class="admin-copy-row" data-copy-row="${index}">
          <label>이름<input data-copy-label value="${escapeAttr(item.label || "")}"></label>
          <label>선택자<input data-copy-selector value="${escapeAttr(item.selector || "")}"></label>
          <label>입력 방식
            <select data-copy-mode>
              <option value="text"${mode === "text" ? " selected" : ""}>텍스트</option>
              <option value="html"${mode === "html" ? " selected" : ""}>HTML</option>
            </select>
          </label>
          <label class="admin-wide-label">문구<textarea data-copy-value rows="3">${escapeText(value)}</textarea></label>
          <button type="button" class="cms-btn cms-btn-danger" data-copy-remove>삭제</button>
        </article>
      `;
    }).join("");

    $all(".admin-copy-row", root).forEach(row => {
      row.addEventListener("input", () => {
        syncCopyFromRows();
        renderOutput();
      });
      row.querySelector("[data-copy-remove]")?.addEventListener("click", () => {
        const index = Number(row.dataset.copyRow);
        syncCopyFromRows();
        state.siteCopy.splice(index, 1);
        renderCopyList();
        renderOutput();
      });
    });

    if (!state.siteCopy.length) syncCopyFromRows();
  }

  function syncCopyFromRows() {
    state.siteCopy = $all(".admin-copy-row").map(row => {
      const mode = row.querySelector("[data-copy-mode]")?.value || "text";
      const value = row.querySelector("[data-copy-value]")?.value || "";
      const item = {
        label: row.querySelector("[data-copy-label]")?.value.trim() || "",
        selector: row.querySelector("[data-copy-selector]")?.value.trim() || ""
      };
      if (mode === "html") item.html = value;
      else item.text = value;
      return item;
    }).filter(item => item.selector);
  }

  function addCopyRow() {
    syncCopyFromRows();
    state.siteCopy.push({ label: "새 문구", selector: "", text: "" });
    renderCopyList();
    renderOutput();
  }

  function bannerData() {
    return state.banners.length ? state.banners : defaultBanners;
  }

  function activeBanners() {
    return bannerData().filter(item => (item.status || "published") === "published");
  }

  function getBannerField(field) {
    return $(`[data-banner-field="${field}"]`)?.value.trim() || "";
  }

  function setBannerField(field, value) {
    const el = $(`[data-banner-field="${field}"]`);
    if (el) el.value = value ?? "";
  }

  function bannerFromForm() {
    const title = getBannerField("title");
    if (!title) {
      alert("배너 제목을 입력해 주세요.");
      return null;
    }
    const id = getBannerField("id") || `banner-${slugify(title) || Date.now()}`;
    return {
      id,
      placement: getBannerField("placement") || "home-point",
      status: getBannerField("status") || "published",
      eyebrow: getBannerField("eyebrow"),
      title,
      body: getBannerField("body"),
      ctaLabel: getBannerField("ctaLabel"),
      ctaUrl: getBannerField("ctaUrl"),
      image: getBannerField("image"),
      startDate: getBannerField("startDate"),
      endDate: getBannerField("endDate")
    };
  }

  function fillBanner(item) {
    ["id", "placement", "status", "eyebrow", "title", "body", "ctaLabel", "ctaUrl", "image", "startDate", "endDate"]
      .forEach(field => setBannerField(field, item?.[field] || ""));
    renderBannerPreview(item);
  }

  function renderBannerPreview(item = bannerFromForm()) {
    const root = $("[data-banner-preview-box]");
    if (!root || !item) return;
    root.innerHTML = `
      ${item.image ? `<img src="${escapeAttr(item.image)}" alt="">` : ""}
      <span>${escapeText(item.eyebrow || "미리보기")}</span>
      <h3>${escapeText(item.title || "배너 제목")}</h3>
      <p>${escapeText(item.body || "배너 설명이 여기에 표시됩니다.")}</p>
      ${item.ctaLabel ? `<a href="${escapeAttr(item.ctaUrl || "#")}">${escapeText(item.ctaLabel)}</a>` : ""}
    `;
  }

  function renderBannerList() {
    const root = $("[data-banner-list]");
    if (!root) return;
    const rows = bannerData();
    root.innerHTML = rows.map(item => `
      <tr>
        <td><span class="cms-status-pill is-${escapeAttr(item.status || "published")}">${escapeText(statusLabel(item.status))}</span></td>
        <td>${escapeText(placementLabel(item.placement))}</td>
        <td>${escapeText(item.title || "-")}</td>
        <td>${escapeText([item.startDate, item.endDate].filter(Boolean).join(" ~ ") || "상시")}</td>
        <td>
          <button type="button" class="cms-mini-btn" data-banner-edit="${escapeAttr(item.id)}">수정</button>
          <button type="button" class="cms-mini-btn cms-mini-btn-danger" data-banner-remove="${escapeAttr(item.id)}">삭제</button>
        </td>
      </tr>
    `).join("");
    $all("[data-banner-edit]", root).forEach(button => {
      button.addEventListener("click", () => fillBanner(rows.find(item => item.id === button.dataset.bannerEdit)));
    });
    $all("[data-banner-remove]", root).forEach(button => {
      button.addEventListener("click", () => {
        if (!state.banners.length) state.banners = [...defaultBanners];
        state.banners = state.banners.filter(item => item.id !== button.dataset.bannerRemove);
        renderBannerList();
        renderOutput();
      });
    });
  }

  function statusLabel(status) {
    return ({ published: "공개", draft: "임시저장", archived: "숨김", active: "정상", pending: "확인 대기", blocked: "제한", hidden: "숨김" }[status]) || "공개";
  }

  function placementLabel(placement) {
    return ({
      "home-point": "메인 정보 공유 영역",
      "directory-bottom": "업체 목록 하단",
      "article-top": "준비백과 상단",
      "calculator-top": "계산기 상단",
      "global-popup": "팝업/공지"
    }[placement]) || placement || "-";
  }

  function customerData() {
    return state.customers.length ? state.customers : sampleCustomers;
  }

  function renderCustomerList() {
    const root = $("[data-customer-list]");
    if (!root) return;
    const keyword = ($("[data-customer-search]")?.value || "").trim().toLowerCase();
    const status = $("[data-customer-status-filter]")?.value || "";
    const rows = customerData().filter(item => {
      const haystack = [item.name, item.email, item.phone].join(" ").toLowerCase();
      return (!keyword || haystack.includes(keyword)) && (!status || item.status === status);
    });
    root.innerHTML = rows.map(item => `
      <tr>
        <td><strong>${escapeText(item.name || "-")}</strong><small>${escapeText(item.id || "")}</small></td>
        <td>${escapeText(item.email || "-")}<br><small>${escapeText(item.phone || "")}</small></td>
        <td>저장 ${Number(item.savedCount || 0)}개 · 제보 ${Number(item.contributionCount || 0)}건</td>
        <td>${Number(item.points || 0).toLocaleString("ko-KR")}P</td>
        <td>${escapeText(item.lastActive || "-")}</td>
        <td><span class="cms-status-pill is-${escapeAttr(item.status || "active")}">${escapeText(statusLabel(item.status || "active"))}</span></td>
      </tr>
    `).join("");
  }

  function renderVendorDbList() {
    const root = $("[data-vendor-db-list]");
    if (!root) return;
    const keyword = ($("[data-vendor-search]")?.value || "").trim().toLowerCase();
    const status = $("[data-vendor-status-filter]")?.value || "";
    const rows = allProviders().filter(item => {
      const publicationStatus = item.publicationStatus || item.status || "published";
      const haystack = [item.name, item.region, item.area, item.category, item.subcategory, (item.tags || []).join(" ")].join(" ").toLowerCase();
      return (!keyword || haystack.includes(keyword)) && (!status || publicationStatus === status);
    }).slice(0, 120);

    root.innerHTML = rows.map(item => {
      const publicationStatus = item.publicationStatus || item.status || "published";
      const reviewCount = Number(item.sourceCount || item.externalReviews?.length || 0);
      const rating = item.internalRating ? ` · ★ ${Number(item.internalRating).toFixed(1)}` : "";
      return `
        <tr>
          <td><strong>${escapeText(item.name || "-")}</strong><small>${escapeText(item.id || "")}</small></td>
          <td>${escapeText([item.region, item.area].filter(Boolean).join(" ") || "-")}</td>
          <td>${escapeText([item.category, item.subcategory].filter(Boolean).join(" · ") || "-")}</td>
          <td>후기 ${reviewCount.toLocaleString("ko-KR")}개${escapeText(rating)}</td>
          <td><span class="cms-status-pill is-${escapeAttr(publicationStatus)}">${escapeText(statusLabel(publicationStatus))}</span></td>
          <td><a class="cms-mini-btn" href="provider.html?id=${encodeURIComponent(item.id)}" target="_blank" rel="noopener">보기</a></td>
        </tr>
      `;
    }).join("");
  }

  function renderStats() {
    const root = $("[data-stat-rows]");
    if (!root) return;
    const total = statSeed.reduce((sum, row) => sum + row.count, 0);
    root.innerHTML = statSeed.map(row => {
      const percent = total ? Math.round(row.count / total * 1000) / 10 : 0;
      return `
        <tr>
          <td>${escapeText(row.label)}</td>
          <td><span class="cms-bar"><i style="width:${percent}%"></i></span></td>
          <td>${row.count.toLocaleString("ko-KR")}</td>
          <td>${percent.toFixed(1)}%</td>
        </tr>
      `;
    }).join("");
    setText("[data-stat-visits]", total.toLocaleString("ko-KR"));
    setText("[data-stat-provider-clicks]", Math.max(0, Math.round(visibleProviders().length * 0.48)).toLocaleString("ko-KR"));
    setText("[data-stat-contributions]", customerData().reduce((sum, item) => sum + Number(item.contributionCount || 0), 0).toLocaleString("ko-KR"));
    setText("[data-stat-articles]", (window.memoa_BLOG_POSTS || []).reduce((sum, item, index) => sum + (index < 4 ? 600 + index * 143 : 0), 0).toLocaleString("ko-KR"));
  }

  function fillSelects() {
    const providerSelect = $("[data-provider-template]");
    if (providerSelect && window.publicDirectoryData) {
      providerSelect.innerHTML += window.publicDirectoryData.slice(0, 800)
        .map(item => `<option value="${escapeAttr(item.id)}">${escapeText(item.name)} · ${escapeText(item.region || "")}</option>`)
        .join("");
      providerSelect.addEventListener("change", () => {
        const item = window.publicDirectoryData.find(entry => entry.id === providerSelect.value);
        if (item) fillProvider(item);
      });
    }

    const articleSelect = $("[data-article-template]");
    if (articleSelect && window.memoa_BLOG_POSTS) {
      articleSelect.innerHTML += window.memoa_BLOG_POSTS
        .map(item => `<option value="${escapeAttr(item.slug)}">${escapeText(item.title)}</option>`)
        .join("");
      articleSelect.addEventListener("change", () => {
        const item = window.memoa_BLOG_POSTS.find(entry => entry.slug === articleSelect.value);
        if (item) fillArticle(item);
      });
    }
  }

  function detailFact(item, keys) {
    const facts = item.detailFacts || {};
    for (const key of keys) {
      if (facts[key]) return facts[key];
    }
    return "";
  }

  function fillProvider(item) {
    setProvider("name", item.name);
    setProvider("id", item.id);
    setProvider("category", item.category);
    setProvider("subcategory", item.subcategory);
    setProvider("region", item.region);
    setProvider("area", item.area);
    setProvider("roadAddress", item.roadAddress || detailFact(item, ["도로명 주소", "주소", "roadAddress"]));
    setProvider("officialLink", item.officialLink || "");
    setProvider("priceLabel", item.priceLabel || detailFact(item, ["가격", "예상가", "식대"]));
    setProvider("minCapacity", item.minCapacity || detailFact(item, ["최소 수용인원", "최소 인원"]));
    setProvider("maxCapacity", item.maxCapacity || detailFact(item, ["최대 수용인원", "최대 인원"]));
    setProvider("sourceCount", item.sourceCount || item.externalReviews?.length || "");
    setProvider("internalRating", item.internalRating || "");
    setProvider("image", item.image || "assets/images/venue-hanjeongsik.webp");
    setProvider("intro", item.intro || "");
    setProvider("tags", (item.tags || []).join(", "));
    setProvider("eventTags", (item.eventTags || []).join(", "));
    setProvider("checkpoints", (item.checkpoints || []).join("\n"));
    setProvider("externalReviews", JSON.stringify(item.externalReviews || [], null, 2));
    renderProviderReviewList();
  }

  function setProvider(field, value) {
    const el = $(`[data-provider-field="${field}"]`);
    if (el) el.value = value ?? "";
  }

  function providerReviewItems() {
    return parseJson($("[data-provider-field=\"externalReviews\"]")?.value, []);
  }

  function writeProviderReviews(items) {
    const box = $("[data-provider-field=\"externalReviews\"]");
    if (box) box.value = JSON.stringify(items || [], null, 2);
    const countInput = $("[data-provider-field=\"sourceCount\"]");
    if (countInput && !countInput.value) countInput.value = String((items || []).length);
    renderProviderReviewList();
  }

  function renderProviderReviewList() {
    const root = $("[data-provider-review-list]");
    if (!root) return;
    const items = providerReviewItems();
    root.innerHTML = items.length ? items.map((item, index) => `
      <li>
        <span>
          <strong>${escapeText(item.title || "제목 없음")}</strong>
          <small>${escapeText(item.publishedDate || item.date || "")}</small>
        </span>
        <a href="${escapeAttr(item.url || item.link || "#")}" target="_blank" rel="noopener">열기</a>
        <button type="button" class="cms-mini-btn-danger" data-provider-review-remove="${index}">삭제</button>
      </li>
    `).join("") : `<li class="is-empty">아직 추가한 참고 후기가 없습니다.</li>`;
  }

  function addProviderReview() {
    const get = field => $(`[data-provider-review-field="${field}"]`)?.value.trim() || "";
    const title = get("title");
    const url = get("url");
    const publishedDate = get("publishedDate");
    if (!title || !url) {
      alert("후기 제목과 링크 주소를 입력해 주세요.");
      return;
    }
    const items = providerReviewItems();
    items.push({ title, url, publishedDate });
    writeProviderReviews(items);
    $all("[data-provider-review-field]").forEach(input => {
      input.value = "";
    });
  }

  function providerPublicationStatus() {
    const checked = $all("[data-provider-check]").filter(input => input.checked).length;
    return checked >= 3 ? "published" : "draft";
  }

  function providerFromForm() {
    const get = field => $(`[data-provider-field="${field}"]`)?.value.trim() || "";
    const name = get("name");
    if (!name) {
      alert("업체명을 입력해 주세요.");
      return null;
    }
    const region = get("region");
    const area = get("area");
    const subcategory = get("subcategory");
    const roadAddress = get("roadAddress");
    const minCapacity = Number(get("minCapacity") || 0);
    const maxCapacity = Number(get("maxCapacity") || 0);
    const priceLabel = get("priceLabel");
    return {
      id: get("id") || `custom-${slugify(name)}`,
      name,
      category: get("category") || "공간 대여",
      subcategory,
      region,
      area,
      roadAddress,
      priceLabel,
      minCapacity: minCapacity || undefined,
      maxCapacity: maxCapacity || undefined,
      sourceCount: Number(get("sourceCount") || 0),
      internalRating: get("internalRating") ? Number(get("internalRating")) : undefined,
      image: get("image") || "assets/images/venue-hanjeongsik.webp",
      intro: get("intro") || `${[region, area].filter(Boolean).join(" ")}에서 가족행사를 준비할 때 비교해볼 수 있는 파트너입니다.`,
      tags: splitList(get("tags")),
      eventTags: splitList(get("eventTags")),
      serviceTags: ["venue"],
      checkpoints: splitList(get("checkpoints")),
      externalReviews: parseJson(get("externalReviews"), []),
      detailFacts: {
        "업체명": name,
        "업종": subcategory || get("category"),
        "도로명 주소": roadAddress,
        "가격": priceLabel || "상담 시 안내",
        "최소 수용인원": minCapacity ? `${minCapacity}명` : "상담 시 안내",
        "최대 수용인원": maxCapacity ? `${maxCapacity}명` : "상담 시 안내",
        "공간/서비스": subcategory || get("category"),
        "주차": "상담 시 안내"
      },
      officialLink: get("officialLink"),
      publicationStatus: providerPublicationStatus(),
      verifiedAt: today()
    };
  }

  function fillArticle(item) {
    setArticle("slug", item.slug);
    setArticle("category", item.category);
    setArticle("title", item.title);
    setArticle("date", item.date);
    setArticle("readTime", item.readTime);
    setArticle("image", item.image);
    setArticle("excerpt", item.excerpt);
    setArticle("tags", (item.tags || []).join(", "));
    setArticle("sectionsText", sectionsToText(item.sections || []));
    setArticle("checklist", (item.checklist || []).join("\n"));
    setArticle("aiPrompt", "");
  }

  function setArticle(field, value) {
    const el = $(`[data-article-field="${field}"]`);
    if (el) el.value = value ?? "";
  }

  function articleFromForm() {
    const get = field => $(`[data-article-field="${field}"]`)?.value.trim() || "";
    const title = get("title");
    if (!title) {
      alert("글 제목을 입력해 주세요.");
      return null;
    }
    return {
      slug: get("slug") || `custom-${slugify(title)}`,
      category: get("category") || "준비 가이드",
      title,
      excerpt: get("excerpt"),
      date: get("date") || today(),
      readTime: get("readTime") || "5분",
      image: get("image") || "assets/images/editorial-checklist.webp",
      alt: title,
      tags: splitList(get("tags")),
      sections: parseSections(get("sectionsText")),
      checklist: splitList(get("checklist")),
      summaryPoints: [],
      questions: [],
      pitfalls: [],
      nextActions: []
    };
  }

  function renderOutput() {
    syncCopyFromRows();
    state.version = today();
    const output = $("[data-admin-output]");
    const jsonBox = $("[data-admin-json]");
    const text = JSON.stringify(state, null, 2);
    if (output) output.textContent = text;
    if (jsonBox && document.activeElement !== jsonBox) jsonBox.value = text;
    renderBannerList();
    renderCustomerList();
    renderVendorDbList();
    renderStats();
    updateDashboard();
  }

  function savePreview() {
    syncCopyFromRows();
    state.version = today();
    localStorage.setItem(storageKey, JSON.stringify(publicState()));
    setText("[data-last-sync]", nowLabel());
    addRecent("브라우저 미리보기 저장");
    alert("현재 브라우저 미리보기에 저장했습니다. 공개 페이지를 새로고침하면 반영됩니다.");
  }

  function exportJs() {
    syncCopyFromRows();
    state.version = today();
    const js = `window.memoaContentOverrides = ${JSON.stringify(publicState(), null, 2)};\n`;
    download("content-overrides.js", js, "text/javascript");
    addRecent("content-overrides.js 내보내기");
  }

  function exportJson() {
    syncCopyFromRows();
    state.version = today();
    download("memoa-admin-backup.json", JSON.stringify(state, null, 2), "application/json");
    addRecent("관리자 JSON 백업 내보내기");
  }

  function importJson() {
    const next = parseJson($("[data-admin-json]")?.value, null);
    if (!next) return;
    state = normalizeState(next);
    renderCopyList();
    renderBannerList();
    renderOutput();
    addRecent("JSON 가져오기");
    alert("JSON을 불러왔습니다.");
  }

  async function copyJson() {
    const text = JSON.stringify(state, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      alert("JSON을 복사했습니다.");
    } catch (error) {
      const box = $("[data-admin-json]");
      if (box) box.value = text;
      alert("복사 권한이 없어 JSON 입력창에 표시했습니다.");
    }
  }

  function aiTemplate() {
    const request = [
      "아래 메모아 관리자 JSON 구조를 유지해서 업데이트해줘.",
      "고객에게 보이는 문구는 자연스럽게 작성하고, 가격·수용인원처럼 확정이 필요한 정보는 근거가 있을 때만 넣어줘.",
      "업체는 providers 배열, 준비백과 글은 articles 배열, 배너는 banners 배열에 추가해줘.",
      "customers 배열에는 개인정보가 들어갈 수 있으니 공개 파일로 내보내지 않도록 주의해줘.",
      "",
      JSON.stringify(state, null, 2)
    ].join("\n");
    const output = $("[data-admin-ai-output]");
    if (output) output.value = request;
  }

  function isDbConfigured() {
    return /^https?:\/\//.test(config.supabaseUrl || "") && Boolean(config.supabaseAnonKey);
  }

  function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    if (!isDbConfigured()) return null;
    if (!window.supabase?.createClient) return null;
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return supabaseClient;
  }

  async function initOnlineAdmin() {
    const client = getSupabaseClient();
    if (!client) {
      updateDashboard();
      return;
    }
    try {
      const { data } = await client.auth.getSession();
      currentUser = data?.session?.user || null;
      $("[data-admin-logout]")?.toggleAttribute("hidden", !currentUser);
      updateDashboard();
      if (currentUser) await loadFromDb(false);
    } catch (error) {
      console.warn("관리자 세션 확인 실패", error);
    }
  }

  async function login(event) {
    event.preventDefault();
    const client = getSupabaseClient();
    if (!client) {
      alert("온라인 저장 연결이 아직 없습니다. 고급 설정에서 Supabase 연결 정보를 먼저 저장해 주세요.");
      return;
    }
    const email = $("[data-admin-email]")?.value.trim();
    const password = $("[data-admin-password]")?.value;
    if (!email || !password) {
      alert("관리자 이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      alert(`로그인에 실패했습니다: ${error.message}`);
      return;
    }
    currentUser = data.user;
    $("[data-admin-logout]")?.removeAttribute("hidden");
    addRecent("관리자 로그인", currentUser.email);
    updateDashboard();
    await loadFromDb();
  }

  async function logout() {
    const client = getSupabaseClient();
    if (!client) return;
    await client.auth.signOut();
    currentUser = null;
    $("[data-admin-logout]")?.setAttribute("hidden", "");
    addRecent("관리자 로그아웃");
    updateDashboard();
  }

  function siteCopyRows() {
    syncCopyFromRows();
    return state.siteCopy.map((item, index) => {
      const mode = item.html ? "html" : "text";
      return {
        id: item.id || slugify(item.selector || item.label || `copy-${index}`),
        site_id: config.siteId || "memoa",
        label: item.label || "",
        selector: item.selector,
        mode,
        text_value: mode === "text" ? item.text || "" : null,
        html_value: mode === "html" ? item.html || "" : null,
        attributes: item.attributes || {},
        status: item.status || "published",
        updated_by: currentUser?.id || null,
        updated_at: new Date().toISOString()
      };
    }).filter(row => row.selector);
  }

  function providerRows() {
    return state.providers.map(item => ({
      id: item.id,
      data: item,
      status: item.publicationStatus || "published",
      updated_by: currentUser?.id || null,
      updated_at: new Date().toISOString()
    })).filter(row => row.id);
  }

  function articleRows() {
    return state.articles.map(item => ({
      slug: item.slug,
      data: item,
      status: item.status || "published",
      updated_by: currentUser?.id || null,
      updated_at: new Date().toISOString()
    })).filter(row => row.slug);
  }

  function bannerRows() {
    return state.banners.map((item, index) => ({
      id: item.id,
      site_id: config.siteId || "memoa",
      placement: item.placement || "home-point",
      data: item,
      status: item.status || "published",
      sort_order: index,
      updated_by: currentUser?.id || null,
      updated_at: new Date().toISOString()
    })).filter(row => row.id);
  }

  function customerRows() {
    return state.customers.map(item => ({
      id: item.id || crypto.randomUUID(),
      data: item,
      status: item.status || "active",
      updated_by: currentUser?.id || null,
      updated_at: new Date().toISOString()
    }));
  }

  async function upsertRows(tableName, rows, conflictKey) {
    if (!rows.length || !tableName) return;
    const client = getSupabaseClient();
    const { error } = await client.from(tableName).upsert(rows, { onConflict: conflictKey });
    if (error) throw error;
  }

  async function saveToDb() {
    const client = getSupabaseClient();
    if (!client) {
      alert("온라인 저장 연결이 없어 저장할 수 없습니다. 고급 설정에서 Supabase 연결 정보를 먼저 저장해 주세요.");
      return;
    }
    if (!currentUser) {
      alert("DB 저장은 관리자 로그인 후 사용할 수 있습니다.");
      return;
    }
    try {
      syncCopyFromRows();
      state.version = today();
      await upsertRows(tables.siteCopy, siteCopyRows(), "id");
      await upsertRows(tables.providers, providerRows(), "id");
      await upsertRows(tables.articles, articleRows(), "slug");
      await upsertRows(tables.banners, bannerRows(), "id");
      await upsertRows(tables.customers, customerRows(), "id");
      await client.from(tables.revisions).insert({
        content_type: "bulk",
        content_key: `memoa-${Date.now()}`,
        action: "admin-save",
        data: {
          version: state.version,
          siteCopy: state.siteCopy.length,
          providers: state.providers.length,
          articles: state.articles.length,
          banners: state.banners.length,
          customers: state.customers.length
        },
        updated_by: currentUser.id
      });
      setText("[data-last-sync]", nowLabel());
      addRecent("DB 저장 완료", currentUser.email);
      alert("DB에 저장했습니다. 공개 페이지는 새로고침하면 공개 상태의 콘텐츠를 읽습니다.");
    } catch (error) {
      console.error(error);
      alert(`DB 저장 중 오류가 발생했습니다: ${error.message || error}`);
    }
  }

  async function selectTable(tableName, queryBuilder) {
    if (!tableName) return { data: [] };
    const result = queryBuilder ? queryBuilder(getSupabaseClient().from(tableName)) : await getSupabaseClient().from(tableName).select("*");
    if (result.error) throw result.error;
    return result;
  }

  async function loadFromDb(showAlert = true) {
    const client = getSupabaseClient();
    if (!client) {
      if (showAlert) alert("온라인 저장 연결이 없어 불러올 수 없습니다.");
      return;
    }
    if (!currentUser) {
      if (showAlert) alert("DB 불러오기는 관리자 로그인 후 사용할 수 있습니다.");
      return;
    }
    try {
      const [copyResult, providerResult, articleResult, bannerResult, customerResult, revisionResult] = await Promise.all([
        client.from(tables.siteCopy).select("*").order("updated_at", { ascending: false }),
        client.from(tables.providers).select("*").order("updated_at", { ascending: false }),
        client.from(tables.articles).select("*").order("updated_at", { ascending: false }),
        client.from(tables.banners).select("*").order("sort_order", { ascending: true }).order("updated_at", { ascending: false }),
        client.from(tables.customers).select("*").order("updated_at", { ascending: false }).limit(200),
        client.from(tables.revisions).select("*").order("created_at", { ascending: false }).limit(6)
      ]);
      [copyResult, providerResult, articleResult, bannerResult, customerResult, revisionResult].forEach(result => {
        if (result.error) throw result.error;
      });
      state = normalizeState({
        version: today(),
        siteCopy: (copyResult.data || []).map(row => ({
          id: row.id,
          label: row.label,
          selector: row.selector,
          ...(row.mode === "html" ? { html: row.html_value || "" } : { text: row.text_value || "" }),
          attributes: row.attributes || {},
          status: row.status
        })),
        providers: (providerResult.data || []).map(row => ({ ...(row.data || {}), id: row.id, publicationStatus: row.status || row.data?.publicationStatus })),
        articles: (articleResult.data || []).map(row => ({ ...(row.data || {}), slug: row.slug, status: row.status || row.data?.status })),
        banners: (bannerResult.data || []).map(row => ({ ...(row.data || {}), id: row.id, placement: row.placement, status: row.status })),
        customers: (customerResult.data || []).map(row => ({ ...(row.data || {}), id: row.id, status: row.status || row.data?.status }))
      });
      recentActions = (revisionResult.data || []).map(row => ({
        action: `${row.content_type} ${row.action}`,
        time: new Date(row.created_at).toLocaleString("ko-KR", { hour12: false }),
        actor: currentUser.email
      }));
      renderCopyList();
      renderBannerList();
      renderOutput();
      setText("[data-last-sync]", nowLabel());
      if (showAlert) alert("DB 콘텐츠를 불러왔습니다.");
    } catch (error) {
      console.error(error);
      if (showAlert) alert(`DB 불러오기 중 오류가 발생했습니다: ${error.message || error}`);
    }
  }

  function bindEvents() {
    $("[data-copy-add]")?.addEventListener("click", addCopyRow);
    $("[data-provider-review-add]")?.addEventListener("click", addProviderReview);
    $("[data-provider-review-list]")?.addEventListener("click", event => {
      const button = event.target.closest("[data-provider-review-remove]");
      if (!button) return;
      const items = providerReviewItems();
      items.splice(Number(button.dataset.providerReviewRemove), 1);
      writeProviderReviews(items);
    });
    $("[data-provider-add]")?.addEventListener("click", () => {
      const item = providerFromForm();
      if (!item) return;
      upsert(state.providers, item, "id");
      renderOutput();
      addRecent("업체 업데이트 추가");
      alert(item.publicationStatus === "published" ? "공개 가능한 업체로 추가했습니다." : "공개 기준이 아직 부족해 검토 대기로 추가했습니다.");
    });
    $("[data-article-add]")?.addEventListener("click", () => {
      const item = articleFromForm();
      if (!item) return;
      upsert(state.articles, item, "slug");
      renderOutput();
      addRecent("준비백과 글 추가");
      alert("준비백과 업데이트 묶음에 추가했습니다.");
    });
    $("[data-banner-form]")?.addEventListener("submit", event => {
      event.preventDefault();
      const item = bannerFromForm();
      if (!item) return;
      if (!state.banners.length) state.banners = [...defaultBanners];
      upsert(state.banners, item, "id");
      renderBannerList();
      renderOutput();
      addRecent("배너 저장");
      alert("배너 업데이트 묶음에 추가했습니다.");
    });
    $("[data-banner-preview]")?.addEventListener("click", () => renderBannerPreview());
    $("[data-banner-clear]")?.addEventListener("click", () => fillBanner({}));
    $("[data-customer-add-sample]")?.addEventListener("click", () => {
      if (!state.customers.length) state.customers = [...sampleCustomers];
      state.customers.unshift({
        id: `customer-${Date.now()}`,
        name: "신규 고객",
        email: "new***@example.com",
        phone: "010-****-0000",
        savedCount: 0,
        contributionCount: 0,
        points: 0,
        lastActive: today(),
        status: "pending"
      });
      renderOutput();
    });
    $("[data-customer-search]")?.addEventListener("input", renderCustomerList);
    $("[data-customer-status-filter]")?.addEventListener("change", renderCustomerList);
    $("[data-vendor-search]")?.addEventListener("input", renderVendorDbList);
    $("[data-vendor-status-filter]")?.addEventListener("change", renderVendorDbList);
    $("[data-vendor-refresh]")?.addEventListener("click", renderVendorDbList);
    $("[data-stats-refresh]")?.addEventListener("click", renderStats);
    $("[data-admin-save-preview]")?.addEventListener("click", savePreview);
    $("[data-admin-download-js]")?.addEventListener("click", exportJs);
    $("[data-admin-download-json]")?.addEventListener("click", exportJson);
    $("[data-admin-load-db]")?.addEventListener("click", () => loadFromDb());
    $("[data-admin-save-db]")?.addEventListener("click", saveToDb);
    $("[data-admin-import]")?.addEventListener("click", importJson);
    $("[data-admin-copy-json]")?.addEventListener("click", copyJson);
    $("[data-admin-ai-template]")?.addEventListener("click", aiTemplate);
    $("[data-admin-login-form]")?.addEventListener("submit", login);
    $("[data-admin-logout]")?.addEventListener("click", logout);
    $("[data-config-save]")?.addEventListener("click", saveConfigFields);
    $("[data-admin-clear]")?.addEventListener("click", () => {
      if (!confirm("현재 업데이트 묶음을 초기화할까요?")) return;
      state = emptyState();
      localStorage.removeItem(storageKey);
      renderCopyList();
      renderBannerList();
      renderOutput();
      addRecent("업데이트 묶음 초기화");
    });
    $all("[data-scroll-target]").forEach(button => {
      button.addEventListener("click", () => {
        document.querySelector(button.dataset.scrollTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderCopyList();
    fillSelects();
    fillBanner(bannerData()[0] || {});
    fillConfigFields();
    renderProviderReviewList();
    renderBannerList();
    renderOutput();
    bindEvents();
    initOnlineAdmin();
  });
})();
