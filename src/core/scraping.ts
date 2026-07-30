import state from "../state";
import { navigateWithCookies } from "../script/navigateWithCookies";
import { extractPosts } from "./extractPosts.js";
import { extraerData } from "../ai/extraerData.js";
import {
  getLastProcessedPost,
  getMetadata,
  updateMetadata,
} from "@/database/repositories/MetadataRepository.js";
import { updateDashboard } from "@/sockets/socket.js";
import { formatDuration } from "@/utils/formatDuration.js";
import { performance } from "node:perf_hooks";
import { savePost } from "@/database/repositories/PostRepository.js";

type Pagination = { id: string; updated: string; title: string }[];

const getTotalPages = async () => {
  const { page, context } = state;

  if (!page || !context) {
    throw new Error("Browser no iniciado");
  }

  const previous = page
    .locator(".page-nav a[aria-label='next-page']")
    .locator("xpath=preceding-sibling::*[1]");

  const text = await (
    (await previous.count()) ? previous : page.locator(".page-nav .current")
  ).textContent();

  return parseInt(text!, 10);
};

const getPostPages: () => Promise<Pagination> = async () => {
  const { page, context } = state;

  if (!page || !context) {
    throw new Error("Browser no iniciado");
  }

  let data = await extractPosts(page);
  return data.latestReleases;
};

export const scraping = async () => {
  if (!state.page || !state.browser) return;

  const { page } = state;

  const lastProcessedPost = getLastProcessedPost();

  const { currentPage, isRunning, lastUpdatedPost } = getMetadata();

  let newestProcessedPost = isRunning ? lastUpdatedPost : undefined;
  let pageIndex = isRunning ? currentPage : 1;
  let totalPages;

  const scrapingStartedAt = Date.now();

  const scrapingStats = {
    processedPages: 0,
    totalPageTime: 0,
  };

  updateDashboard({ status: "Cargando", scrapingStartedAt });

  do {
    const pageStats = {
      start: performance.now(),
      processed: 0,
      totalTime: 0,
    };

    updateDashboard({
      status: "Iniciando",
      page: pageIndex,
      processed: pageStats.processed,
      pageStartedAt: Date.now(),
    });

    await navigateWithCookies(`page/${pageIndex}/`);

    const currentPage = await getPostPages();

    if (!currentPage) break;

    totalPages = await getTotalPages();

    for (const post of currentPage) {
      const start = performance.now();
      updateDashboard({
        status: "Procesando",
        url: `${post.id}`,
        page: pageIndex,
        totalPages,
        processed: pageStats.processed,
        totalPosts: currentPage.length,
        remainingPosts: currentPage.length - pageStats.processed,
      });

      const updated = Date.parse(post.updated);

      if (lastProcessedPost && updated <= lastProcessedPost.getTime()) {
        updateMetadata({
          isRunning: false,
          currentPage: 0,
          lastUpdatedPost: "",
          lastProcessedPost: newestProcessedPost,
        });
        return;
      }

      await navigateWithCookies(`${post.id}`);

      await page.addScriptTag({
        path: "dist/browser-utils.js",
      });

      const res = await page.evaluate(() => {
        // @ts-ignore
        const { cleanHtml, removeDuplicateClasses, removeElementsByClass } =
          // @ts-ignore
          domUtils;

        const raiz = document.querySelector<HTMLElement>(".td-main-content");

        if (!raiz) {
          throw new Error("Algo salió mal");
        }
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
          /^ryuu/,
          /bottom/,
          /next/,
          /author/,
          /posts/,
        ]);

        return elemento.innerHTML;
      });

      const kb = Buffer.byteLength(res, "utf8") / 1024;

      updateDashboard({
        chars: res.length.toLocaleString(),
        kb: kb.toFixed(2),
      });

      const { response, elapsedMs } = await extraerData(res);

      savePost({ ...post, ...response });

      if (!newestProcessedPost) {
        newestProcessedPost = post.updated;
      }
      const elapsed = performance.now() - start;

      pageStats.processed++;
      pageStats.totalTime += elapsed;

      const avgPostMs = pageStats.totalTime / pageStats.processed;

      const remainingPosts = currentPage.length - pageStats.processed;

      const etaPostsMs = avgPostMs * remainingPosts;

      const elapsedSinceScraping = Date.now() - scrapingStartedAt;

      const pageFinishTime = new Date(
        scrapingStartedAt + elapsedSinceScraping + etaPostsMs,
      );

      updateDashboard({
        status: "Siguiente",

        url: "",

        processed: pageStats.processed,
        remainingPosts,

        elapsedMs,

        averageMs: avgPostMs,
        etaMs: etaPostsMs,

        extracted: response,

        average: `${avgPostMs.toFixed(0)} ms`,
        eta: formatDuration(etaPostsMs),

        pageFinishAt: pageFinishTime.toLocaleTimeString(),
      });
    }

    const pageElapsed = performance.now() - pageStats.start;

    scrapingStats.processedPages++;
    scrapingStats.totalPageTime += pageElapsed;

    const avgPageMs =
      scrapingStats.totalPageTime / scrapingStats.processedPages;

    const remainingPages = totalPages - pageIndex;

    const etaScrapingMs = avgPageMs * remainingPages;

    const scrapingFinishTime = new Date(
      scrapingStartedAt + (Date.now() - scrapingStartedAt) + etaScrapingMs,
    );

    updateDashboard({
      averagePageMs: avgPageMs,

      remainingPages,

      etaScrapingMs,

      scrapingEta: formatDuration(etaScrapingMs),

      scrapingFinishAt: scrapingFinishTime.toLocaleTimeString(),
    });

    updateMetadata({
      isRunning: true,
      currentPage: pageIndex,
      lastUpdatedPost: newestProcessedPost,
    });

    // console.log("save posts", pageIndex);

    pageIndex++;
  } while (pageIndex <= totalPages);

  updateMetadata({
    isRunning: false,
    currentPage: 0,
    lastUpdatedPost: "",
    lastProcessedPost: newestProcessedPost,
  });

  updateDashboard({ status: "Finalizado" });

  console.log("Fin Scraping");
};
