import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ignoredDirectories = new Set([
  ".git",
  ".netlify",
  "backend",
  "dist",
  "node_modules",
  "_tools",
  "_verify"
]);
const failures = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (ignoredDirectories.has(entry.name)) return [];
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function relative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function fail(message) {
  failures.push(message);
}

const files = walk(root);
const scripts = files.filter(file => /\.(?:js|mjs)$/i.test(file));
const htmlFiles = files.filter(file => /\.html$/i.test(file));
const cssFiles = files.filter(file => /\.css$/i.test(file));

for (const file of scripts) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) fail(`JavaScript 문법 오류: ${relative(file)}\n${result.stderr.trim()}`);
}

for (const file of htmlFiles) {
  const source = fs.readFileSync(file, "utf8");
  const ids = [...source.matchAll(/\bid=["']([^"']+)["']/gi)].map(match => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) fail(`중복 id: ${relative(file)} → ${[...new Set(duplicateIds)].join(", ")}`);

  const scriptSources = [...source.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map(match => match[1].split(/[?#]/)[0]);
  const duplicateScripts = scriptSources.filter((src, index) => scriptSources.indexOf(src) !== index);
  if (duplicateScripts.length) {
    fail(`중복 스크립트: ${relative(file)} → ${[...new Set(duplicateScripts)].join(", ")}`);
  }

  for (const match of source.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const reference = match[1];
    if (!reference || /^(?:https?:|mailto:|tel:|javascript:|data:|#|\/\/)/i.test(reference)) continue;
    const cleanReference = reference.split(/[?#]/)[0];
    let decoded;
    try {
      decoded = decodeURIComponent(cleanReference);
    } catch {
      decoded = cleanReference;
    }
    const target = decoded.startsWith("/")
      ? path.join(root, decoded.replace(/^\/+/, ""))
      : path.resolve(path.dirname(file), decoded);
    if (!fs.existsSync(target)) fail(`존재하지 않는 파일 참조: ${relative(file)} → ${reference}`);
  }

  if (/upgrade\.css|styles\.css/i.test(source)) {
    fail(`삭제된 레거시 CSS 참조: ${relative(file)}`);
  }
}

const cssSource = cssFiles.map(file => fs.readFileSync(file, "utf8")).join("\n");
const cssVariables = new Set(
  [...cssSource.matchAll(/--([\w-]+)\s*:/g)].map(match => match[1])
);
const missingCssVariables = [
  ...new Set(
    [...cssSource.matchAll(/var\(--([\w-]+)/g)]
      .map(match => match[1])
      .filter(name => !cssVariables.has(name))
  )
].sort();
if (missingCssVariables.length) {
  fail(`정의되지 않은 CSS 변수: ${missingCssVariables.join(", ")}`);
}

const adminSchema = fs.readFileSync(path.join(root, "admin-schema.sql"), "utf8");
const providerPolicy = adminSchema.match(
  /create policy "admins can manage providers"[\s\S]*?with check \(([\s\S]*?)\);/i
)?.[0] || "";
if (!providerPolicy || /'provider'/.test(providerPolicy)) {
  fail("업체 전체 관리 정책에 provider 역할이 포함되어 있거나 정책을 찾지 못했습니다.");
}

const claimPolicy = adminSchema.match(
  /create policy "admins can manage provider claims"[\s\S]*?with check \(([\s\S]*?)\);/i
)?.[0] || "";
if (!claimPolicy || /'provider'/.test(claimPolicy)) {
  fail("업체 권한 요청 관리 정책에 provider 역할이 포함되어 있거나 정책을 찾지 못했습니다.");
}

if (!/create policy "users can create community posts"[\s\S]*?status = 'pending'/i.test(adminSchema)) {
  fail("커뮤니티 글 등록이 pending 상태로 제한되지 않았습니다.");
}
if (!/create policy "users can create community comments"[\s\S]*?status = 'pending'/i.test(adminSchema)) {
  fail("커뮤니티 댓글 등록이 pending 상태로 제한되지 않았습니다.");
}
if (/create policy "users can update own community (?:posts|comments)"/i.test(adminSchema)) {
  fail("커뮤니티 상태를 우회할 수 있는 직접 수정 정책이 남아 있습니다.");
}

const venuesScript = fs.readFileSync(path.join(root, "scripts/pages/venues.js"), "utf8");
if (!/provider\.html\?id=/.test(venuesScript)) {
  fail("업체 목록에서 상세페이지로 이동하는 경로를 찾지 못했습니다.");
}

for (const required of [
  "index.html",
  "venues.html",
  "provider.html",
  "login.html",
  "account.html",
  "privacy.html",
  "terms.html",
  "admin/index.html",
  "netlify.toml",
  "_headers",
  "_redirects"
]) {
  if (!fs.existsSync(path.join(root, required))) fail(`필수 운영 파일 누락: ${required}`);
}

if (failures.length) {
  console.error(`\n검사 실패 ${failures.length}건\n`);
  failures.forEach((message, index) => console.error(`${index + 1}. ${message}\n`));
  process.exit(1);
}

console.log(`검사 통과: JavaScript ${scripts.length}개, HTML ${htmlFiles.length}개, 보안 규칙 및 운영 파일`);
