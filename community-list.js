(function () {
  "use strict";

  const listRoot = document.querySelector(".community-thread-list");
  const form = document.querySelector("#community-write-form");
  const message = document.querySelector("[data-community-write-message]");
  let posts = [];

  function text(tag, value, className) {
    const node = document.createElement(tag);
    node.textContent = String(value || "");
    if (className) node.className = className;
    return node;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(date);
  }

  function createRow(post, index) {
    const article = document.createElement("article");
    article.className = `thread-row${index === 0 ? " hot" : ""}`;
    const link = document.createElement("a");
    link.href = `community-post.html?id=${encodeURIComponent(post.id)}`;
    const category = text("b", `[${post.category || "이야기"}] `);
    link.append(category, document.createTextNode(post.title || "제목 없음"));
    const meta = document.createElement("p");
    [post.author_name || post.author || "따란 회원", formatDate(post.created_at) || post.time || "", `댓글 ${post.comment_count || 0}`]
      .filter(Boolean).forEach(value => meta.append(text("span", value)));
    article.append(link, meta);
    return article;
  }

  function render() {
    if (!listRoot) return;
    listRoot.replaceChildren();
    if (!posts.length) {
      const empty = text("div", "아직 공개된 글이 없습니다. 첫 질문을 남겨보세요.", "empty-state");
      listRoot.append(empty);
      return;
    }
    posts.forEach((post, index) => listRoot.append(createRow(post, index)));
  }

  async function loadOnline() {
    const postRows = await window.TaranApi.select(window.TaranConfig.tables.communityPosts, { status: "eq.published", order: "created_at.desc", limit: 100 });
    const commentRows = await window.TaranApi.select(window.TaranConfig.tables.communityComments, { status: "eq.published", select: "post_id", limit: 1000 });
    const counts = commentRows.reduce((result, row) => {
      result[row.post_id] = (result[row.post_id] || 0) + 1;
      return result;
    }, {});
    posts = postRows.map(row => ({ ...row, comment_count: counts[row.id] || 0 }));
  }

  function loadPreview() {
    posts = (window.taran_COMMUNITY_POSTS || []).map(post => ({
      ...post,
      author_name: post.author,
      comment_count: Array.isArray(post.comments) ? post.comments.length : 0
    }));
  }

  async function submit(event) {
    event.preventDefault();
    if (message) message.textContent = "";
    const account = await window.TaranAuth.ready;
    if (!account) {
      window.location.href = window.TaranAuth.loginUrl("community.html#write-preview");
      return;
    }
    if (!window.TaranConfig?.isSupabaseConfigured) {
      if (message) message.textContent = "온라인 사이트에서 로그인 후 글을 등록할 수 있습니다.";
      return;
    }
    const values = new FormData(form);
    const title = String(values.get("title") || "").trim();
    const content = String(values.get("content") || "").trim();
    if (title.length < 2 || content.length < 5) {
      if (message) message.textContent = "제목과 본문을 조금 더 자세히 입력해 주세요.";
      return;
    }
    const button = form.querySelector("[type='submit']");
    button.disabled = true;
    button.textContent = "등록하는 중…";
    try {
      await window.TaranApi.upsert(window.TaranConfig.tables.communityPosts, {
        user_id: account.id,
        category: String(values.get("category") || "준비 질문"),
        title,
        content,
        author_name: account.display_name || "따란 회원",
        status: "pending"
      });
      form.reset();
      if (message) message.textContent = "글이 접수되었습니다. 개인정보와 광고성 내용을 확인한 뒤 공개합니다.";
    } catch (error) {
      if (message) message.textContent = error.message || "글을 등록하지 못했습니다.";
    } finally {
      button.disabled = false;
      button.textContent = "글 등록하기";
    }
  }

  async function init() {
    if (window.TaranConfig?.isSupabaseConfigured) await loadOnline();
    else loadPreview();
    render();
    form?.addEventListener("submit", submit);
  }

  init().catch(error => {
    console.error("커뮤니티 목록을 불러오지 못했습니다.", error);
    posts = [];
    render();
  });
})();
