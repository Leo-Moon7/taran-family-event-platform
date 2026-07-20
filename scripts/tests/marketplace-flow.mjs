import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const failures = [];

function read(file) {
  const target = path.join(root, file);
  if (!fs.existsSync(target)) {
    failures.push(`필수 파일 누락: ${file}`);
    return "";
  }
  return fs.readFileSync(target, "utf8");
}

function expect(file, pattern, message) {
  if (!pattern.test(read(file))) failures.push(`${file}: ${message}`);
}

for (const file of [
  "compare.html",
  "inquiry.html",
  "provider-register.html",
  "scripts/core/compare-store.js",
  "scripts/core/inquiry-flow.js",
  "scripts/core/provider-status.js",
  "scripts/core/provider-profile.js",
  "migrations/003_marketplace_comparison_flow.sql",
  "migrations/004_provider_automation.sql"
]) read(file);

expect("scripts/core/compare-store.js", /(?:LIMIT|MAX_ITEMS)\s*=\s*3/, "비교함 최대 3곳 제한이 없습니다.");
expect("scripts/pages/compare.js", /TaranCompareStore[\s\S]*?\.read\(\)/, "비교함 저장 데이터를 읽는 연결이 없습니다.");
expect(
  "scripts/core/provider-status.js",
  /function isProviderPublic[\s\S]*?provider\.name[\s\S]*?getProviderIndustry/,
  "공개 최소 기준을 확인할 수 없습니다."
);

const publicRule = read("scripts/core/provider-status.js").match(/function isProviderPublic[\s\S]*?\n  }/)?.[0] || "";
if (/internalReview|externalReview|reviewCount/.test(publicRule)) {
  failures.push("업체 공개 기준에 후기 수 조건이 포함되어 있습니다.");
}

expect("scripts/pages/venues.js", /skeletonCards/, "업체 목록 로딩 스켈레톤이 없습니다.");
expect("scripts/pages/venues.js", /TaranPagination\.render/, "업체 목록 페이지네이션이 없습니다.");
expect("scripts/pages/venues.js", /filter-chips|createChip/, "선택 필터 칩이 없습니다.");
expect(
  "scripts/pages/provider.js",
  /TaranInquiryFlow|inquiry\.html\?providers=|provider-inquiry-link/,
  "상세페이지 문의 연결이 없습니다."
);
expect(
  "scripts/pages/provider.js",
  /provider-category"\)\.textContent\s*=\s*provider\.category/,
  "상세페이지 업체 유형에 행사명이 중복되지 않도록 분리한 처리가 없습니다."
);
expect("scripts/pages/compare.js", /inquiry\.html\?providers=/, "비교함 통합 문의 연결이 없습니다.");
expect("scripts/pages/compare.js", /canReceiveInquiry/, "문의 가능한 업체 선별 조건이 없습니다.");
expect("scripts/pages/compare.js", /isSupabaseConfigured/, "온라인 저장 연결 전 문의 버튼을 숨기는 조건이 없습니다.");
expect("scripts/pages/inquiry.js", /TaranInquiryFlow\.submit/, "통합 문의 저장 흐름이 없습니다.");

const migration = read("migrations/003_marketplace_comparison_flow.sql");
const automationMigration = read("migrations/004_provider_automation.sql");
const schema = `${read("admin-schema.sql")}\n${migration}\n${automationMigration}`;
for (const table of [
  "taran_inquiry_groups",
  "taran_inquiry_recipients",
  "taran_inquiry_responses",
  "taran_provider_registrations",
  "taran_user_comparisons",
  "taran_user_checklists"
]) {
  if (!new RegExp(`create table if not exists public\\.${table}`, "i").test(migration)) {
    failures.push(`003 마이그레이션 테이블 누락: ${table}`);
  }
  if (!new RegExp(`alter table public\\.${table} enable row level security`, "i").test(migration)) {
    failures.push(`003 마이그레이션 RLS 누락: ${table}`);
  }
}

for (const expected of [
  /interval '24 hours'/,
  /inquiry_reminder_12h/,
  /taran_mark_inquiry_viewed/,
  /taran_apply_marketplace_maintenance/,
  /taran_provider_completeness/,
  /taran_recalculate_provider_response_metrics/,
  /taran_notification_jobs/
]) {
  if (!expected.test(automationMigration)) {
    failures.push(`004 운영 자동화 규칙 누락: ${expected}`);
  }
}
expect("partner.html", /partner-profile-health/, "업체 관리 화면에 정보 완성도 영역이 없습니다.");
expect("scripts/pages/partner.js", /taran_mark_inquiry_viewed/, "업체 문의 열람 처리 연결이 없습니다.");
expect("scripts/pages/partner.js", /deadlineLabel/, "업체 문의 마감시간 표시가 없습니다.");
expect("scripts/pages/admin/inquiries.js", /24시간 미응답/, "관리자 예외 목록이 24시간 만료 기준을 사용하지 않습니다.");
expect("scripts/pages/admin/inquiries.js", /반복 미응답 업체/, "반복 미응답 업체 예외 처리가 없습니다.");
expect("scripts/pages/admin/dashboard.js", /평균 첫 응답 시간/, "관리자 대시보드에 평균 첫 응답 시간이 없습니다.");
expect("scripts/pages/admin/dashboard.js", /calculator_to_venues/, "계산기에서 업체 검색으로 이어진 전환 지표가 없습니다.");
expect("scripts/pages/admin/dashboard.js", /checklist_to_venues/, "체크리스트에서 업체 검색으로 이어진 전환 지표가 없습니다.");

const roleRules = [
  { label: "최고관리자", aliases: ["owner", "admin", "superadmin"] },
  { label: "운영관리자", aliases: ["operations", "operator"] },
  { label: "콘텐츠관리자", aliases: ["content"] },
  { label: "업체관리자", aliases: ["provider"] }
];
for (const role of roleRules) {
  if (!role.aliases.some(alias => schema.includes(`'${alias}'`))) {
    failures.push(`권한 기준 누락: ${role.label}`);
  }
}

for (const html of ["index.html", "venues.html", "provider.html", "compare.html", "inquiry.html"]) {
  const source = read(html);
  if (/href=["']community(?:-post)?\.html/i.test(source)) {
    failures.push(`${html}: 핵심 내비게이션에 커뮤니티 링크가 남아 있습니다.`);
  }
  if (/(?:포인트|리워드)\s*(?:적립|교환|받기)/.test(source)) {
    failures.push(`${html}: 초기 공개 화면에 리워드 안내가 남아 있습니다.`);
  }
}

if (failures.length) {
  console.error(`\n마켓플레이스 검사 실패 ${failures.length}건\n`);
  failures.forEach((message, index) => console.error(`${index + 1}. ${message}`));
  process.exit(1);
}

console.log("마켓플레이스 검사 통과: 비교 3곳, 통합 문의, 공개 기준, RLS, 핵심 화면");
