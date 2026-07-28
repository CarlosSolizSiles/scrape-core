import { chromium } from "playwright";
import { createRequire } from "node:module";
import { state } from "@/core/state.js";

const require = createRequire(import.meta.url);
const addon = require("../windows_hwnd.node");

export async function initializePlaywright() {
  const manager = state.browser;

  manager.browser = await chromium.launch({
    headless: false,
  });

  manager.context = await manager.browser.newContext({
    baseURL: manager.baseURL,
  });

  manager.page = await manager.context.newPage();

  const pid = addon.findPidByPartialTitle("about:blank");

  addon.setWindowVisible(pid, state.isHeadless);

  await manager.page.route("*/", (route) => {
    const type = route.request().resourceType();

    if (type === "image" || type === "font" || type === "media") {
      return route.abort();
    }

    route.continue();
  });
}
