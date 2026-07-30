import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dist = path.join(root, "dist");
const failures = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

if (!fs.existsSync(dist)) {
  console.error("dist 폴더가 없습니다. npm run build를 먼저 실행해 주세요.");
  process.exit(1);
}

for (const forbidden of [
  "admin-schema.sql",
  "migrations",
  "README.md",
  "REFACTOR_REPORT.md",
  ".github",
  "package.json"
]) {
  if (fs.existsSync(path.join(dist, forbidden))) {
    failures.push(`배포 묶음에 운영용이 아닌 파일이 포함됨: ${forbidden}`);
  }
}

const htmlFiles = walk(dist).filter(file => file.endsWith(".html"));
for (const file of htmlFiles) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const reference = match[1];
    if (!reference || /^(?:https?:|mailto:|tel:|javascript:|data:|#|\/\/)/i.test(reference)) continue;
    const cleanReference = reference.split(/[?#]/)[0];
    const decoded = decodeURIComponent(cleanReference);
    const target = decoded.startsWith("/")
      ? path.join(dist, decoded.replace(/^\/+/, ""))
      : path.resolve(path.dirname(file), decoded);
    if (!fs.existsSync(target)) {
      failures.push(`${path.relative(dist, file)}에서 배포 파일을 찾지 못함: ${reference}`);
    }
  }
}

const seoPages = [
  "index.html",
  "venues.html",
  "calculator.html",
  "checklist.html",
  "articles.html",
  "community.html",
  "about.html",
  "provider-register.html",
  "privacy.html",
  "terms.html"
];
for (const page of seoPages) {
  const source = fs.readFileSync(path.join(dist, page), "utf8");
  for (const marker of ['rel="canonical"', 'property="og:title"', 'property="og:image"']) {
    if (!source.includes(marker)) failures.push(`${page} SEO metadata missing: ${marker}`);
  }
}

const staticArticleSlugs = [
  "contract-questions",
  "budget-hidden-costs",
  "invitation-rsvp",
  "growth-video",
  "review-writing",
  "catering-check"
];
for (const slug of staticArticleSlugs) {
  const file = path.join(dist, "articles", `${slug}.html`);
  if (!fs.existsSync(file)) {
    failures.push(`Static article missing: articles/${slug}.html`);
    continue;
  }
  const source = fs.readFileSync(file, "utf8");
  if (!source.includes("손품해방 준비백과")) failures.push(`Static article brand missing: ${slug}`);
  if (!source.includes('property="og:title"') || !source.includes('rel="canonical"')) {
    failures.push(`Static article SEO metadata missing: ${slug}`);
  }
  if (/taran 준비백과/i.test(source)) failures.push(`Legacy article brand remains: ${slug}`);
  if (/검토일 \d{4}-\d{2}-\d{2}/.test(source)) failures.push(`Review date format mismatch: ${slug}`);
}

const config = fs.readFileSync(path.join(dist, "content-config.js"), "utf8");
if (!config.includes('"communityPosts": "taran_community_posts"')) {
  failures.push("배포 설정에서 Supabase 테이블 매핑이 누락되었습니다.");
}
if (/service[_-]?role/i.test(config)) {
  failures.push("배포 설정에 service role 관련 값이 포함되어 있습니다.");
}

if (failures.length) {
  console.error(`\n배포 검사 실패 ${failures.length}건\n`);
  failures.forEach((message, index) => console.error(`${index + 1}. ${message}`));
  process.exit(1);
}

console.log(`배포 검사 통과: HTML ${htmlFiles.length}개, 로컬 파일 참조 및 공개 제외 목록`);
