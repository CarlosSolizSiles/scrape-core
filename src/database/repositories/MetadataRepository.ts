import type { Metadata } from "@/models/Metadata.js";
import { db } from "../client.js";
import { isObjectEmpty } from "@/lib/isObjectEmpty.js";

export function getMetadata<T = Metadata>() {
  const row = db
    .prepare("SELECT value FROM metadata WHERE key = ?")
    .get("state") as { value?: string } | undefined;

  return row?.value ? (JSON.parse(row.value) as T) : ({} as T);
}

export function updateMetadata(partial: Partial<Metadata>) {
  const row = db
    .prepare("SELECT value FROM metadata WHERE key = ?")
    .get("state") as { value?: string } | undefined;

  const current = row?.value ? JSON.parse(row.value) : {};

  const newState = {
    ...current,
    ...partial,
  };

  db.prepare(
    `
    INSERT INTO metadata (key, value)
    VALUES (?, ?)
    ON CONFLICT(key)
    DO UPDATE SET value = excluded.value
  `,
  ).run("state", JSON.stringify(newState));

  return newState;
}

export const getLastProcessedPost = () => {
  const value = getMetadata().lastProcessedPost;

  return value ? new Date(value) : undefined;
};

export const initializeMetadata = () => {
  if (isObjectEmpty(getMetadata())) {
    updateMetadata({
      lastProcessedPost: "",
      isRunning: false,
      currentPage: 0,
      lastUpdatedPost: "",
    });
  }
};
