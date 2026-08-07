import { chromium } from "playwright";
import { state } from "@/core/state.js";
import { WindowsNative } from "@/native/windows.js";

export async function initializePlaywright() {
  const manager = state.browser;

  manager.browser = await chromium.launch({
    headless: false,
    args: ["--lang=en-US"],
  });

  manager.context = await manager.browser.newContext({
    baseURL: manager.baseURL,
    locale: "en-US",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  await manager.createPage("main");

  const pid = WindowsNative.findWindowByTitle("about:blank");

  // WindowsNative.setWindowVisible(pid, state.isHeadless);

  setInterval(() => {
    // WindowsNative.setWindowVisible(pid, state.isHeadless);
  }, 2000);
}
