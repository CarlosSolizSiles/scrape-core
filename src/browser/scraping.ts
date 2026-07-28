import { state } from "@/core/state.js";
import { navigate } from "./navigate.js";
import { extractPaginationPageData } from "./extract/paginationPageData.js";
import { extractPost } from "./extract/post.js";
import { queue } from "./queue.js";
import { existsHtml, readHtml } from "@/lib/fs.js";
import { humanDelay, sleep } from "@/lib/time.js";

export async function scraping() {
  const { page } = state.browser.getManager();

  const scrapingState: { lastPage: number | null; currentPage: number } = {
    lastPage: null,
    currentPage: 602,
  };

  // console.log("==================================================");
  // console.log("🚀 Iniciando proceso de scraping...");
  // console.log(`📄 Página inicial configurada: ${scrapingState.currentPage}`);
  // console.log("==================================================");

  do {
    // console.log("");
    // console.log(
    //   `📑 Navegando a la página ${scrapingState.currentPage} del listado...`,
    // );

    await navigate(`/page/${scrapingState.currentPage}/`);

    // console.log("🔍 Extrayendo información de la página actual...");

    const pageData = await extractPaginationPageData();

    if (pageData === null) {
      throw new Error(
        `No se pudieron extraer los datos de la página ${scrapingState.currentPage}.`,
      );
    }

    const { lastPage, posts } = pageData;

    scrapingState.lastPage = lastPage;

    // console.log(
    //   `✅ Se encontraron ${posts.length} publicaciones (última página: ${lastPage}).`,
    // );

    let isTimeoutError = false;

    for (const post of posts) {
      // console.log("");
      // console.log(`📝 Procesando publicación: ${post.id}`);

      let data;

      if (await existsHtml(post.id, post.updatedAt)) {
        // console.log(`⏩ El archivo HTML ya existe. Se omite la extracción.`);

        data = (await readHtml(post.id, post.updatedAt))!;

        continue;
      } else {
        // console.log(`🌐 Navegando a /${post.id}/ ...`);

        const success = await navigate(`/${post.id}/`);

        if (!success) {
          // console.log(
          //   "⚠️ Timeout detectado durante la navegación. Se volverá a intentar la página actual.",
          // );

          isTimeoutError = true;
          break;
        }

        // console.log("📥 Extrayendo el contenido de la publicación...");

        data = await extractPost();

        if (!data) {
          // console.log(
          //   "⚠️ No se pudo extraer el contenido de la publicación. Se omite.",
          // );

          continue;
        }

        // console.log(
        //   `✅ Contenido extraído correctamente (${data.kb.toFixed(
        //     2,
        //   )} KB - ${data.chars} caracteres).`,
        // );

        const delay = humanDelay() / 2;

        // console.log(
        //   `😴 Esperando ${(delay / 1000).toFixed(
        //     2,
        //   )} segundos antes de continuar...`,
        // );

        await sleep(delay);
      }

      // console.log("📦 Añadiendo publicación a la cola de procesamiento...");

      queue.push({
        ...post,
        data,
      });

      // console.log(`✅ Publicación ${post.id} añadida correctamente a la cola.`);
    }

    if (isTimeoutError) {
      // console.log("");
      // console.log(
      //   `🔄 Reintentando la página ${scrapingState.currentPage} debido al timeout...`,
      // );

      isTimeoutError = false;
      continue;
    }

    // console.log("");
    // console.log(
    //   `✅ Página ${scrapingState.currentPage} procesada correctamente.`,
    // );

    const delay = humanDelay();

    // console.log(
    //   `😴 Esperando ${(delay / 1000).toFixed(
    //     2,
    //   )} segundos antes de pasar a la siguiente página...`,
    // );

    await sleep(delay);

    scrapingState.currentPage++;

    // console.log(`➡️ Continuando con la página ${scrapingState.currentPage}.`);
  } while (
    scrapingState.lastPage !== null &&
    scrapingState.currentPage <= scrapingState.lastPage
  );

  // console.log("");
  // console.log("==================================================");
  // console.log("🎉 El proceso de scraping ha finalizado.");
  // console.log("==================================================");
}
