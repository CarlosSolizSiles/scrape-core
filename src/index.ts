import { bootstrap } from "@/app/bootstrap.js";
import { startPostMonitor } from "./browser/startPostMonitor.js";
import { startWorker } from "./browser/worker.js";
import { initializeDatabase } from "./database/index.js";
import { initializeMetadata } from "./database/repositories/MetadataRepository.js";

await initializeDatabase();

initializeMetadata();

await bootstrap();

startWorker();

startPostMonitor();
