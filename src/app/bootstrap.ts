import { createServer } from "./server.js";
import { initializeDatabase } from "@/database/index.js";
import { initializePlaywright } from "@/browser/Browser.js";

const port = Number(process.env.PORT ?? 80);

export async function bootstrap() {
  try {
    // Inicializar servicios
    await initializeDatabase();
    await initializePlaywright();

    // Crear servidor
    const server = await createServer();

    await server.listen({
      port,
      host: "0.0.0.0",
    });

    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
