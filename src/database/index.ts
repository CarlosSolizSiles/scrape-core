import { db } from "./client.js";

export async function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      updatedAt INTEGER NOT NULL,

      title TEXT,
      originalTitle TEXT,
      description TEXT,

      languages TEXT,

      developer TEXT,
      releasedDate TEXT,
      ageRating TEXT,

      tags TEXT,
      resources TEXT,

      status TEXT NOT NULL DEFAULT 'DISCOVERED'
        CHECK(status IN (
          'DISCOVERED',
          'COMPLETED',
          'FAILED'
        ))
    );

    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}
