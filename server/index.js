import { createServer } from "./server.js";
import { initializeDatabase } from "./database/index.js";
import { initializePlaywright } from "./playwright/index.js";
async function bootstrap() {
    try {
        // Inicializar servicios
        await initializeDatabase();
        await initializePlaywright();
        // Crear servidor
        const server = await createServer();
        await server.listen({
            port: 8080,
        });
        console.log("🚀 Server listening on http://localhost:8080");
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=index.js.map