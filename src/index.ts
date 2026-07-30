import { bootstrap } from "@/app/bootstrap.js";
import { scraping } from "./browser/scraping.js";
import { startWorker } from "./browser/worker.js";
import { initializeDatabase } from "./database/index.js";

await initializeDatabase();

await bootstrap();

startWorker();

scraping();
