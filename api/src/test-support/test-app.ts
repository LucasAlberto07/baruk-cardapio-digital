import { createApp } from "../app";
import { AppConfig } from "../config/env";
import { createServices } from "../container";
import { createInMemoryRepositories } from "./in-memory-repositories";

export const TEST_ADMIN_KEY = "k".repeat(32);

/** Terça-feira, 29/09/2026 às 12h em São Paulo. */
export const TUESDAY_NOON = new Date("2026-09-29T15:00:00Z");
export const TUESDAY = 2;

const testConfig: AppConfig = {
  port: 0,
  isProduction: false,
  corsOrigins: [],
  adminApiKey: TEST_ADMIN_KEY,
  trustProxy: 0,
  warnings: [],
};

/** App completo (rotas + services reais) sobre repositórios em memória e relógio fixo. */
export function createTestApp(overrides: Partial<AppConfig> = {}) {
  const repositories = createInMemoryRepositories();
  const app = createApp({
    config: { ...testConfig, ...overrides },
    services: createServices(repositories, () => TUESDAY_NOON),
    checkDatabase: async () => {},
  });
  return { app, repositories };
}
