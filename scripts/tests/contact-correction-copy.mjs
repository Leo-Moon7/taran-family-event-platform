import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const html = fs.readFileSync(path.join(root, "contact.html"), "utf8");
const source = fs.readFileSync(path.join(root, "scripts/pages/contact.js"), "utf8");
const failures = [];

for (const forbidden of ["정보 확인 전 후보", "NAVER 지역검색 API 관측", "관측 출처", "관측일:"]) {
  if ((html + source).includes(forbidden)) failures.push(`내부 문구 잔존: ${forbidden}`);
}

for (const required of ["업체 정보 수정 제안", "정보 업데이트", "정확한 정보:", "확인 가능한 공개 출처:"]) {
  if (!(html + source).includes(required)) failures.push(`고객형 문구 누락: ${required}`);
}

const elements = new Map();
for (const id of [
  "contact-type",
  "contact-provider-context",
  "contact-provider-id",
  "contact-provider-name",
  "contact-provider-source",
  "contact-page-url",
  "contact-message"
]) {
  elements.set(`#${id}`, {
    hidden: id === "contact-provider-context",
    value: "",
    textContent: "",
    options: id === "contact-type" ? [{ value: "information-error" }] : undefined
  });
}

const sandbox = {
  URL,
  URLSearchParams,
  window: {
    location: {
      href: "https://example.test/contact.html?type=information-error&providerId=NVR-DOL-005&providerName=%EC%84%9C%EB%9D%BC%EB%B2%8C%ED%95%9C%EC%A0%95%EC%8B%9D",
      search: "?type=information-error&providerId=NVR-DOL-005&providerName=%EC%84%9C%EB%9D%BC%EB%B2%8C%ED%95%9C%EC%A0%95%EC%8B%9D"
    }
  },
  document: { querySelector: (selector) => elements.get(selector) || null }
};
sandbox.window.URLSearchParams = URLSearchParams;
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

if (elements.get("#contact-provider-context").hidden) failures.push("수정 제안 문맥이 표시되지 않음");
if (elements.get("#contact-provider-id").value !== "NVR-DOL-005") failures.push("업체 ID prefill 실패");
if (elements.get("#contact-provider-name").value !== "서라벌한정식") failures.push("업체명 prefill 실패");
if (!elements.get("#contact-page-url").value.includes("provider.html?id=NVR-DOL-005")) failures.push("관련 페이지 prefill 실패");
if (!elements.get("#contact-message").value.includes("[업체 정보 수정 제안]")) failures.push("메시지 제목 prefill 실패");

if (failures.length) {
  console.error(`contact correction copy FAIL ${failures.length}`);
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log("contact correction copy PASS: customer copy, readonly context values, related page preserved");
