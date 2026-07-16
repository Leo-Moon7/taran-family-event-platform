(function () {
  "use strict";
  const { element, openEditor, addPageAction, setEmptyState } = window.TaranAdmin;
  const table = document.querySelector("[data-admin-table]");
  const empty = document.querySelector("[data-admin-empty]");
  const communityTable = document.querySelector("[data-community-table]");
  const communitySection = document.querySelector("[data-community-section]");
  const communityEmpty = document.querySelector("[data-community-empty]");
  let online = false;
  let posts = [];
  const fields = [
    { name: "slug", label: "게시글 고유 주소", required: true, placeholder: "예: family-event-budget", help: "영문 소문자, 숫자, 하이픈만 사용해 주세요." },
    { name: "title", label: "제목", required: true },
    { name: "category", label: "주제", required: true, placeholder: "예: 예산·계약" },
    { name: "excerpt", label: "목록 소개", type: "textarea", rows: 3, required: true },
    { name: "body", label: "본문", type: "textarea", rows: 12, required: true, help: "일반 텍스트로 입력합니다. 문단은 줄바꿈으로 구분해 주세요." },
    { name: "status", label: "공개 상태", type: "select", options: [
      { value: "draft", label: "임시 저장" }, { value: "published", label: "공개" }, { value: "archived", label: "보관" }
    ] }
  ];
  function normaliseSlug(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""); }
  async function save(values, originalSlug) {
    const slug = normaliseSlug(values.slug);
    if (!slug) throw new Error("게시글 고유 주소를 영문으로 입력해 주세요.");
    const data = { title: values.title.trim(), category: values.category.trim(), excerpt: values.excerpt.trim(), body: values.body.trim(), publishedAt: new Date().toISOString().slice(0, 10) };
    await window.TaranAdminData.upsert("articles", { slug, data, status: values.status || "draft", updated_at: new Date().toISOString() }, "slug");
    if (originalSlug && originalSlug !== slug) await window.TaranAdminData.remove("articles", { slug: `eq.${originalSlug}` });
    await load();
  }
  function edit(post) { openEditor({ title: post ? "준비백과 글 수정" : "준비백과 글 등록", fields, initial: post || { status: "draft" }, onSubmit: values => save(values, post?.slug) }); }
  function render() {
    table?.replaceChildren();
    posts.forEach(post => {
      const row = document.createElement("tr");
      [post.title || "제목 없음", post.category || post.topic || "미분류", post.status === "draft" ? "임시 저장" : post.status === "archived" ? "보관" : "공개", post.publishedAt || post.date || "-"]
        .forEach(value => row.append(element("td", value)));
      const manage = document.createElement("td");
      const link = element("a", "글 보기");
      link.href = `../article.html?slug=${encodeURIComponent(post.slug || "")}`;
      manage.append(link);
      if (online) {
        const button = element("button", "수정", "admin-text-button");
        button.type = "button";
        button.addEventListener("click", () => edit(post));
        manage.append(button);
      }
      row.append(manage);
      table?.append(row);
    });
    setEmptyState(empty, posts.length);
  }
  async function load() {
    if (online) {
      const rows = await window.TaranAdminData.list("articles", { order: "updated_at.desc" });
      posts = rows.map(row => ({ ...(row.data || {}), slug: row.slug, status: row.status, date: row.updated_at }));
    } else posts = window.TaranBlogPosts || window.taran_BLOG_POSTS || window.blogData || window.articleData || [];
    render();
  }
  async function moderateCommunity(id, status, button) {
    button.disabled = true;
    try {
      await window.TaranAdminData.update("communityPosts", { status, updated_at: new Date().toISOString() }, { id: `eq.${id}` });
      await loadCommunity();
    } catch (error) { alert(error.message); button.disabled = false; }
  }
  async function loadCommunity() {
    if (!online || !communityTable || !communitySection) return;
    communitySection.hidden = false;
    const rows = await window.TaranAdminData.list("communityPosts", { status: "eq.pending", order: "created_at.asc", limit: 100 });
    communityTable.replaceChildren();
    rows.forEach(item => {
      const row = document.createElement("tr");
      [String(item.created_at || "").slice(0, 10), item.category || "-", item.title || "-", item.author_name || "-"]
        .forEach(value => row.append(element("td", value)));
      const manage = document.createElement("td");
      const approve = element("button", "공개", "admin-text-button");
      approve.type = "button";
      approve.addEventListener("click", () => moderateCommunity(item.id, "published", approve));
      const hide = element("button", "숨기기", "admin-text-button");
      hide.type = "button";
      hide.addEventListener("click", () => moderateCommunity(item.id, "hidden", hide));
      manage.append(approve, hide);
      row.append(manage);
      communityTable.append(row);
    });
    if (communityEmpty) communityEmpty.hidden = Boolean(rows.length);
  }
  async function init() {
    const access = await window.TaranAdminReady;
    if (!access.allowed) return;
    online = access.mode === "online";
    if (online) addPageAction("새 글 등록", () => edit(null));
    await load();
    await loadCommunity();
  }
  init().catch(error => console.error("콘텐츠 목록을 불러오지 못했습니다.", error));
})();
