import { bootstrap } from "@/app/bootstrap.js";
import { scraping } from "./browser/scraping.js";
import { startWorker } from "./browser/worker.js";

await bootstrap();

startWorker();

scraping();
