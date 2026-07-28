import type { Post } from "@/models/Post";
import { db } from "../client";

export const savePost = (post: Post) => {
  console.log(post);

  db.prepare(
    `
    INSERT INTO posts (
      id,
      updated,
      title,
      originalTitle,
      description,
      languages,
      developer,
      releasedDate,
      ageRating,
      tags,
      resources
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id)
    DO UPDATE SET
      updated = excluded.updated,
      title = excluded.title,
      originalTitle = excluded.originalTitle,
      description = excluded.description,
      languages = excluded.languages,
      developer = excluded.developer,
      releasedDate = excluded.releasedDate,
      ageRating = excluded.ageRating,
      tags = excluded.tags,
      resources = excluded.resources
  `,
  ).run(
    post.id,
    post.updated,
    post.title,
    post.originalTitle,
    post.description,
    JSON.stringify(post.languages),
    post.developer,
    post.releasedDate,
    post.ageRating,
    JSON.stringify(post.tags),
    JSON.stringify(post.resources),
  );
};

export const getSavedPosts = (): Post[] => {
  const rows = db
    .prepare(
      `
      SELECT *
      FROM posts
      ORDER BY updated DESC
    `,
    )
    .all() as any[];

  return rows.map((row) => ({
    id: row.id,
    updated: row.updated,
    title: row.title,
    originalTitle: row.originalTitle,
    description: row.description,
    languages: JSON.parse(row.languages),
    developer: row.developer,
    releasedDate: row.releasedDate,
    ageRating: row.ageRating,
    tags: JSON.parse(row.tags),
    resources: JSON.parse(row.resources),
  }));
};

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
    .get() as { hasPosts: number };

  return row.hasPosts === 0;
};
