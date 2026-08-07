import { state } from "@/core/state.js";

import {
  getMetadata,
  updateMetadata,
} from "@/database/repositories/MetadataRepository.js";
import { saveDiscoveredPosts } from "@/database/repositories/PostRepository.js";

import { humanDelay, sleep } from "@/lib/time.js";

import type { Timestamp } from "@/models/defineType.js";

import {
  extractPaginationPageData,
  type Post,
} from "./extract/paginationPageData.js";
import { navigate } from "./navigate.js";
import { WindowsNative } from "@/native/windows.js";

type ScrapingSession = {
  currentPage: number;
  totalPages: number | null;

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

    if (!resumeUpdatedAt || post.updatedAt <= resumeUpdatedAt) {
      posts.push(post);
    }
  }

  return {
    posts,
    reachedProcessedPosts,
  };
}

async function syncPosts() {
  const {
    isRunning,
    resumePage,
    processedUntilUpdatedAt,
    firstDiscoveredPostUpdatedAt,
  } = getMetadata();

  const session: ScrapingSession = {
    currentPage: isRunning ? resumePage : 1,
    totalPages: null,

    firstDiscoveredPostUpdatedAt,
  };

  do {
    await navigate("scraping", `/page/${session.currentPage}/`);

    const pageData = await extractPaginationPageData();

    if (pageData === null) {
      throw new Error(
        `No se pudieron extraer los datos de la página ${session.currentPage}.`,
      );
    }

    const { posts: pagePosts, totalPages } = pageData;

    if (!session.firstDiscoveredPostUpdatedAt) {
      session.firstDiscoveredPostUpdatedAt = Date.now();
    }

    session.totalPages = totalPages;

    const newPosts = getNewPosts(pagePosts, 0, processedUntilUpdatedAt);

    if (newPosts.posts.length > 0) {
      newPosts.posts = pagePosts;

      saveDiscoveredPosts(newPosts.posts);

      console.log("🥳 se añadio nuevo posts");

      updateMetadata({
        isRunning: true,
        resumePage: session.currentPage,
        firstDiscoveredPostUpdatedAt: session.firstDiscoveredPostUpdatedAt,
      });
    }

    if (newPosts.reachedProcessedPosts) {
      break;
    }

    await sleep(humanDelay());

    session.currentPage++;
  } while (
    session.totalPages !== null &&
    session.currentPage <= session.totalPages
  );

  updateMetadata({
    isRunning: false,
    resumePage: 0,
    processedUntilUpdatedAt: session.firstDiscoveredPostUpdatedAt,
    firstDiscoveredPostUpdatedAt: 0,
  });

  // console.log("🎉 El proceso de scraping ha finalizado.");

  // guardarJSON(allPost, "db.json");
}

function randomInterval() {
  // 90% de las veces: entre 30 y 60 segundos
  if (Math.random() < 0.9) {
    return 30_000 + Math.random() * 30_000;
  }

  // 10% de las veces: entre 2 y 5 minutos
  return 120_000 + Math.random() * 180_000;
}

const loop = async () => {
  await syncPosts();
  setTimeout(loop, randomInterval());
};

export async function startPostMonitor() {
  console.log("si");
  const page = await state.browser.createPage("scraping");

  await WindowsNative.hideWindowByTitle(await page.title());

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

  await loop();
}
