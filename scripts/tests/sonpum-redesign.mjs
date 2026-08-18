import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(read("scripts/core/brand.js"), sandbox);
const brand = sandbox.window.PlatformBrand;
assert(brand.nameKo === "손품해방", "한글 브랜드명이 손품해방이 아닙니다.");
assert(brand.nameEn === "SONPUM HAEBANG", "영문 브랜드명이 SONPUM HAEBANG이 아닙니다.");
assert(brand.slug === "sonpum-haebang" && brand.storagePrefix === "sonpum-haebang-", "브랜드 식별자 또는 저장 접두사가 잘못되었습니다.");

const eventSandbox = { window: {}, console };
vm.createContext(eventSandbox);
vm.runInContext(read("scripts/core/event-types.js"), eventSandbox);
const events = eventSandbox.window.SonpumEventTypes.items;
assert(events.length === 5, "공개 행사 분류가 5개가 아닙니다.");
assert(events.some(({ id }) => id === "meeting") && events.some(({ id }) => id === "other"), "결혼 준비 또는 기타 가족행사 통합 분류가 없습니다.");
assert(eventSandbox.window.SonpumEventTypes.normalize("smallWedding") === "meeting", "스몰웨딩이 결혼 준비로 통합되지 않았습니다.");
assert(eventSandbox.window.SonpumEventTypes.normalize("memorial") === "other", "추모 가족행사가 기타 가족행사로 통합되지 않았습니다.");

const storage = read("scripts/core/storage.js");
assert(storage.includes("sonpum-haebang-storage-migration-v1"), "스토리지 1회 마이그레이션 표식이 없습니다.");
assert(/taran|memoa|nopoom/i.test(storage), "이전 저장 키 이관 대상이 없습니다.");

const home = read("index.html");
["home-search", "verification", "recommended-providers", "how-it-works", "guides", "provider-join"].forEach(id => {
  assert(home.includes(`id="${id}"`), `홈 필수 영역 #${id}가 없습니다.`);
});
assert((home.includes('value="서울특별시"') || home.includes('selected>서울특별시')) && home.includes('value="kids" selected'), "홈 기본 검색값이 서울·돌잔치가 아닙니다.");

const venuesHtml = read("venues.html");
const venuesJs = read("scripts/pages/venues.js");
assert(!/후기순|평점순|rating-desc|review-desc/.test(venuesHtml + venuesJs), "후기·평점 정렬이 공개 목록에 남아 있습니다.");
assert(venuesJs.includes("customerProviderProfiles") && venuesJs.includes('displayGate === "customer_ready"'), "고객 공개 profile gate가 없습니다.");
assert(venuesJs.includes("createEmptyState") && venuesJs.includes("categoryTabs"), "업체 빈 결과 또는 분야 탭 처리가 없습니다.");
assert(venuesHtml.includes('data-category-tab="all"') && venuesHtml.includes('data-category-tab="돌잔치 장소·식사"') && venuesHtml.includes('data-category-tab="돌사진·스튜디오"'), "현행 업체 분야 탭이 없습니다.");

const inquiry = read("inquiry.html");
const partner = read("partner.html");
events.forEach(({ id }) => {
  assert(inquiry.includes(`value="${id}"`), `견적 문의에 ${id} 행사가 없습니다.`);
  assert(partner.includes(`value="${id}"`), `파트너 편집에 ${id} 행사가 없습니다.`);
});

const checklist = read("scripts/pages/checklist.js");
assert(checklist.includes("customTasks") && checklist.includes("mergeEventStates") && checklist.includes("updatedAt"), "체크리스트 병합·사용자 항목 구조가 없습니다.");
assert(read("scripts/core/checklist-templates.js").includes("memorial"), "추모 행사 체크리스트가 없습니다.");

assert(exists("provider-join.html"), "업체 입점 안내 페이지가 없습니다.");
assert(!/noindex/i.test(read("provider-join.html")), "입점 안내 랜딩이 검색 차단 상태입니다.");
assert(/noindex/i.test(read("provider-register.html")), "업체 등록 폼이 검색 노출 상태입니다.");
assert(read("scripts/pages/provider.js").includes("externalReviews"), "상세페이지 외부 후기 연결이 없습니다.");

const placeholders = fs.readdirSync(path.join(root, "assets/images/placeholders")).filter(file => file.endsWith(".webp"));
assert(placeholders.length >= 12, "업체 유형별 대체 이미지가 12개보다 적습니다.");

const migration = read("migrations/005_sonpum_brand_and_event_types.sql");
assert(migration.includes("event_profiles") && migration.includes("taran_event_taxonomy_reviews"), "005 행사 분류 마이그레이션이 불완전합니다.");
assert(!/select\s+id\s+from/i.test(migration), "005 마이그레이션에 모호한 id 참조 가능성이 있습니다.");

const publicPages = ["index.html", "venues.html", "provider.html", "calculator.html", "checklist.html", "inquiry.html", "partner.html", "provider-join.html"];
publicPages.forEach(file => {
  const content = read(file);
  assert(!/메모아|노품|T'ARAN|\b따란\b/i.test(content), `${file}에 이전 브랜드명이 남아 있습니다.`);
});

console.log(`손품해방 개편 검사 통과: 행사 ${events.length}개, 대체 이미지 12개, 핵심 화면 ${publicPages.length}개`);
