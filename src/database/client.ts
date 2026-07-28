import { DatabaseSync } from "node:sqlite";
import { DATABASE_PATH } from "@/config/paths.js";

export const db = new DatabaseSync(DATABASE_PATH);