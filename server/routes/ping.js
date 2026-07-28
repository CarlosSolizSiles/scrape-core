import {} from "fastify";
export async function pingRoutes(server) {
    server.get("/ping", async () => {
        return "pong\n";
    });
}
//# sourceMappingURL=ping.js.map