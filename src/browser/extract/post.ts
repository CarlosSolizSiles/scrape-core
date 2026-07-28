import { state } from "@/core/state.js";
import { EvaluatePaginationPageData } from "./pagination.page.data.evaluate.js";

export interface Post {
  id: string;
  updatedAt: number;
}

export interface PaginationPageData {
  posts: Post[];
  lastPage: number;
}

export const extractPost = async () => {
  const { page } = state.browser.getManager();

  const root = await page
    .waitForSelector(".td-main-content", {
      timeout: 5000,
    })
    .catch(() => null);

  if (!root) {
    return null;
  }

  await page.addScriptTag({
    path: "dist/browser-utils.js",
  });

  const { innerText, innerHTML } = await page.evaluate<{
    innerText: string;
    innerHTML: string;
  }>(() => {
    // @ts-ignore
    const { cleanHtml, removeDuplicateClasses, removeElementsByClass } =
      // @ts-ignore
      domUtils;

    const raiz = document.querySelector<HTMLElement>(".td-main-content")!;

    const nuevoRaiz = cleanHtml(raiz, {
      removeAttributes: true,
      compress: true,

      keepAttributes: {
        "*": ["class"],
        img: ["src"],
      },

      content: ["img"],

      removeStyle: true,
      removeScript: true,
      removeComments: true,

      flatten: {
        enabled: true,
        tags: ["div"],
        keepRoot: true,
      },
    });

    const { element } = removeDuplicateClasses(nuevoRaiz);

    const elemento = removeElementsByClass(element, [
      /sharing/,
      /^ryuu(?!line)/,
      /bottom/,
      /next/,
      /author/,
      /posts/,
      /^separator$/,
    ]);

    return {
      innerHTML: elemento.innerHTML.replace(/>\s+</g, "><").trim(),
      innerText: elemento.innerText,
    };
  });

  return {
    kb: Buffer.byteLength(innerText, "utf8") / 1024,
    chars: innerText.length.toLocaleString(),
    innerText,
    innerHTML,
  };
};
