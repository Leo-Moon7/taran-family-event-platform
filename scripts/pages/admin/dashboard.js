(function () {
  "use strict";
  const { element, readJson } = window.TaranAdmin;
  const metrics = document.querySelector("[data-admin-metrics]");
  const tasks = document.querySelector("[data-admin-tasks]");

  function metric(label, value) {
    const card = element("article", undefined, "admin-metric");
    card.append(element("span", label), element("strong", Number(value).toLocaleString("ko-KR")));
    return card;
  }

  async function init() {
    const access = await window.TaranAdminReady;
    if (!access.allowed) return;
    const offlineSection = document.querySelector("[data-offline-only]");
    if (offlineSection) offlineSection.hidden = access.mode !== "preview";
    let values;
    if (access.mode === "online") {
      const [inquiries, contributions, providers, articles, banners] = await Promise.all([
        window.TaranAdminData.list("inquiries", { status: "eq.pending", select: "id" }),
        window.TaranAdminData.list("contributions", { status: "eq.pending", select: "id" }),
        window.TaranAdminData.list("providers", { status: "eq.published", select: "id" }),
        window.TaranAdminData.list("articles", { status: "eq.published", select: "slug" }),
        window.TaranAdminData.list("banners", { status: "eq.published", select: "id" })
      ]);
      values = { inquiries: inquiries.length + contributions.length, providers: providers.length, articles: articles.length, banners: banners.length };
    } else {
      values = {
        inquiries: readJson("provider-contributions", []).length,
        providers: (window.publicDirectoryData || []).filter(item => item.publicationStatus !== "hidden").length,
        articles: (window.TaranBlogPosts || window.taran_BLOG_POSTS || window.blogData || []).length,
        banners: readJson("admin-banners", []).length
      };
    }
    [["견적 검토 대기", values.inquiries], ["공개 업체", values.providers], ["준비백과 글", values.articles], ["공개 배너", values.banners]]
      .forEach(([label, value]) => metrics?.append(metric(label, value)));
    [["견적 검토", values.inquiries, "inquiries.html"], ["업체 정보 관리", values.providers, "providers.html"], ["배너 점검", values.banners, "banners.html"]]
      .forEach(([label, value, href]) => {
        const link = element("a", undefined, "admin-task");
        link.href = href;
        link.append(element("span", label), element("strong", value));
        tasks?.append(link);
      });
  }
  init().catch(error => console.error("관리자 현황을 불러오지 못했습니다.", error));
})();
