import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outputRoot = join(projectRoot, "dist");
const siteUrl = String(
  process.env.SITE_URL
  || process.env.URL
  || "https://taran-family-event-test.netlify.app"
).replace(/\/+$/, "");

const localImages = [
  "assets/images/venue-hotel.webp",
  "assets/images/venue-hanjeongsik.webp",
  "assets/images/venue-partyroom.webp",
  "assets/images/venue-garden.webp",
  "assets/images/editorial-checklist.webp",
  "assets/images/editorial-parking.webp"
];

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(value) {
  const match = String(value || "").match(/^(\d{4})[.-](\d{2})[.-](\d{2})$/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : String(value || "");
}

function renderListBox(title, items, className = "") {
  const values = (items || []).filter(Boolean);
  if (!values.length) return "";
  return `
    <aside class="article-guide-box ${className}">
      <strong>${escapeHtml(title)}</strong>
      <ul>${values.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </aside>`;
}

function renderSources(post) {
  const sources = (post.sources || []).filter((source) => source?.name && source?.url);
  if (!sources.length) return "";
  return `
    <aside class="article-guide-box article-sources" aria-label="이 글의 참고 자료">
      <strong>참고 자료와 검토 범위</strong>
      <p>검토일 ${escapeHtml(formatDate(post.reviewedAt))} · ${escapeHtml(post.reviewScope || "")}</p>
      <ul>
        ${sources.map((source) => `
          <li>
            <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.name)}</a>
            ${source.note ? `<small>${escapeHtml(source.note)}</small>` : ""}
          </li>`).join("")}
      </ul>
    </aside>`;
}

function commonHeader() {
  return `
  <header class="site-header" data-site-header>
    <div class="site-header__inner">
      <a class="brand" href="../index.html" aria-label="손품해방 홈"><span class="brand__name"><span>손품해방</span><small>SONPUM HAEBANG</small></span></a>
      <button class="site-header__toggle" type="button" aria-controls="site-navigation" aria-expanded="false" data-menu-toggle><span class="visually-hidden">메뉴 열기</span>☰</button>
      <nav class="site-nav" id="site-navigation" aria-label="주요 메뉴">
        <a href="../venues.html">업체 찾기</a><a href="../calculator.html">비용 계산기</a><a href="../checklist.html">준비 체크리스트</a><a href="../articles.html" aria-current="page">준비백과</a><a href="../provider-register.html">업체 등록</a><a class="site-nav__auth" href="../login.html">로그인</a>
      </nav>
    </div>
  </header>`;
}

function commonFooter() {
  return `
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div><strong>손품해방</strong><small>SONPUM HAEBANG · 가족행사 찾기와 준비 도구</small></div>
      <nav aria-label="하단 메뉴"><a href="../articles.html">준비백과</a><a href="../community.html">정보 나눔</a><a href="../about.html">서비스 소개</a><a href="../privacy.html">개인정보처리방침</a><a href="../terms.html">이용약관</a><a href="../contact.html">문의</a></nav>
    </div>
  </footer>`;
}

function renderArticle(post, image) {
  const canonical = `${siteUrl}/articles/${encodeURIComponent(post.slug)}.html`;
  const ogImage = `${siteUrl}/${image}`;
  const articleBody = (post.sections || []).map((section) => `
    <h2>${escapeHtml(section.heading)}</h2>
    ${(section.body || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
  `).join("");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(post.excerpt)}">
  <meta name="theme-color" content="#153c36">
  <title>${escapeHtml(post.title)} | 손품해방</title>
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:site_name" content="손품해방">
  <meta property="og:title" content="${escapeHtml(post.title)}">
  <meta property="og:description" content="${escapeHtml(post.excerpt)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="../styles/tokens.css">
  <link rel="stylesheet" href="../styles/reset.css">
  <link rel="stylesheet" href="../styles/base.css">
  <link rel="stylesheet" href="../styles/layout.css">
  <link rel="stylesheet" href="../styles/components/header.css">
  <link rel="stylesheet" href="../styles/components/button.css">
  <link rel="stylesheet" href="../styles/components/form.css">
  <link rel="stylesheet" href="../styles/components/card.css">
  <link rel="stylesheet" href="../styles/components/badge.css">
  <link rel="stylesheet" href="../styles/pages/member.css">
  <link rel="stylesheet" href="../styles/components/footer.css">
</head>
<body>
${commonHeader()}
  <main class="blog-article-page">
    <article class="blog-article">
      <a class="text-link" href="../articles.html">← 준비백과 목록</a>
      <header class="blog-article-header">
        <p class="eyebrow">${escapeHtml(post.category)} · 손품해방 준비백과</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p>${escapeHtml(post.excerpt)}</p>
        <div class="blog-card-meta"><span>게시일 ${escapeHtml(formatDate(post.date))}</span><span>검토일 ${escapeHtml(formatDate(post.reviewedAt))}</span><span>읽는 시간 ${escapeHtml(post.readTime)}</span></div>
      </header>
      <figure class="article-hero-photo">
        <img src="../${image}" alt="${escapeHtml(post.alt || "가족행사 준비 참고 이미지")}">
        <figcaption>${escapeHtml(post.alt || "가족행사 준비 참고 이미지")}</figcaption>
      </figure>
      <section class="blog-article-content">
        ${renderListBox("먼저 기억할 핵심", post.summaryPoints, "is-summary")}
        ${articleBody}
        <div class="article-insight-grid">
          ${renderListBox("상담할 때 물어볼 질문", post.questions, "is-questions")}
          ${renderListBox("놓치기 쉬운 부분", post.pitfalls, "is-pitfalls")}
        </div>
        ${renderListBox("직접 확인할 체크리스트", post.checklist, "is-checklist")}
        ${renderListBox("다음에 할 일", post.nextActions, "is-actions")}
        ${renderSources(post)}
      </section>
      <aside class="article-conversion">
        <span>다음 준비로 이어가기</span>
        <strong>읽은 기준으로 내 행사 비용과 준비 순서를 확인해보세요.</strong>
        <div><a class="button button-primary" href="../calculator.html">비용 계산하기</a> <a class="button button-secondary" href="../checklist.html">체크리스트 만들기</a></div>
      </aside>
    </article>
  </main>
${commonFooter()}
  <script src="../scripts/components/header.js"></script>
</body>
</html>
`;
}

async function loadPublishedPosts() {
  const context = { window: {} };
  vm.runInNewContext(await readFile(join(projectRoot, "blog-data.js"), "utf8"), context);
  return (context.window.taran_BLOG_POSTS || [])
    .map((post, index) => ({ ...post, sourceIndex: index }))
    .filter((post) => post.status === "published");
}

async function generateStaticArticles() {
  const articleOutput = join(outputRoot, "articles");
  const posts = await loadPublishedPosts();
  await mkdir(articleOutput, { recursive: true });
  for (const post of posts) {
    const image = !post.image || /^https?:\/\//i.test(post.image)
      ? localImages[post.sourceIndex % localImages.length]
      : post.image.replace(/^\/+/, "");
    await writeFile(join(articleOutput, `${post.slug}.html`), renderArticle(post, image), "utf8");
  }
  return posts;
}

function pageImage(fileName) {
  if (fileName === "calculator.html") return "assets/images/editorial-checklist.webp";
  if (fileName === "checklist.html") return "assets/images/venue-garden.webp";
  if (fileName === "articles.html") return "assets/images/venue-hanjeongsik.webp";
  if (fileName === "provider-register.html") return "assets/images/venue-partyroom.webp";
  if (fileName === "venues.html") return "assets/images/venue-hotel.webp";
  return "assets/images/venue-garden.webp";
}

async function injectSeoMetadata() {
  const entries = await readdir(outputRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
    const file = join(outputRoot, entry.name);
    let source = await readFile(file, "utf8");
    if (source.includes('rel="canonical"')) continue;

    const title = source.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "손품해방";
    const description = source.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1]
      || "가족행사 업체 찾기와 준비 도구를 제공하는 손품해방입니다.";
    const pagePath = entry.name === "index.html" ? "/" : `/${entry.name}`;
    const canonical = `${siteUrl}${pagePath}`;
    const ogImage = `${siteUrl}/${pageImage(entry.name)}`;
    const metadata = `
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:site_name" content="손품해방">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">`;
    source = source.replace(/<\/head>/i, `${metadata}\n</head>`);
    await writeFile(file, source, "utf8");
  }
}

async function updateSitemap(posts) {
  const urls = [
    "/",
    "/venues.html",
    "/calculator.html",
    "/checklist.html",
    "/articles.html",
    "/community.html",
    "/about.html",
    "/contact.html",
    "/provider-register.html",
    "/privacy.html",
    "/terms.html",
    ...posts.map((post) => `/articles/${post.slug}.html`)
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${siteUrl}${url}</loc></url>`).join("\n")}
</urlset>
`;
  await writeFile(join(outputRoot, "sitemap.xml"), xml, "utf8");
}

const publishedPosts = await generateStaticArticles();
await injectSeoMetadata();
await updateSitemap(publishedPosts);

console.log(`Static article pages and SEO metadata created: ${publishedPosts.length} articles (${siteUrl}).`);
