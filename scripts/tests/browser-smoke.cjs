const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://127.0.0.1:4188";
const viewports = [
  ["mobile", { width: 390, height: 844 }],
  ["tablet", { width: 768, height: 1024 }],
  ["desktop", { width: 1440, height: 1000 }]
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  });
  const failures = [];

  for (const [name, viewport] of viewports) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    page.on("console", message => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", error => consoleErrors.push(error.message));
    page.on("response", response => {
      if (response.status() >= 400) consoleErrors.push(`${response.status()} ${response.url()}`);
    });

    for (const path of ["/index.html", "/venues.html?event=kids&province=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C"]) {
      await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded", timeout: 90000 });
      await page.waitForTimeout(1500);
      const overflow = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth
      }));
      if (overflow.scroll > overflow.client + 2) {
        failures.push(`${name} ${path}: 가로 넘침 ${overflow.scroll - overflow.client}px`);
      }
      if (path.startsWith("/venues.html")) {
        const listAccessibility = await page.evaluate(() => ({
          chipButtons: [...document.querySelectorAll(".filter-chip button")].map(button => {
            const rect = button.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
          }),
          duplicateImageNotes: document.querySelectorAll(".directory-card__image-note").length
        }));
        if (listAccessibility.chipButtons.some(button => button.width < 44 || button.height < 44)) {
          failures.push(`${name} ${path}: 검색 조건 삭제 버튼의 터치 영역이 44px보다 작음`);
        }
        if (listAccessibility.duplicateImageNotes) {
          failures.push(`${name} ${path}: 대체 이미지 안내 문구가 중복 표시됨`);
        }
      }
    }

    const providerHref = await page.locator("a[href*='provider.html?id=']").first().getAttribute("href");
    if (!providerHref) {
      failures.push(`${name}: 업체 상세 링크를 찾지 못함`);
    } else {
      await page.goto(new URL(providerHref, `${baseUrl}/venues.html`).href, {
        waitUntil: "domcontentloaded",
        timeout: 90000
      });
      await page.waitForTimeout(1200);
      const providerStructure = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        h1Count: document.querySelectorAll("h1").length,
        imageNoteVisible: Boolean(document.querySelector("#provider-image-note:not([hidden])"))
      }));
      if (providerStructure.overflow > 2) failures.push(`${name} provider: 가로 넘침 ${providerStructure.overflow}px`);
      if (providerStructure.h1Count !== 1) failures.push(`${name} provider: h1 ${providerStructure.h1Count}개`);
      if (providerStructure.imageNoteVisible) failures.push(`${name} provider: 대체 이미지 안내 문구가 중복 표시됨`);
    }

    if (consoleErrors.length) {
      failures.push(`${name}: 콘솔 오류 ${[...new Set(consoleErrors)].join(" | ")}`);
    }
    await page.close();
  }

  await browser.close();
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log("브라우저 검사 통과: 모바일·태블릿·PC, 홈→업체 목록→상세 이동");
})();
