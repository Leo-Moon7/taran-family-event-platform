import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("calculator.html");
const script = read("scripts/pages/calculator.js");
const styles = read("styles/pages/calculator.css");
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function initializer(name, kind) {
  const open = kind === "array" ? "\\[" : "\\{";
  const close = kind === "array" ? "\\]" : "\\}";
  const match = script.match(new RegExp(`const ${name} = (${open}[\\s\\S]*?\\n  ${close});`));
  if (!match) {
    failures.push(`${name} 설정을 읽을 수 없습니다.`);
    return kind === "array" ? [] : {};
  }
  return vm.runInNewContext(`(${match[1]})`);
}

const profiles = initializer("profiles", "object");
const eventDetailOptions = initializer("eventDetailOptions", "object");
const cuisineOptions = initializer("cuisineOptions", "array");
const mealBudgetOptions = initializer("mealBudgetOptions", "array");
const useModeOptions = initializer("useModeOptions", "object");
const spaceServiceRules = initializer("spaceServiceRules", "object");

expect((html.match(/class="calculator-step(?: [^"]+)?" data-step="[1-5]"/g) || []).length === 5, "기존 5단계 흐름이 유지되지 않았습니다.");
expect((html.match(/data-step="1"[\s\S]*?data-value="(?:kids|parents|meeting|anniversary|other)"/g) || []).length >= 1, "승인된 행사 선택 영역이 없습니다.");
for (const event of ["kids", "parents", "meeting", "anniversary", "other"]) {
  expect(Boolean(profiles[event]), `행사 프로필 누락: ${event}`);
  expect(Array.isArray(eventDetailOptions[event]) && eventDetailOptions[event].length >= 3, `세부 행사 유형 누락: ${event}`);
  expect(new Set(eventDetailOptions[event]?.map(({ value }) => value)).size === eventDetailOptions[event]?.length, `세부 행사 ID 중복: ${event}`);
}
expect(html.includes('id="calculator-event-details"') && html.includes('id="calculator-space-details"') && html.includes('id="calculator-service-recommendation"'), "행사·공간 조건부 질문 또는 추천 영역이 없습니다.");
expect(/eventDetail:\s*""/.test(script) && /function renderEventDetails\(\)/.test(script), "세부 행사 필수 상태 또는 렌더링이 없습니다.");
expect(/state\.step === 1 \? !\(state\.event && state\.eventDetail\)/.test(script), "세부 행사 선택이 1단계 필수 조건에 연결되지 않았습니다.");
expect(/spaceDetails:\s*emptySpaceDetails\(\)/.test(script), "state.spaceDetails 초기 상태가 없습니다.");

expect(/id="calculator-guests"[^>]*type="number"[^>]*min="1"[^>]*max="500"[^>]*step="1"/.test(html), "예상 인원 1~500 입력이 없습니다.");
expect((html.match(/<strong>(?:10|20|30|50|100)명<\/strong>/g) || []).length === 5, "인원 바로가기 표시가 올바르지 않습니다.");
expect(/아직 확정되지 않았다면 가장 가까운 (?:전체 참석 )?인원을 선택해 주세요\./.test(html), "예상 인원 안내가 대략적인 선택임을 설명하지 않습니다.");
expect(!/정확한 예상 인원|정확히 (?:10|20|30|50|100)명/.test(html), "사용자 화면에 확정 인원처럼 보이는 표현이 남아 있습니다.");
expect(!/10명 이하|11~30명|31~50명|51~80명|81명 이상/.test(html), "인원 구간 상한 버튼이 남아 있습니다.");
expect(/function exactGuestCount\(value\)[\s\S]*?Number\.isInteger\(count\)[\s\S]*?count >= 1 && count <= 500/.test(script), "예상 인원 숫자 경계 검증이 없습니다.");
expect(/state\.guests = exactGuestCount\(input\.value\)/.test(script) && /aria-invalid/.test(script) && /setCustomValidity/.test(script), "예상 인원 상태·ARIA 오류 연결이 없습니다.");
expect(/state\.guests = 0;/.test(script) && !/state\.guests = Number\(initial\.guests\)/.test(script), "검색 인원 구간값을 예상 인원으로 자동 사용하고 있습니다.");
expect(/id="calculator-meal-guests"[^>]*type="number"[^>]*min="1"[^>]*max="500"/.test(html), "식사 예상 인원 입력이 없습니다.");
expect(/mealGuests:\s*0/.test(script) && /function guestCountsComplete\(\)/.test(script), "전체 참석 인원과 식사 인원 상태가 분리되지 않았습니다.");
expect(/state\.step === 3 \? !guestCountsComplete\(\)/.test(script), "식사 인원 검증이 3단계 다음 버튼에 연결되지 않았습니다.");
expect(/mealRange\[0\] \* state\.mealGuests/.test(script) && /mealRange\[1\] \* state\.mealGuests/.test(script), "식비가 전체 참석 인원이 아닌 식사 인원에 연결되지 않았습니다.");

const cuisineValues = cuisineOptions.map(({ value }) => value);
for (const cuisine of ["korean", "fineDining", "chinese", "buffet", "general"]) expect(cuisineValues.includes(cuisine), `프라이빗 룸 음식 유형 누락: ${cuisine}`);
expect(mealBudgetOptions.length >= 4 && mealBudgetOptions.every(({ range }) => Array.isArray(range) && range.length === 2), "1인 식대 선택 범위가 불완전합니다.");
const expectedMealBudgets = {
  under50000: { title: "3.5만~5만 원", range: [35000, 50000] },
  "50000to80000": { title: "5만~8만 원", range: [50000, 80000] },
  "80000to120000": { title: "8만~12만 원", range: [80000, 120000] },
  over120000: { title: "12만~18만 원", range: [120000, 180000] }
};
for (const option of mealBudgetOptions) {
  const expected = expectedMealBudgets[option.value];
  expect(Boolean(expected), `예상하지 않은 1인 식대 ID: ${option.value}`);
  expect(option.title === expected?.title, `${option.value} 표시 범위가 실제 계산 범위와 다릅니다.`);
  expect(option.range[0] === expected?.range[0] && option.range[1] === expected?.range[1], `${option.value} 계산 범위 양 끝값이 바뀌었습니다.`);
  expect(option.note === "1인 계획 범위", `${option.value} 설명에 닫힌 계획 범위가 표시되지 않습니다.`);
}
expect(mealBudgetOptions.length === Object.keys(expectedMealBudgets).length, "1인 식대 표시·계산 매핑 개수가 다릅니다.");
for (const space of ["hotel", "partyroom", "home", "garden"]) {
  expect(Array.isArray(useModeOptions[space]) && useModeOptions[space].length >= 2, `${space} 이용 방식이 없습니다.`);
}
expect(/state\.space === "restaurant"[\s\S]*?state\.spaceDetails\.cuisine && state\.spaceDetails\.mealBudget/.test(script), "프라이빗 룸의 음식 유형·1인 식대 필수 검증이 없습니다.");
expect(/state\.spaceDetails\.useMode && state\.spaceDetails\.mealBudget/.test(script), "비프라이빗 공간의 이용 방식·1인 식비 필수 검증이 없습니다.");
expect(/detailGroup\("원하는 1인 식비 \(필수\)"[\s\S]*?"mealBudget", mealBudgetOptions\)/.test(script), "다섯 공간 공통 1인 식비 질문이 없습니다.");
expect(/document\.createElement\("fieldset"\)/.test(script) && /aria-describedby/.test(script), "공간별 이용 방식의 필수·접근성 상태가 없습니다.");

expect(/state\.spaceDetails = emptySpaceDetails\(\);[\s\S]*?state\.services = \[\];[\s\S]*?renderSpaceDetails\(\);/.test(script), "공간 변경 시 하위 상태 초기화가 없습니다.");
expect(/function renderDynamicOptions\(\)[\s\S]*?state\.space = "";[\s\S]*?state\.spaceDetails = emptySpaceDetails\(\);[\s\S]*?state\.services = \[\];/.test(script), "행사 변경 시 공간·세부·서비스 초기화가 없습니다.");
expect(/state\.event = eventValue;[\s\S]*?state\.eventDetail = "";[\s\S]*?renderEventDetails\(\);[\s\S]*?renderDynamicOptions\(\);/.test(script), "행사 대분류 변경 시 세부 행사·공간 상태 초기화가 없습니다.");
expect(/state\.eventDetail = item\.value;[\s\S]*?renderDynamicOptions\(\);/.test(script), "세부 행사 변경 시 공간·서비스 하위 상태 초기화가 없습니다.");
expect(/state\.step === 4 \? !spaceDetailsComplete\(\)/.test(script), "4단계 필수 세부 조건이 다음 버튼에 연결되지 않았습니다.");

expect(/const mealRange = mealBudget\.range/.test(script) && !/profile\.meal/.test(script), "모든 공간에서 선택한 1인 식비가 계산에 반영되지 않았습니다.");
expect(/useMode\?\.range\[0\]/.test(script) && /useMode\?\.range\[1\]/.test(script), "선택한 이용 방식이 계산에 반영되지 않았습니다.");
expect(/1인 \$\{mealBudget\.title\}/.test(script) && /\$\{useMode\.title\}/.test(script), "식비·이용 방식의 한국어 계산 내역이 없습니다.");
expect(/renderSelectionSummary\(eventDetail, cuisine, mealBudget, useMode, venueFee\)/.test(script), "결과 요약에 세부 행사·공간·식비가 연결되지 않았습니다.");
for (const label of ["세부 행사", "참석 / 식사", "공간", "1인 식비", "공간 이용료"]) expect(script.includes(`"${label}"`), `결과 한국어 요약 누락: ${label}`);
expect(/TaranStorage\.set\("calculator-state", JSON\.stringify\(\{ \.\.\.state, \.\.\.result \}\)\)/.test(script), "calculator-state 저장 계약 또는 spaceDetails 저장이 유지되지 않았습니다.");
expect(/venueFeeMin:\s*""/.test(script) && /venueFeeMax:\s*""/.test(script) && /function venueFeeRangeState\(\)/.test(script), "직접 입력 공간·룸 이용료 상태가 없습니다.");
expect(/venueFee\.range \|\| fallbackSpaceRange/.test(script), "직접 입력한 공간·룸 이용료가 임시 범위를 대체하지 않습니다.");
expect(html.includes('id="calculator-per-person"') && html.includes('id="calculator-guest-impact"') && html.includes('id="calculator-fixed-share"') && html.includes('id="calculator-cost-driver"'), "실사용 계획 분석 지표가 없습니다.");
expect(/function renderPlanningAnalysis\(/.test(script) && /contractChecksByEvent/.test(script) && /contractChecksBySpace/.test(script), "비용 영향 또는 계약 전 확인 로직이 없습니다.");

const searchContext = script.match(/const searchContext = \{([\s\S]*?)\n    \};/)?.[1] || "";
expect(/event: state\.event/.test(searchContext) && /source: "calculator"/.test(searchContext), "기존 TaranSearchContext 검색 계약이 없습니다.");
expect(!/eventDetail|spaceDetails|cuisine|mealBudget|useMode/.test(searchContext), "승인 없이 업체 검색 쿼리 계약이 확장되었습니다.");
expect(/const guestsFilter = guestFilterValue\(guests\)/.test(script), "예상 인원을 기존 검색 인원 필터로 변환하지 않습니다.");
expect(/TaranSearchContext\?\.toParams/.test(script) && /TaranSearchContext\?\.save/.test(script), "TaranSearchContext 쿼리·저장 연결이 유지되지 않았습니다.");

function servicesFor(event, space) {
  const rule = spaceServiceRules[space];
  const excluded = new Set(rule.remove);
  return [...new Set([...profiles[event].services, ...rule.add])].filter((key) => !excluded.has(key));
}
expect(!servicesFor("meeting", "restaurant").includes("privateRoom") && servicesFor("meeting", "restaurant").includes("cake"), "행사+프라이빗 룸 서비스 분기가 잘못되었습니다.");
expect(servicesFor("kids", "hotel").includes("audioHost") && servicesFor("kids", "garden").includes("transport"), "행사+공간별 추천 서비스가 달라지지 않습니다.");
expect(/eventServiceAdvice\[state\.event\][\s\S]*?spaceServiceRules\[state\.space\]\.recommendation/.test(script), "행사+공간별 추천 설명이 연결되지 않았습니다.");

expect(html.includes("확인된 시세·전국 표본·실제 견적이 아닙니다"), "준비 계획용 비시세 안내가 없습니다.");
expect(/\.calculator-option-state/.test(styles) && /button\.is-selected/.test(styles), "색 외 선택 텍스트·아이콘 스타일이 없습니다.");
expect(/@media \(max-width: 40rem\)[\s\S]*?calculator-detail-options[\s\S]*?grid-template-columns: 1fr/.test(styles), "390px 조건부 항목 단일 열 규칙이 없습니다.");
expect(/\.calculator-guests-input[\s\S]*?min-height: 3\.25rem/.test(styles) && /\.calculator-selection-summary/.test(styles), "예상 인원 입력 또는 결과 선택 요약 스타일이 없습니다.");
expect(/line-height: 1\.5/.test(styles) && /:focus-visible/.test(styles), "본문 줄간격 또는 키보드 초점 규칙이 없습니다.");
const coral = [...styles.matchAll(/--tool-coral:\s*(#[0-9a-f]{6})/gi)].at(-1)?.[1];
const coralHover = [...styles.matchAll(/--tool-coral-hover:\s*(#[0-9a-f]{6})/gi)].at(-1)?.[1];
const coralContrast = coral ? contrastRatio(coral, "#ffffff") : 0;
expect(coralContrast >= 4.5, `계산기 코랄/흰색 대비가 4.5:1 미만입니다: ${coralContrast.toFixed(2)}:1`);
expect(Boolean(coralHover) && relativeLuminance(coralHover) < relativeLuminance(coral), "hover/focus 코랄이 기본색보다 어둡고 구분되지 않습니다.");
expect(/button--primary:focus-visible[\s\S]*?var\(--tool-coral-hover\)/.test(styles), "주 행동 focus 상태에 더 어두운 코랄이 적용되지 않았습니다.");
expect(/\.calculator-page \.calculator-layout\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/.test(styles), "계산 결과가 입력 영역 아래 단일 열에 배치되지 않았습니다.");
expect(/\.calculator-page \.calculator-result\s*\{[\s\S]*?position:\s*static[\s\S]*?scroll-margin-top:/.test(styles), "하단 결과 영역의 고정 해제 또는 상단 여백이 없습니다.");
expect(/resultPanel\.scrollIntoView\(\{[\s\S]*?block:\s*"start"/.test(script), "결과 확인 후 결과 상단으로 이동하지 않습니다.");
expect(/resultPanel\.focus\(\{\s*preventScroll:\s*true\s*\}\)/.test(script), "결과 이동 후 키보드 초점 유지가 없습니다.");
expect((html.match(/calculator-step calculator-step--split/g) || []).length >= 3, "세부 선택 단계의 좌우 작업공간 구조가 없습니다.");
expect(/@media \(min-width: 70rem\)[\s\S]*?calculator-step--split:not\(\[hidden\]\)[\s\S]*?grid-template-columns:/.test(styles), "PC 우측 세부 패널 배치 규칙이 없습니다.");
expect(/calculator-step__aside[\s\S]*?position:\s*sticky/.test(styles), "PC 세부 선택 패널의 화면 내 유지 규칙이 없습니다.");
expect(/function showStep\(moveIntoView = false\)[\s\S]*?scrollIntoView\(\{[\s\S]*?behavior:\s*"auto"[\s\S]*?block:\s*"start"/.test(script), "단계 변경 후 현재 선택 화면 상단으로 이동하지 않습니다.");

if (failures.length) {
  console.error(`\nFE-034 계산기 계획 작업공간 검사 실패 ${failures.length}건\n`);
  failures.forEach((message, index) => console.error(`${index + 1}. ${message}`));
  process.exit(1);
}

console.log(`FE-034 계산기 계획 작업공간 검사 통과: 5개 행사 분류, 참석·식사 인원, 우측 세부 패널, 직접 공간비, 계획 분석, 코랄/흰색 ${coralContrast.toFixed(2)}:1`);
