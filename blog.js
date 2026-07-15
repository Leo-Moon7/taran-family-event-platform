(function () {
  function bootBlog() {
  const posts = window.memoa_BLOG_POSTS || [];
  const localBlogImages = [
    "assets/images/venue-hotel.webp",
    "assets/images/venue-hanjeongsik.webp",
    "assets/images/venue-partyroom.webp",
    "assets/images/venue-garden.webp",
    "assets/images/editorial-checklist.webp",
    "assets/images/editorial-parking.webp"
  ];

  posts.forEach((post, index) => {
    if (!post.image || /^https?:\/\//.test(post.image)) {
      post.image = localBlogImages[index % localBlogImages.length];
      post.alt = post.alt || "돌잔치 준비 참고 이미지";
    }
  });

  const bySlug = new Map(posts.map((post) => [post.slug, post]));

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function postHref(post) {
    return `article.html?slug=${encodeURIComponent(post.slug)}`;
  }

  function renderTags(tags) {
    return (tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  }

  const importantTerms = [
    "보증 인원",
    "최소 보증 인원",
    "최종 인원",
    "수용 인원",
    "대관료",
    "식대",
    "무료 주차",
    "주차",
    "반입비",
    "외부 반입",
    "취소 기준",
    "취소·변경 기준",
    "환불 기준",
    "계약금",
    "포함 항목",
    "불포함 항목",
    "추가 비용",
    "날짜 변경",
    "행사일",
    "예상 인원",
    "예산",
    "견적서",
    "개인정보",
    "원본 제공",
    "보정 컷",
    "납품 일정",
    "세팅 시간",
    "철수 시간",
    "답례품",
    "최종 확인",
    "상담 기록"
  ].sort((a, b) => b.length - a.length);

  const importantPattern = new RegExp(`(${importantTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");

  function renderParagraph(paragraph) {
    const seen = new Set();
    const highlighted = escapeHtml(paragraph).replace(importantPattern, (match) => {
      if (seen.has(match)) return match;
      seen.add(match);
      return `<strong class="article-keyword">${match}</strong>`;
    });
    return `<p>${highlighted}</p>`;
  }

  function renderArticleListBox(title, items, className) {
    const list = (items || []).filter(Boolean);
    if (!list.length) return "";
    return `
      <aside class="article-guide-box ${className || ""}">
        <strong>${escapeHtml(title)}</strong>
        <ul>
          ${list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </aside>
    `;
  }

  function renderBlogHome() {
    const featuredRoot = document.querySelector("[data-featured-post]");
    const listRoot = document.querySelector("[data-blog-list]");
    const categoryRoot = document.querySelector("[data-blog-categories]");
    const countRoot = document.querySelector("[data-post-count]");
    const first = posts[0];

    if (countRoot) countRoot.textContent = `${posts.length}개`;

    if (featuredRoot && first) {
      featuredRoot.innerHTML = `
        <a href="${postHref(first)}">
          <figure class="blog-card-photo">
            <img src="${escapeHtml(first.image)}" alt="${escapeHtml(first.alt)}" loading="lazy">
          </figure>
          <div class="blog-feature-body">
            <span class="blog-category-label">${escapeHtml(first.category)}</span>
            <h3>${escapeHtml(first.title)}</h3>
            <p>${escapeHtml(first.excerpt)}</p>
            <div class="blog-card-meta"><span>${escapeHtml(first.date)}</span><span>읽는 시간 ${escapeHtml(first.readTime)}</span><span>초보 부모 추천</span></div>
            <strong>글 읽기 →</strong>
          </div>
        </a>
      `;
    }

    if (listRoot) {
      listRoot.innerHTML = posts.slice(1).map((post, index) => `
        <article class="${index === 6 ? "blog-inline-ad-card" : ""}">
          ${index === 6 ? `
            <div class="blog-list-ad">
              <span>중간 점검</span>
              <strong>글을 읽다가 바로 확인하면 좋은 준비 항목</strong>
              <p>장소 후보, 예산, 체크리스트처럼 다음 행동으로 이어지는 내용을 함께 정리합니다.</p>
            </div>
          ` : ""}
          <a href="${postHref(post)}">
            <figure class="blog-card-photo small">
              <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.alt)}" loading="lazy">
            </figure>
            <span>${escapeHtml(post.category)}</span>
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.excerpt)}</p>
            <div class="blog-card-meta compact"><span>${escapeHtml(post.date)}</span><span>${escapeHtml(post.readTime)}</span></div>
            <em>자세히 보기 →</em>
          </a>
        </article>
      `).join("");
    }

    if (categoryRoot) {
      const categories = [...new Set(posts.map((post) => post.category))];
      categoryRoot.innerHTML = categories.map((category) => {
        const count = posts.filter((post) => post.category === category).length;
        return `<a href="#latest">${escapeHtml(category)} <small>${count}</small></a>`;
      }).join("");
    }
  }

  function renderArticle() {
    const articleRoot = document.querySelector("[data-article-root]");
    if (!articleRoot) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug") || "contract-questions";
    const post = bySlug.get(slug) || posts[0];
    if (!post) return;

    document.title = `${post.title} | 메모아`;
    const description = document.querySelector("meta[name='description']");
    if (description) description.setAttribute("content", post.excerpt);

    articleRoot.innerHTML = `
      <a class="text-link" href="articles.html">← 준비백과 목록</a>
      <header class="blog-article-header">
        <p class="eyebrow">${escapeHtml(post.category)} · memoa 준비백과</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p>${escapeHtml(post.excerpt)}</p>
        <div class="blog-card-meta"><span>작성일 ${escapeHtml(post.date)}</span><span>읽는 시간 ${escapeHtml(post.readTime)}</span><span>${escapeHtml(post.category)}</span></div>
      </header>
      <figure class="article-hero-photo">
        <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.alt)}">
        <figcaption>${escapeHtml(post.alt)}</figcaption>
      </figure>
      <aside class="soft-monetization article-mid-ad" aria-label="본문 상단 추천 정보">
        <span>읽기 전 체크</span>
        <div>
          <strong>이 글에서 확인할 내용을 메모해두면 상담이 쉬워집니다.</strong>
          <p>같은 질문을 업체마다 반복해서 물어보면 가격과 조건 차이를 더 정확히 비교할 수 있습니다.</p>
        </div>
      </aside>
      <section class="blog-article-content">
        ${renderArticleListBox("먼저 기억할 핵심", post.summaryPoints, "is-summary")}
        ${post.sections.map((section) => `
          <h2>${escapeHtml(section.heading)}</h2>
          ${section.body.map((paragraph) => renderParagraph(paragraph)).join("")}
        `).join("")}
        <div class="article-insight-grid">
          ${renderArticleListBox("상담할 때 물어볼 질문", post.questions, "is-questions")}
          ${renderArticleListBox("놓치기 쉬운 부분", post.pitfalls, "is-pitfalls")}
        </div>
        <div class="article-check-box">
          <strong>이 글에서 바로 체크할 항목</strong>
          <ul>
            ${(post.checklist || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>
        ${renderArticleListBox("읽고 바로 이어서 할 일", post.nextActions, "is-actions")}
        <div class="blog-tag-row">${renderTags(post.tags)}</div>
      </section>
    `;

    const relatedRoot = document.querySelector("[data-related-posts]");
    if (relatedRoot) {
      const related = posts
        .filter((item) => item.slug !== post.slug && item.category === post.category)
        .concat(posts.filter((item) => item.slug !== post.slug && item.category !== post.category))
        .slice(0, 3);

      relatedRoot.innerHTML = related.map((item) => `
        <article>
          <a href="${postHref(item)}">
            <figure class="blog-card-photo small">
              <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt)}" loading="lazy">
            </figure>
            <span>${escapeHtml(item.category)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.excerpt)}</p>
          </a>
        </article>
      `).join("");
    }
  }

    renderBlogHome();
    renderArticle();
  }

  Promise.resolve(window.memoaContentReady).finally(bootBlog);
})();
