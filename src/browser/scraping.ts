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
  currentLastPostUpdate: Timestamp;
  totalPages: number | null;
  currentPage: number;
  tempFirstUpdatedPost: Timestamp;
};

type GetNewPostsResult = {
  posts: Post[];
  reachedLimit: boolean;
};

function getNewPosts(
  pagePosts: Post[],
  resumeTimestamp: number,
  stopTimestamp: number,
): GetNewPostsResult {
  const posts: Post[] = [];
  let reachedLimit = false;

  for (const post of pagePosts) {
    if (stopTimestamp && post.updatedAt <= stopTimestamp) {
      reachedLimit = true;

      break;
    }

    if (!resumeTimestamp || post.updatedAt < resumeTimestamp) {
      posts.push(post);
    }
  }

  return {
    posts,
    reachedLimit,
  };
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

    // console.log(type, route.request().method(), route.request().url());

    return route.continue();
  });

  const {
    currentPage: savedPage,
    isRunning,
    lastUpdatedPost,
    lastProcessedPost,
    tempFirstUpdatedPost,
  } = getMetadata();

  const scrapingState: ScrapingState = {
    totalPages: null,
    currentLastPostUpdate: lastProcessedPost,

    latestKnownPostTimestamp:
      isRunning && lastUpdatedPost ? lastUpdatedPost : 0,
    currentPage: isRunning ? savedPage : 1,
    tempFirstUpdatedPost: tempFirstUpdatedPost,
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
      scrapingState.currentLastPostUpdate,
    );

    if (posts.length !== 18 || findPosts.posts.length !== 18) {
      console.log(
        `/page/${scrapingState.currentPage}/`,
        posts.length,
        findPosts.posts.length,
      );
    }

    if (findPosts.posts.length) {
      const lastPost = findPosts.posts.at(-1)!;

      scrapingState.latestKnownPostTimestamp = lastPost.updatedAt;

      if (!scrapingState.tempFirstUpdatedPost) {
        scrapingState.tempFirstUpdatedPost = findPosts.posts[0]!.updatedAt;
      }

      saveDiscoveredPosts(findPosts.posts);

      updateMetadata({
        isRunning: true,
        currentPage: scrapingState.currentPage,
        lastUpdatedPost: scrapingState.latestKnownPostTimestamp,
        tempFirstUpdatedPost: scrapingState.tempFirstUpdatedPost,
      });
    }

    if (findPosts.reachedLimit) {
      break;
    }

    const delay = humanDelay() * 1.25;

    await sleep(delay);

    scrapingState.currentPage++;
  } while (
    scrapingState.totalPages !== null &&
    scrapingState.currentPage <= scrapingState.totalPages
  );

  updateMetadata({
    lastProcessedPost: scrapingState.tempFirstUpdatedPost,
    isRunning: false,
    currentPage: 0,
    lastUpdatedPost: 0,
    tempFirstUpdatedPost: 0,
  });
  // console.log("");
  // console.log("==================================================");
  console.log("🎉 El proceso de scraping ha finalizado.");
  // console.log("==================================================");
}
