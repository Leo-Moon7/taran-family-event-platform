(function () {
  "use strict";
  const { element } = window.TaranAdmin;
  const table = document.querySelector("[data-admin-table]");
  const empty = document.querySelector("[data-admin-empty]");
  const posts = window.TaranBlogPosts || window.taran_BLOG_POSTS || window.blogData || window.articleData || [];
  posts.forEach(post => {
    const row = document.createElement("tr");
    [post.title || "제목 없음", post.category || post.topic || "준비백과", post.status || "공개", post.publishedAt || post.date || "-"]
      .forEach(value => row.append(element("td", value)));
    const manage = document.createElement("td");
    const link = element("a", "글 보기");
    link.href = `../article.html?slug=${encodeURIComponent(post.slug || "")}`;
    manage.append(link);
    row.append(manage);
    table?.append(row);
  });
  if (empty) empty.hidden = Boolean(posts.length);
})();
