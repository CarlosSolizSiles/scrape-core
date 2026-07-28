// src/browser/BrowserManager.ts

import type { Browser, BrowserContext, Page } from "playwright";

export class BrowserManager {
  browser: Browser | null = null;
  context: BrowserContext | null = null;
  page: Page | null = null;
  baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * getManager
   */
  public getManager() {
    if (!this.browser || !this.context || !this.page) {
      throw new Error("El administrador del navegador no está inicializado.");
    }

    return {
      browser: this.browser,
      context: this.context,
      page: this.page,
    };
  }
}
