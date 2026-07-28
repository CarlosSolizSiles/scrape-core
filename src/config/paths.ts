import path from "node:path";

export const ROOT_DIR = process.cwd();

export const DATABASE_PATH = path.join(ROOT_DIR, "database.db");

export const TEMP_DIR = path.join(ROOT_DIR, "temp");

export const COOKIES_DIR = path.join(ROOT_DIR, "cookies");
