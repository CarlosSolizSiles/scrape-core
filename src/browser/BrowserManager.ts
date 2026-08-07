// src/browser/BrowserManager.ts

import type { Browser, BrowserContext, Page } from "playwright";

export class BrowserManager {
  browser: Browser | null = null;
  context: BrowserContext | null = null;

  readonly pages = new Map<string, Page>();

  constructor(public readonly baseURL: string) {}

  private checkContext(): BrowserContext {
    if (!this.browser || !this.context) {
      throw new Error("BrowserManager no inicializado.");
    }

    return this.context;
  }

  getBrowser(): Browser {
    if (!this.browser) {
      throw new Error("Browser no inicializado.");
    }

    return this.browser;
  }

  getContext(): BrowserContext {
    return this.checkContext();
  }

  async createPage(id: string): Promise<Page> {
    const context = this.checkContext();

    if (this.pages.has(id)) {
      throw new Error(`La página "${id}" ya existe.`);
    }

    const page = await context.newPage();

    this.pages.set(id, page);

    return page;
  }

  getPage(id: string): Page {
    const page = this.pages.get(id);

    if (!page) {
      throw new Error(`La página "${id}" no existe.`);
    }

    return page;
  }

  hasPage(id: string): boolean {
    return this.pages.has(id);
  }

  setPage(id: string, page: Page): void {
    this.pages.set(id, page);
  }

  async deletePage(id: string): Promise<boolean> {
    const page = this.pages.get(id);

    if (!page) {
      return false;
    }

    await page.close();
    this.pages.delete(id);

    return true;
  }

  async clearPages(): Promise<void> {
    for (const page of this.pages.values()) {
      await page.close();
    }

    this.pages.clear();
  }

  listPages(): string[] {
    return [...this.pages.keys()];
  }
}
