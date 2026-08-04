import { state } from "@/core/state.js";

import {
  getMetadata,
  updateMetadata,
} from "@/database/repositories/MetadataRepository.js";
import {
  getPostsCount,
  saveDiscoveredPosts,
} from "@/database/repositories/PostRepository.js";

import { humanDelay, sleep } from "@/lib/time.js";

import type { Timestamp } from "@/models/defineType.js";

import {
  extractPaginationPageData,
  type Post,
} from "./extract/paginationPageData.js";
import { navigate } from "./navigate.js";
import fs from "node:fs";

type ScrapingSession = {
  currentPage: number;
  totalPages: number | null;

  firstDiscoveredPostUpdatedAt: Timestamp;
  lastDiscoveredPostUpdatedAt: Timestamp;
};

type GetNewPostsResult = {
  posts: Post[];
  reachedProcessedPosts: boolean;
};

function guardarJSON<T>(array: Array<T>, ruta: string) {
  fs.writeFileSync(ruta, JSON.stringify(array, null, 4), "utf8");
}

function cargarJSON(ruta: string) {
  if (!fs.existsSync(ruta)) {
    return [];
  }

  const contenido = fs.readFileSync(ruta, "utf8");
  return JSON.parse(contenido);
}

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
    isRunning,
    resumePage,
    resumeUpdatedAt,
    processedUntilUpdatedAt,
    firstDiscoveredPostUpdatedAt,
  } = getMetadata();

  const session: ScrapingSession = {
    currentPage: isRunning ? resumePage : 1,
    totalPages: null,

    firstDiscoveredPostUpdatedAt,
    lastDiscoveredPostUpdatedAt:
      isRunning && resumeUpdatedAt ? resumeUpdatedAt : 0,
  };

  let allPost: Post[][] = [];

  do {
    await navigate(`/page/${session.currentPage}/`);

    const pageData = await extractPaginationPageData();

    if (pageData === null) {
      throw new Error(
        `No se pudieron extraer los datos de la página ${session.currentPage}.`,
      );
    }

    const { posts: pagePosts, totalPages } = pageData;

    session.totalPages = totalPages;

    const newPosts = getNewPosts(
      pagePosts,
      session.lastDiscoveredPostUpdatedAt,
      processedUntilUpdatedAt,
    );

    const total = getPostsCount();

    allPost.push(pagePosts);

    // console.log(total);

    if (pagePosts.length !== 18 || newPosts.posts.length !== 18 || total % 18) {
      console.log(`\n📄 Página ${session.currentPage}`);
      console.log(`Total extraídos: ${pagePosts.length}`);
      console.log(`Nuevos: ${newPosts.posts.length}`);
      console.log(`Descartados: ${pagePosts.length - newPosts.posts.length}`);
      console.log(
        `lastDiscoveredPostUpdatedAt: ${session.lastDiscoveredPostUpdatedAt}`,
      );
      console.log(`processedUntilUpdatedAt: ${processedUntilUpdatedAt}`);

      for (const post of pagePosts) {
        let reason = "✅ Nuevo";

        if (
          processedUntilUpdatedAt &&
          post.updatedAt <= processedUntilUpdatedAt
        ) {
          reason = "⛔ Ya procesado";
        } else if (
          resumeUpdatedAt &&
          post.updatedAt >= session.lastDiscoveredPostUpdatedAt
        ) {
          reason = "🔄 Ya descubierto en esta sesión";
        }

        console.log(`${reason} | ${post.id} | ${post.updatedAt}`);
      }

      console.log();
    }

    if (newPosts.posts.length > 0 || true) {
      newPosts.posts = pagePosts;
      const newestDiscoveredPost = newPosts.posts[0]!;
      const oldestDiscoveredPost = newPosts.posts.at(-1)!;

      session.lastDiscoveredPostUpdatedAt = oldestDiscoveredPost.updatedAt;

      if (!session.firstDiscoveredPostUpdatedAt) {
        session.firstDiscoveredPostUpdatedAt = newestDiscoveredPost.updatedAt;
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

    await sleep(humanDelay() / 2);

    session.currentPage++;
  } while (
    session.totalPages !== null &&
    session.currentPage <= session.totalPages
  );

  updateMetadata({
    isRunning: false,
    resumePage: 0,
    resumeUpdatedAt: 0,
    processedUntilUpdatedAt: session.firstDiscoveredPostUpdatedAt,
    firstDiscoveredPostUpdatedAt: 0,
  });

  console.log("🎉 El proceso de scraping ha finalizado.");

  guardarJSON(allPost, "db.json");
}
