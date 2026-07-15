(function () {
  const posts = window.memoa_COMMUNITY_POSTS || [];
  const listRoot = document.querySelector(".community-thread-list");
  if (!listRoot || !posts.length) return;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function postRow(post, index) {
    return `
      <article class="thread-row ${index === 0 ? "hot" : ""}">
        <a href="community-post.html?id=${encodeURIComponent(post.id)}"><b>[${escapeHtml(post.category)}]</b> ${escapeHtml(post.title)}</a>
        <p><span>${escapeHtml(post.author)}</span><span>${escapeHtml(post.time)}</span>${escapeHtml(post.meta).split(" · ").map((item) => `<span>${item}</span>`).join("")}</p>
      </article>
    `;
  }

  const top = posts.slice(0, 5).map(postRow).join("");
  const bottom = posts.slice(5).map((post, index) => postRow(post, index + 5)).join("");
  const ad = `
    <aside class="community-feed-ad" aria-label="커뮤니티 중간 추천 정보">
      <span>추천 정보</span>
      <strong>행사 전에 함께 확인하면 좋은 준비 항목</strong>
      <p>답례품 수량, 초대장 문구, 당일 준비 가방처럼 자주 묻는 내용을 모아볼 수 있습니다.</p>
    </aside>
  `;

  listRoot.innerHTML = top + ad + bottom;
})();
