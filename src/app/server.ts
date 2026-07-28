import Fastify from "fastify";
import fastifyStatic from "@fastify/static";

import path from "node:path";
import { fileURLToPath } from "node:url";

import { pingRoutes } from "@/routes/ping.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createServer() {
  const server = Fastify();

  server.register(fastifyStatic, {
    root: path.join(__dirname, "../../public"),
    prefix: "/",
  });

  server.register(pingRoutes);

  return server;
}
