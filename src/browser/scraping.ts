import { state } from "@/core/state.js";
import { navigate } from "./navigate.js";
import { extractPaginationPageData } from "./extract/paginationPageData.js";
import { extractPost } from "./extract/post.js";
import { queue } from "./queue.js";
import { existsHtml, readHtml } from "@/lib/fs.js";
import { humanDelay, sleep } from "@/lib/time.js";
import { saveDiscoveredPosts } from "@/database/repositories/PostRepository.js";
import { getMetadata } from "@/database/repositories/MetadataRepository.js";

export async function scraping() {
  const { page } = state.browser.getManager();

  await page.route("**/*", (route) => {
    const type = route.request().resourceType();

    if (
      ["image", "font", "media", "script", "stylesheet", "other"].includes(type)
    ) {
      return route.abort();
    }

    console.log(type, route.request().method(), route.request().url());

    return route.continue();
  });

  const { currentPage, isRunning, lastUpdatedPost } = getMetadata();

  const scrapingState: { lastPage: number | null; currentPage: number } = {
    lastPage: null,
    currentPage: 1,
  };

  do {
    await navigate(`/page/${scrapingState.currentPage}/`);

    const pageData = await extractPaginationPageData();

    if (pageData === null) {
      throw new Error(
        `No se pudieron extraer los datos de la página ${scrapingState.currentPage}.`,
      );
    }

    const { lastPage, posts } = pageData;

    scrapingState.lastPage = lastPage;

    saveDiscoveredPosts(posts);

    const delay = humanDelay() / 2;

    await sleep(delay);

    scrapingState.currentPage++;
  } while (
    scrapingState.lastPage !== null &&
    scrapingState.currentPage <= scrapingState.lastPage
  );

  // console.log("");
  // console.log("==================================================");
  // console.log("🎉 El proceso de scraping ha finalizado.");
  // console.log("==================================================");
}
