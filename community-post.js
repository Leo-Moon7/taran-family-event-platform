(function () {
  const posts = window.taran_COMMUNITY_POSTS || [];
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || posts[0]?.id;
  const post = posts.find((item) => item.id === id) || posts[0];
  const root = document.querySelector("[data-community-post]");
  const relatedRoot = document.querySelector("[data-community-related]");

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initials(name) {
    return escapeHtml(String(name || "노").trim().slice(0, 1));
  }

  function countFromText(meta, fallback) {
    const match = String(meta || "").match(/댓글\s*(\d+)/);
    return match ? Number(match[1]) : fallback;
  }

  function pseudoViews(key) {
    return 1200 + Array.from(String(key || "")).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3500;
  }

  if (!root || !post) return;

  const commentCount = countFromText(post.meta, post.comments.length);
  const views = pseudoViews(post.id);
  const recommend = Math.max(2, Math.round(commentCount / 2));

  document.title = `${post.title} | 따란 커뮤니티`;

  root.innerHTML = `
    <article class="community-reader-card">
      <header class="reader-title-area">
        <a class="reader-board-link" href="community.html">${escapeHtml(post.category)}</a>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="reader-written-at">2026-07-07 · ${escapeHtml(post.time)}</p>
      </header>

      <section class="reader-author-row">
        <div class="reader-avatar" aria-hidden="true">${initials(post.author)}</div>
        <div class="reader-author-info">
          <strong>${escapeHtml(post.author)}</strong>
          <p>추천 ${recommend} · 조회 ${views.toLocaleString("ko-KR")} · 댓글 ${commentCount}</p>
        </div>
        <div class="reader-font-tools" aria-label="글자 크기 조절 미리보기">
          <button type="button" disabled>가−</button>
          <button type="button" disabled>가+</button>
        </div>
      </section>

      <section class="reader-body">
        ${post.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      </section>

    </article>

    <aside class="community-board-ad" aria-label="커뮤니티 글 중간 추천 영역">
      <div>
        <span>추천 정보</span>
        <strong>행사 전 체크하면 좋은 준비 항목</strong>
        <p>보증 인원, 주차, 답례품 수량처럼 글 주제와 관련 있는 준비 정보를 함께 확인해보세요.</p>
      </div>
      <a href="checklist.html">체크리스트 보기 →</a>
    </aside>

    <section class="community-comment-panel board-comment-panel">
      <div class="board-comment-head">
        <strong>댓글 ${commentCount}개</strong>
        <button class="button button-primary" type="button" disabled>댓글쓰기</button>
      </div>
      <div class="community-comment-list board-comment-list">
        ${post.comments.map(([author, text], index) => `
          <article class="board-comment ${index > 1 ? "is-reply" : ""}">
            <div class="comment-avatar" aria-hidden="true">${initials(author)}</div>
            <div class="comment-main">
              <strong>${escapeHtml(author)} <span>2026-07-07 · ${String(10 + index).padStart(2, "0")}:${String(12 + index * 7).padStart(2, "0")}</span></strong>
              <p>${escapeHtml(text)}</p>
            </div>
          </article>
        `).join("")}
      </div>
      <form class="community-mock-form light-form board-reply-form">
        <label>댓글 입력<textarea disabled>로그인 후 댓글을 남길 수 있습니다.</textarea></label>
        <button class="button button-primary" type="button" disabled>로그인 후 댓글 쓰기</button>
      </form>
    </section>
  `;

  if (relatedRoot) {
    relatedRoot.innerHTML = posts
      .filter((item) => item.id !== post.id)
      .slice(0, 5)
      .map((item) => `
        <article class="thread-row">
          <a href="community-post.html?id=${encodeURIComponent(item.id)}"><b>[${escapeHtml(item.category)}]</b> ${escapeHtml(item.title)}</a>
          <p><span>${escapeHtml(item.author)}</span><span>${escapeHtml(item.time)}</span><span>${escapeHtml(item.meta)}</span></p>
        </article>
      `).join("");
  }
})();
