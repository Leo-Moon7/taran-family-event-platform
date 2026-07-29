import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const headerScript = read("scripts/components/header.js");
const accountHtml = read("account.html");
const accountScript = read("account.js");
const compareHtml = read("compare.html");
const compareScript = read("scripts/pages/compare.js");
const compareStore = read("scripts/core/compare-store.js");
const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

function navigationItems(constantName) {
  const block = headerScript.match(new RegExp(`const ${constantName} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`))?.[1] || "";
  return [...block.matchAll(/\{\s*href:\s*"([^"]+)",\s*label:\s*"([^"]+)"/g)].map(([, href, label]) => ({ href, label }));
}

function navigationMarkup(html) {
  return html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0] || "";
}

const publicNavigation = navigationItems("PUBLIC_NAV_ITEMS");
expect(JSON.stringify(publicNavigation) === JSON.stringify([
  { href: "venues.html", label: "업체 찾기" },
  { href: "calculator.html", label: "비용 계산기" },
  { href: "checklist.html", label: "준비 체크리스트" },
  { href: "articles.html", label: "준비백과" },
  { href: "provider-register.html", label: "업체 등록" }
]), "공개 헤더 메뉴의 링크·이름·순서가 최종 명세와 다릅니다.");
expect(/navigation\.replaceChildren\(\.\.\.links, authLink\)/.test(headerScript), "기존 정적 헤더를 런타임에 정규화하지 않습니다.");
expect(!headerScript.includes('"compare.html"'), "공개 헤더 런타임에 비교함 링크가 남아 있습니다.");
expect(!headerScript.includes("dataCompareCount") && !headerScript.includes("data.compareCount"), "공개 헤더 런타임에 비교 수 배지가 남아 있습니다.");

const mobileNavigation = navigationItems("MOBILE_NAV_ITEMS");
expect(mobileNavigation.some((item) => item.href === "calculator.html" && item.label === "비용 계산기"), "모바일 메뉴에 비용 계산기가 없습니다.");
expect(mobileNavigation.some((item) => item.href === "checklist.html" && item.label === "준비 체크리스트"), "모바일 메뉴에 준비 체크리스트가 없습니다.");
expect(!mobileNavigation.some((item) => item.href === "compare.html"), "모바일 메뉴에 비교함이 남아 있습니다.");
expect(/dataset\.mobileAuthLink/.test(headerScript) && /account \? "내 정보" : "로그인"/.test(headerScript), "모바일 로그인/내 정보 상태 전환이 없습니다.");

for (const [name, html] of [["account.html", accountHtml], ["compare.html", compareHtml]]) {
  const nav = navigationMarkup(html);
  expect(!/href="compare\.html"/.test(nav), `${name} 정적 공개 헤더에 비교함이 남아 있습니다.`);
  expect(!/nav-menu|준비 도구/.test(nav), `${name} 정적 공개 헤더에 준비 도구 묶음이 남아 있습니다.`);
  expect(/calculator\.html">비용 계산기/.test(nav) && /checklist\.html">준비 체크리스트/.test(nav), `${name} 정적 공개 헤더에서 계산기와 체크리스트가 분리되지 않았습니다.`);
}

expect(/href="compare\.html" class="account-compare-link"/.test(accountHtml), "마이페이지에 비교함 링크가 없습니다.");
expect(/id="account-compare-count">0<\/b>\/3곳 선택/.test(accountHtml), "마이페이지에 비교함 선택 수와 최대 3곳 안내가 없습니다.");
expect(/TaranCompareStore\?\.subscribe\?\.\(\(ids\)/.test(accountScript), "마이페이지 비교함 선택 수가 저장소 변경을 구독하지 않습니다.");

expect(/id="compare-auth-gate" hidden/.test(compareHtml) && /id="compare-content" hidden/.test(compareHtml), "비교함이 인증 확인 전에 숨겨지지 않습니다.");
expect(/login\.html\?return=compare\.html/.test(compareHtml), "비교함 로그인 링크에 return 경로가 없습니다.");
expect(/const LIMIT = 3;/.test(compareStore), "기존 비교함 최대 3곳 계약이 바뀌었습니다.");
expect(/inquiry\.html\?providers=/.test(compareScript), "기존 선택 업체 견적 문의 링크가 제거되었습니다.");

function makeElement(hidden = false) {
  return {
    hidden,
    href: "",
    textContent: "",
    dataset: {},
    addEventListener() {},
    replaceChildren() {},
    append() {},
    querySelector() { return makeElement(); }
  };
}

async function runAccountCompareCountScenario() {
  const elements = new Map();
  const getElement = (selector) => {
    if (!elements.has(selector)) elements.set(selector, makeElement());
    return elements.get(selector);
  };
  const context = vm.createContext({
    JSON,
    Promise,
    document: {
      createElement: () => makeElement(),
      querySelector: getElement
    },
    window: {
      location: { href: "account.html" },
      publicDirectoryData: [],
      TaranStorage: { get: () => "[]" },
      TaranAuth: {
        ready: Promise.resolve({ id: "member-a", display_name: "테스트 회원", email: "member@example.invalid" }),
        isConfigured: () => false,
        api: async (path) => path === "/api/member/saved-venues" ? { venue_slugs: [] } : { ok: true }
      },
      TaranCompareStore: {
        subscribe(listener) { listener(["provider-a", "provider-b"]); }
      },
      confirm: () => false,
      alert() {}
    }
  });
  const completion = new vm.Script(accountScript, { filename: "account.js" }).runInContext(context);
  await completion;
  return elements;
}

async function runCompareAuthScenario({ protocol, configured, account }) {
  const ids = new Map();
  const initialHidden = new Set(["compare-auth-gate", "compare-content"]);
  const getElement = (id) => {
    if (!ids.has(id)) ids.set(id, makeElement(initialHidden.has(id)));
    return ids.get(id);
  };
  const redirects = [];
  let subscriptions = 0;
  const location = {
    protocol,
    replace(url) { redirects.push(url); }
  };
  const context = vm.createContext({
    Promise,
    URLSearchParams,
    location,
    document: { getElementById: getElement },
    window: {
      TaranAuth: {
        ready: Promise.resolve(account),
        isConfigured: () => configured,
        loginUrl: (returnPath) => `login.html?return=${encodeURIComponent(returnPath)}`
      },
      TaranCompareStore: {
        limit: 3,
        read: () => [],
        clear() {},
        remove() {},
        subscribe() { subscriptions += 1; }
      },
      TaranProviderStatus: {},
      SonpumProviderPlaceholder: {},
      confirm: () => false
    }
  });
  const completion = new vm.Script(compareScript, { filename: "scripts/pages/compare.js" }).runInContext(context);
  await completion;
  return { ids, redirects, subscriptions };
}

const accountElements = await runAccountCompareCountScenario();
expect(accountElements.get("#account-compare-count").textContent === "2", "마이페이지 비교함 선택 수가 저장소의 현재 값으로 갱신되지 않습니다.");
expect(accountElements.get("#account-name").textContent === "테스트 회원", "로그인 계정의 마이페이지 초기화가 비교 수 연결 뒤에도 유지되지 않습니다.");

const configuredGuest = await runCompareAuthScenario({ protocol: "https:", configured: true, account: null });
expect(configuredGuest.redirects.length === 1 && configuredGuest.redirects[0] === "login.html?return=compare.html", "로그인 전 비교함이 return 경로와 함께 로그인으로 이동하지 않습니다.");
expect(configuredGuest.subscriptions === 0, "로그인 전 비교 데이터 렌더링이 시작되었습니다.");

const localGuest = await runCompareAuthScenario({ protocol: "file:", configured: false, account: null });
expect(localGuest.redirects.length === 0, "Auth 미설정 file 로컬에서 리디렉션이 실행되었습니다.");
expect(localGuest.ids.get("compare-auth-gate").hidden === false && localGuest.ids.get("compare-content").hidden === true, "Auth 미설정 file 로컬에서 안전 안내 gate가 표시되지 않습니다.");
expect(localGuest.ids.get("compare-login-link").href === "login.html?return=compare.html", "file 로컬 안내의 로그인 링크가 return 경로를 보존하지 않습니다.");
expect(localGuest.subscriptions === 0, "Auth 미설정 file 로컬에서 비교 데이터 렌더링이 시작되었습니다.");

const signedIn = await runCompareAuthScenario({ protocol: "https:", configured: true, account: { id: "member-a" } });
expect(signedIn.redirects.length === 0, "로그인 계정이 비교함에서 다시 로그인으로 이동했습니다.");
expect(signedIn.ids.get("compare-auth-gate").hidden === true && signedIn.ids.get("compare-content").hidden === false, "로그인 계정에 비교함 본문이 표시되지 않습니다.");
expect(signedIn.subscriptions === 1, "로그인 계정의 비교함 저장소 구독이 시작되지 않았습니다.");

if (failures.length) {
  console.error(`\nFE-029 헤더·계정·비교함 검사 실패 ${failures.length}건\n`);
  failures.forEach((message, index) => console.error(`${index + 1}. ${message}`));
  process.exit(1);
}

console.log("FE-029 헤더·계정·비교함 검사 통과: 공개 메뉴 6개, 모바일 도구 분리, Auth 3상태, 비교 최대 3곳·견적 링크 유지");
