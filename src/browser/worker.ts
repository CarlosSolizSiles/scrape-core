import { extraerData, type AIresponse } from "@/ai/extraerData.js";
import { queue } from "./queue.js";

import { writeFile } from "node:fs/promises";
import { existsHtml, saveHtml } from "@/lib/fs.js";

export async function saveText(path: string, content: string): Promise<void> {
  await writeFile(path, content, "utf8");
}

// function createHTML(id: string, data: AIresponse): string {
//   const chips = (items: string[]) =>
//     items.length
//       ? items.map((item) => `<span class="chip">${item}</span>`).join("")
//       : "<em>Sin datos</em>";

//   const gallery = data.gallery.length
//     ? data.gallery
//         .map(
//           (img) => `
//             <a href="${img}" target="_blank" rel="noopener noreferrer">
//               <img src="${img}" loading="lazy" alt="">
//             </a>
//           `,
//         )
//         .join("")
//     : "<p><em>Sin imágenes.</em></p>";

//   const resources = data.resources.length
//     ? data.resources
//         .map(
//           (url) => `
//             <li>
//               <a href="${url}" target="_blank" rel="noopener noreferrer">
//                 ${url}
//               </a>
//             </li>
//           `,
//         )
//         .join("")
//     : "<li><em>Sin recursos.</em></li>";

//   return /* html */ `
// <!DOCTYPE html>
// <html lang="es">

// <head>

// <meta charset="UTF-8">
// <meta name="viewport" content="width=device-width, initial-scale=1">

// <title>${data.title ?? id}</title>

// <link
//     rel="stylesheet"
//     href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
// />

// <style>

// main{
//     max-width:1200px;
//     margin:auto;
//     padding:2rem;
// }

// header{
//     margin-bottom:2rem;
// }

// .hero{
//     display:grid;
//     grid-template-columns:340px 1fr;
//     gap:2rem;
//     align-items:start;
// }

// .cover{
//     width:100%;
//     border-radius:var(--pico-border-radius);
//     display:block;
// }

// .info h3{
//     margin-top:1.5rem;
//     margin-bottom:.75rem;
// }

// .chips{
//     display:flex;
//     flex-wrap:wrap;
//     gap:.6rem;
// }

// .chip{
//     display:inline-flex;
//     align-items:center;

//     padding:.45rem .9rem;

//     border:1px solid var(--pico-muted-border-color);
//     border-radius:999px;

//     background:var(--pico-card-background-color);

//     font-size:.9rem;
//     line-height:1;
// }

// .description{
//     white-space:pre-wrap;
// }

// .gallery{
//     display:grid;
//     grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
//     gap:1rem;
// }

// .gallery img{
//     width:100%;
//     display:block;
//     border-radius:var(--pico-border-radius);
// }

// footer{
//     margin-top:3rem;
//     text-align:center;
// }

// @media (max-width:900px){

//     .hero{
//         grid-template-columns:1fr;
//     }

// }

// </style>

// </head>

// <body>

// <main>

// <header>

// <h1>${data.title ?? "Sin título"}</h1>

// ${data.originalTitle ? `<p><em>${data.originalTitle}</em></p>` : ""}

// <a
//     href="https://ryuugames.com/${id}"
//     role="button"
//     target="_blank"
//     rel="noopener noreferrer">
//     Página original
// </a>

// </header>

// <section class="hero">

// <div>

// ${
//   data.cover
//     ? `<img class="cover" src="${data.cover}" alt="Cover">`
//     : "<article><em>Sin portada.</em></article>"
// }

// </div>

// <div class="info">

// <article>

// <h2>Información</h2>

// <table>

// <tr>
//     <th>Desarrollador</th>
//     <td>${data.developer ?? "-"}</td>
// </tr>

// <tr>
//     <th>Lanzamiento</th>
//     <td>${data.releasedDate ?? "-"}</td>
// </tr>

// <tr>
//     <th>Clasificación</th>
//     <td>${data.ageRating ?? "-"}</td>
// </tr>

// </table>

// <h3>Idiomas</h3>

// <div class="chips">
// ${chips(data.languages)}
// </div>

// <h3>Tags</h3>

// <div class="chips">
// ${chips(data.tags)}
// </div>

// </article>

// </div>

// </section>

// <article>

// <h2>Descripción</h2>

// <p class="description">
// ${data.description ?? "Sin descripción."}
// </p>

// </article>

// <article>

// <h2>Galería</h2>

// <div class="gallery">

// ${gallery}

// </div>

// </article>

// <article>

// <h2>Recursos</h2>

// <ul>

// ${resources}

// </ul>

// </article>

// <footer>

// <small>
// Generado automáticamente desde AIresponse
// </small>

// </footer>

// </main>

// </body>

// </html>
// `;
// }

export async function startWorker() {
  while (true) {
    const {
      data: { innerHTML },
      id,
      updatedAt,
    } = await queue.pop();

    if (await existsHtml(id, updatedAt)) continue;

    console.log("Procesando", id);

    // const { elapsedMs, response } = await extraerData(innerHTML);
    // await saveText(`output/${task.id}.html`, task.data.innerText);
    // await saveText(`output/${task.id}.html`, createHTML(task.id, response));

    await saveHtml(id, updatedAt, innerHTML);
  }
}
