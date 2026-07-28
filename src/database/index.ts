import { db } from "./client.js";

export async function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      updated TEXT NOT NULL,

      title TEXT,
      originalTitle TEXT,
      description TEXT,

      languages TEXT NOT NULL,

      developer TEXT,
      releasedDate TEXT,
      ageRating TEXT,

      tags TEXT NOT NULL,
      resources TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}
