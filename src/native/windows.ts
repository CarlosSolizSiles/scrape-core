import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const addon = require("./windows_hwnd.node");

export class WindowsNative {
  static findWindowByTitle(title: string): number {
    return addon.findPidByPartialTitle(title);
  }

  static async setWindowVisible(
    hwnd: number,
    visible: boolean,
  ): Promise<void> {
    await addon.setWindowVisible(hwnd, visible);
  }

  static async showWindowByTitle(title: string): Promise<void> {
    const hwnd = this.findWindowByTitle(title);

    if (!hwnd) {
      throw new Error(`No se encontró una ventana con "${title}".`);
    }

    await this.setWindowVisible(hwnd, true);
  }

  static async hideWindowByTitle(title: string): Promise<void> {
    const hwnd = this.findWindowByTitle(title);

    if (!hwnd) {
      throw new Error(`No se encontró una ventana con "${title}".`);
    }

    await this.setWindowVisible(hwnd, false);
  }
}