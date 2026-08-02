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

type ScrapingSession = {
  lastDiscoveredPostUpdatedAt: Timestamp;
  totalPages: number | null;
  currentPage: number;
  firstDiscoveredPostUpdatedAt: Timestamp;
};

type GetNewPostsResult = {
  posts: Post[];
  reachedProcessedPosts: boolean;
};

function getNewPosts(
  pagePosts: Post[],
  resumeUpdatedAt: Timestamp,
  processedUntilUpdatedAt: Timestamp,
): GetNewPostsResult {
  const posts: Post[] = [];
  let reachedProcessedPosts = false;

  for (const post of pagePosts) {
    if (processedUntilUpdatedAt && post.updatedAt <= processedUntilUpdatedAt) {
      reachedProcessedPosts = true;
      break;
    }

    if (!resumeUpdatedAt || post.updatedAt < resumeUpdatedAt) {
      posts.push(post);
    }
  }

  return {
    posts,
    reachedProcessedPosts,
  };
}

export async function scraping() {
  const { page } = state.browser.getManager();

  await page.route("**/*", (route) => {
    const resourceType = route.request().resourceType();

    if (
      ["image", "font", "media", "script", "stylesheet", "other"].includes(
        resourceType,
      )
    ) {
      return route.abort();
    }

    return route.continue();
  });

  const {
    resumePage,
    isRunning,
    resumeUpdatedAt,
    processedUntilUpdatedAt,
    firstDiscoveredPostUpdatedAt,
  } = getMetadata();

  const session: ScrapingSession = {
    totalPages: null,

    lastDiscoveredPostUpdatedAt:
      isRunning && resumeUpdatedAt ? resumeUpdatedAt : 0,
    currentPage: isRunning ? resumePage : 881,
    firstDiscoveredPostUpdatedAt,
  };

  do {
    await navigate(`/page/${session.currentPage}/`);

    const pageData = await extractPaginationPageData();

    if (pageData === null) {
      throw new Error(
        `No se pudieron extraer los datos de la página ${session.currentPage}.`,
      );
    }

    const { totalPages, posts: pagePosts } = pageData;

    session.totalPages = totalPages;

    const newPosts = getNewPosts(
      pagePosts,
      session.lastDiscoveredPostUpdatedAt,
      processedUntilUpdatedAt,
    );

    if (pagePosts.length !== 18 || newPosts.posts.length !== 18) {
      console.log(
        `/page/${session.currentPage}/`,
        pagePosts.length,
        newPosts.posts.length,
      );

      console.log(pagePosts);
    }

    if (newPosts.posts.length) {
      const oldestDiscoveredPost = newPosts.posts.at(-1)!;

      session.lastDiscoveredPostUpdatedAt = oldestDiscoveredPost.updatedAt;

      if (!session.firstDiscoveredPostUpdatedAt) {
        session.firstDiscoveredPostUpdatedAt = newPosts.posts[0]!.updatedAt;
      }

      saveDiscoveredPosts(newPosts.posts);

      updateMetadata({
        isRunning: true,
        resumePage: session.currentPage,
        resumeUpdatedAt: session.lastDiscoveredPostUpdatedAt,
        firstDiscoveredPostUpdatedAt: session.firstDiscoveredPostUpdatedAt,
      });
    }

    if (newPosts.reachedProcessedPosts) {
      break;
    }

    const requestDelay = humanDelay() * 1.25;

    await sleep(requestDelay);

    session.currentPage++;
  } while (
    session.totalPages !== null &&
    session.currentPage <= session.totalPages
  );

  updateMetadata({
    processedUntilUpdatedAt: session.firstDiscoveredPostUpdatedAt,
    isRunning: false,
    resumePage: 0,
    resumeUpdatedAt: 0,
    firstDiscoveredPostUpdatedAt: 0,
  });

  console.log("🎉 El proceso de scraping ha finalizado.");
}
