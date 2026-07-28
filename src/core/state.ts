// src/core/state.ts

import { BrowserManager } from "@/browser/BrowserManager.js";

interface AppState {
  startedAt: number;
  isHeadless: boolean;
  browser: BrowserManager;
}

export const state: AppState = {
  startedAt: Date.now(),
  isHeadless: !false,
  browser: new BrowserManager(
    process.env.BASE_URL || "https://www.ryuugames.com/",
  ),
};
