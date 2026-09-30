import "dotenv/config";
import { createApp } from "./app";
import { loadConfig } from "./config/env";
import { createPrismaHealthCheck, createPrismaRepositories, createServices } from "./container";
import { prisma } from "./infra/prisma/client";

const config = loadConfig();
for (const warning of config.warnings) console.warn(`[config] ${warning}`);

const app = createApp({
  config,
  services: createServices(createPrismaRepositories(prisma)),
  checkDatabase: createPrismaHealthCheck(prisma),
});

app.listen(config.port, () => {
  console.log(`API rodando em http://localhost:${config.port}`);
});
