(function () {
  "use strict";

  const root = document.querySelector("[data-community-post]");
  const relatedRoot = document.querySelector("[data-community-related]");
  const id = new URLSearchParams(window.location.search).get("id");
  let post = null;
  let comments = [];
  let related = [];

  function node(tag, value, className) {
    const element = document.createElement(tag);
    if (value !== undefined && value !== null) element.textContent = String(value);
    if (className) element.className = className;
    return element;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || "");
    return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function initials(value) {
    return String(value || "따").trim().slice(0, 1);
  }

  function appendParagraphs(parent, content) {
    const paragraphs = Array.isArray(content) ? content : String(content || "").split(/\n{2,}/);
    paragraphs.filter(Boolean).forEach(value => parent.append(node("p", value)));
  }

  function commentArticle(comment) {
    const article = node("article", null, "board-comment");
    const avatar = node("div", initials(comment.author_name || comment.author), "comment-avatar");
    avatar.setAttribute("aria-hidden", "true");
    const main = node("div", null, "comment-main");
    const name = node("strong", comment.author_name || comment.author || "따란 회원");
    name.append(node("span", ` ${formatDate(comment.created_at)}`));
    main.append(name, node("p", comment.content || comment.text || ""));
    article.append(avatar, main);
    return article;
  }

  function renderRelated() {
    if (!relatedRoot) return;
    relatedRoot.replaceChildren();
    related.forEach(item => {
      const article = node("article", null, "thread-row");
      const link = node("a");
      link.href = `community-post.html?id=${encodeURIComponent(item.id)}`;
      link.append(node("b", `[${item.category || "이야기"}] `), document.createTextNode(item.title || "제목 없음"));
      const meta = node("p");
      meta.append(node("span", item.author_name || item.author || "따란 회원"), node("span", formatDate(item.created_at) || item.time || ""));
      article.append(link, meta);
      relatedRoot.append(article);
    });
  }

  async function submitComment(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = form.querySelector("[data-comment-message]");
    const textarea = form.elements.content;
    const content = textarea.value.trim();
    if (message) message.textContent = "";
    const account = await window.TaranAuth.ready;
    if (!account) {
      window.location.href = window.TaranAuth.loginUrl(`community-post.html?id=${encodeURIComponent(post.id)}#comments`);
      return;
    }
    if (!window.TaranConfig?.isSupabaseConfigured) {
      if (message) message.textContent = "온라인 사이트에서 로그인 후 댓글을 등록할 수 있습니다.";
      return;
    }
    if (!content) {
      if (message) message.textContent = "댓글 내용을 입력해 주세요.";
      return;
    }
    const button = form.querySelector("[type='submit']");
    button.disabled = true;
    button.textContent = "접수하는 중…";
    try {
      await window.TaranApi.upsert(window.TaranConfig.tables.communityComments, {
        post_id: post.id,
        user_id: account.id,
        author_name: account.display_name || "따란 회원",
        content,
        status: "pending"
      });
      textarea.value = "";
      if (message) message.textContent = "댓글이 접수되었습니다. 개인정보와 광고성 내용을 확인한 뒤 공개합니다.";
    } catch (error) {
      if (message) message.textContent = error.message || "댓글을 등록하지 못했습니다.";
    } finally {
      button.disabled = false;
      button.textContent = "댓글 등록";
    }
  }

  function render() {
    if (!root || !post) return;
    root.replaceChildren();
    document.title = `${post.title} | 따란 커뮤니티`;

    const card = node("article", null, "community-reader-card");
    const header = node("header", null, "reader-title-area");
    const boardLink = node("a", post.category || "커뮤니티", "reader-board-link");
    boardLink.href = "community.html";
    header.append(boardLink, node("h1", post.title), node("p", formatDate(post.created_at) || post.time || "", "reader-written-at"));

    const authorRow = node("section", null, "reader-author-row");
    const avatar = node("div", initials(post.author_name || post.author), "reader-avatar");
    avatar.setAttribute("aria-hidden", "true");
    const authorInfo = node("div", null, "reader-author-info");
    authorInfo.append(node("strong", post.author_name || post.author || "따란 회원"), node("p", `댓글 ${comments.length}`));
    authorRow.append(avatar, authorInfo);

    const body = node("section", null, "reader-body");
    appendParagraphs(body, post.content || post.body);
    card.append(header, authorRow, body);

    const panel = node("section", null, "community-comment-panel board-comment-panel");
    panel.id = "comments";
    const panelHead = node("div", null, "board-comment-head");
    panelHead.append(node("strong", `댓글 ${comments.length}개`));
    const list = node("div", null, "community-comment-list board-comment-list");
    comments.forEach(comment => list.append(commentArticle(comment)));
    if (!comments.length) list.append(node("p", "첫 댓글을 남겨보세요.", "empty-state"));

    const form = node("form", null, "community-mock-form light-form board-reply-form");
    const label = node("label", "댓글 입력");
    const textarea = document.createElement("textarea");
    textarea.name = "content";
    textarea.maxLength = 1000;
    textarea.required = true;
    textarea.placeholder = "개인정보를 제외하고 경험과 의견을 남겨주세요.";
    label.append(textarea);
    const formMessage = node("p", "", "field-error");
    formMessage.dataset.commentMessage = "";
    const button = node("button", "댓글 등록", "button button-primary");
    button.type = "submit";
    form.append(label, formMessage, button);
    form.addEventListener("submit", submitComment);
    panel.append(panelHead, list, form);
    root.append(card, panel);
    renderRelated();
  }

  function previewPost() {
    const posts = window.taran_COMMUNITY_POSTS || [];
    post = posts.find(item => item.id === id) || posts[0];
    comments = (post?.comments || []).map(([author, content]) => ({ author_name: author, content, created_at: "" }));
    related = posts.filter(item => item.id !== post?.id).slice(0, 5);
  }

  async function onlinePost() {
    if (!id) return;
    const rows = await window.TaranApi.select(window.TaranConfig.tables.communityPosts, { id: `eq.${id}`, status: "eq.published", limit: 1 });
    post = rows[0] || null;
    if (!post) return;
    comments = await window.TaranApi.select(window.TaranConfig.tables.communityComments, { post_id: `eq.${post.id}`, status: "eq.published", order: "created_at.asc", limit: 500 });
    related = await window.TaranApi.select(window.TaranConfig.tables.communityPosts, { status: "eq.published", id: `neq.${post.id}`, order: "created_at.desc", limit: 5 });
  }

  async function init() {
    if (window.TaranConfig?.isSupabaseConfigured) await onlinePost();
    else previewPost();
    if (!post) {
      root?.replaceChildren(node("div", "게시글을 찾을 수 없습니다.", "empty-state"));
      return;
    }
    render();
  }

  init().catch(error => {
    console.error("커뮤니티 글을 불러오지 못했습니다.", error);
    root?.replaceChildren(node("div", "게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", "error-state"));
  });
})();
