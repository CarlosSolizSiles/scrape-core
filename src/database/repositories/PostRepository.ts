import { db } from "../client.js";

export type PostStatus = "DISCOVERED" | "COMPLETED" | "FAILED";

export type Post = {
  id: string;
  updatedAt: number;
  title: string;
  originalTitle: string;
  description: string;
  languages: string[];
  developer: string;
  releasedDate: string;
  ageRating: string;
  tags: string[];
  resources: string[];
  status: PostStatus;
};

export type DiscoveredPost = {
  id: string;
  updatedAt: number;
};

export type PostData = Omit<Post, "id" | "updatedAt" | "status">;

/**
 * Guarda los posts encontrados durante el recorrido
 * de la paginación.
 *
 * Si el post ya existe y cambió su fecha de actualización,
 * vuelve a marcarse como DISCOVERED para ser procesado nuevamente.
 */
export const saveDiscoveredPosts = (posts: DiscoveredPost[]) => {
  if (!posts.length) {
    return;
  }

  const placeholders = posts.map(() => "(?, ?, 'DISCOVERED')").join(",");

  const values = posts.flatMap((post) => [post.id, post.updatedAt]);

  db.prepare(
    `
    INSERT INTO posts (
      id,
      updatedAt,
      status
    )
    VALUES ${placeholders}

    ON CONFLICT(id)
    DO UPDATE SET
      updatedAt = excluded.updatedAt,
      status = CASE
        WHEN posts.updatedAt != excluded.updatedAt
        THEN 'DISCOVERED'
        ELSE posts.status
      END
  `,
  ).run(...values);
};

/**
 * Completa el scraping del post y lo marca como COMPLETED.
 */
export const completePost = (id: string, data: PostData) => {
  db.prepare(
    `
    UPDATE posts
    SET
      title = ?,
      originalTitle = ?,
      description = ?,
      languages = ?,
      developer = ?,
      releasedDate = ?,
      ageRating = ?,
      tags = ?,
      resources = ?,
      status = 'COMPLETED'
    WHERE id = ?
  `,
  ).run(
    data.title,
    data.originalTitle,
    data.description,
    JSON.stringify(data.languages),
    data.developer,
    data.releasedDate,
    data.ageRating,
    JSON.stringify(data.tags),
    JSON.stringify(data.resources),
    id,
  );
};

/**
 * Marca el post como fallido.
 */
export const failPost = (id: string) => {
  db.prepare(
    `
    UPDATE posts
    SET status = 'FAILED'
    WHERE id = ?
  `,
  ).run(id);
};

/**
 * Obtiene todos los posts pendientes
 * de ser scrapeados.
 */
export const getPendingPosts = () => {
  return db
    .prepare(
      `
      SELECT id, updatedAt
      FROM posts
      WHERE status = 'DISCOVERED'
      ORDER BY updatedAt DESC
    `,
    )
    .all() as DiscoveredPost[];
};

/**
 * Obtiene todos los posts almacenados.
 */
export const getSavedPosts = (): Post[] => {
  const rows = db
    .prepare(
      `
      SELECT *
      FROM posts
      ORDER BY updatedAt DESC
    `,
    )
    .all() as any[];

  return rows.map((row) => ({
    id: row.id,
    updatedAt: row.updatedAt,
    title: row.title ?? "",
    originalTitle: row.originalTitle ?? "",
    description: row.description ?? "",
    languages: row.languages ? JSON.parse(row.languages) : [],
    developer: row.developer ?? "",
    releasedDate: row.releasedDate ?? "",
    ageRating: row.ageRating ?? "",
    tags: row.tags ? JSON.parse(row.tags) : [],
    resources: row.resources ? JSON.parse(row.resources) : [],
    status: row.status,
  }));
};

/**
 * Verifica si la base de datos está vacía.
 */
export const isDatabaseEmpty = () => {
  const row = db
    .prepare(
      `
      SELECT EXISTS(
        SELECT 1
        FROM posts
        LIMIT 1
      ) AS hasPosts
    `,
    )
    .get() as {
    hasPosts: number;
  };

  return row.hasPosts === 0;
};
