(function () {
  "use strict";
  const { element, readJson } = window.TaranAdmin;
  const providers = (window.publicDirectoryData || []).filter(item => item.publicationStatus !== "hidden");
  const inquiries = readJson("provider-contributions", []);
  const banners = readJson("admin-banners", []);
  const articles = window.TaranBlogPosts || window.taran_BLOG_POSTS || window.blogData || [];
  const metrics = document.querySelector("[data-admin-metrics]");
  const tasks = document.querySelector("[data-admin-tasks]");

  function metric(label, value) {
    const card = element("article", undefined, "admin-metric");
    card.append(element("span", label), element("strong", Number(value).toLocaleString("ko-KR")));
    return card;
  }
  [["견적 검토 대기", inquiries.length], ["공개 업체", providers.length], ["준비백과 글", articles.length], ["등록 배너", banners.length]]
    .forEach(([label, value]) => metrics?.append(metric(label, value)));
  [["견적 검토", inquiries.length, "inquiries.html"], ["업체 정보 관리", providers.length, "providers.html"], ["배너 점검", banners.length, "banners.html"]]
    .forEach(([label, value, href]) => {
      const link = element("a", undefined, "admin-task");
      link.href = href;
      link.append(element("span", label), element("strong", value));
      tasks?.append(link);
    });
})();
