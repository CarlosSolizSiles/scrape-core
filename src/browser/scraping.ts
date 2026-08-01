import { state } from "@/core/state.js";
import { navigate } from "./navigate.js";
import {
  extractPaginationPageData,
  type Post,
} from "./extract/paginationPageData.js";
import { humanDelay, sleep } from "@/lib/time.js";
import { saveDiscoveredPosts } from "@/database/repositories/PostRepository.js";
import {
  getMetadata,
  updateMetadata,
} from "@/database/repositories/MetadataRepository.js";
import type { Timestamp } from "@/models/defineType.js";

type ScrapingState = {
  latestKnownPostTimestamp: Timestamp;
  currentLastPostUpdate: Timestamp | null;
  totalPages: number | null;
  currentPage: number;
};

function getNewPosts(pagePosts: Post[], latestKnownPostTimestamp: number) {
  const firstNewPostIndex = pagePosts.findIndex(
    (post) =>
      !latestKnownPostTimestamp || post.updatedAt < latestKnownPostTimestamp,
  );

  if (!latestKnownPostTimestamp && pagePosts[0]) {
    latestKnownPostTimestamp = pagePosts[0].updatedAt;
  }

  return firstNewPostIndex === -1 ? -1 : pagePosts.slice(firstNewPostIndex);
}

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

  const {
    currentPage: savedPage,
    isRunning,
    lastUpdatedPost,
    lastProcessedPost,
  } = getMetadata();

  const scrapingState: ScrapingState = {
    totalPages: null,
    latestKnownPostTimestamp:
      isRunning && lastUpdatedPost ? lastUpdatedPost : 0,
    currentPage: isRunning ? savedPage : 1,
    currentLastPostUpdate: null,
  };

  do {
    await navigate(`/page/${scrapingState.currentPage}/`);

    const paginationData = await extractPaginationPageData();

    if (paginationData === null) {
      throw new Error(
        `No se pudieron extraer los datos de la página ${scrapingState.currentPage}.`,
      );
    }

    const { totalPages, posts } = paginationData;

    scrapingState.totalPages = totalPages;

    const findPosts = getNewPosts(
      posts,
      scrapingState.latestKnownPostTimestamp,
    );

    if (findPosts !== -1) {
      const lastPost = posts.at(-1);

      if (lastPost) {
        scrapingState.latestKnownPostTimestamp = lastPost.updatedAt;
      }

      saveDiscoveredPosts(findPosts);

      updateMetadata({
        isRunning: true,
        currentPage: scrapingState.currentPage,
        lastUpdatedPost: scrapingState.latestKnownPostTimestamp,
      });
    }

    const delay = humanDelay();

    await sleep(delay);

    scrapingState.currentPage++;
  } while (
    scrapingState.totalPages !== null &&
    scrapingState.currentPage <= scrapingState.totalPages
  );

  updateMetadata({
    lastProcessedPost: 0,
    isRunning: false,
    currentPage: 0,
    lastUpdatedPost: 0,
  });
  // console.log("");
  // console.log("==================================================");
  console.log("🎉 El proceso de scraping ha finalizado.");
  // console.log("==================================================");
}
