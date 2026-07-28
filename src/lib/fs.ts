import { DOMParser } from "linkedom";
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";

const CACHE_DIR = "./cache";

function getFilePath(id: string, time: number) {
  return path.join(CACHE_DIR, id, `${time}.html`);
}

export async function saveHtml(id: string, time: number, html: string) {
  await mkdir(path.join(CACHE_DIR, id), { recursive: true });
  await writeFile(getFilePath(id, time), html, "utf8");
}

export async function existsHtml(id: string, time: number) {
  try {
    await access(getFilePath(id, time));
    return true;
  } catch {
    return false;
  }
}

export async function readHtml(id: string, time: number) {
  try {
    const innerHTML = await readFile(getFilePath(id, time), "utf8");

    const parser = new DOMParser();
    const doc = parser.parseFromString(innerHTML, "text/html");
    const innerText = doc.documentElement.innerText;

    return {
      kb: Buffer.byteLength(innerText, "utf8") / 1024,
      chars: innerText.length.toLocaleString(),
      innerHTML,
      innerText,
    };
  } catch {
    return null;
  }
}
