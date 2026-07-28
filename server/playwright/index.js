import { chromium } from "playwright";
let browser;
export async function initializePlaywright() {
    browser = await chromium.launch({
        headless: true,
    });
    console.log("🎭 Playwright initialized");
}
export function getBrowser() {
    return browser;
}
//# sourceMappingURL=index.js.map