import { z } from "zod";

const MIN_ADMIN_KEY_LENGTH = 32;
const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:5174"];

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGINS: z.string().default(""),
  ADMIN_API_KEY: z.string().optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

export type AppConfig = {
  port: number;
  isProduction: boolean;
  corsOrigins: string[];
  /** Só definida quando é forte o bastante; ausente desliga as rotas administrativas (503). */
  adminApiKey: string | null;
  trustProxy: number;
  warnings: string[];
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Variáveis de ambiente inválidas: ${fields}`);
  }

  const { NODE_ENV, PORT, CORS_ORIGINS, ADMIN_API_KEY, TRUST_PROXY } = parsed.data;
  const isProduction = NODE_ENV === "production";
  const configuredOrigins = CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);
  const adminApiKey = ADMIN_API_KEY && ADMIN_API_KEY.length >= MIN_ADMIN_KEY_LENGTH ? ADMIN_API_KEY : null;

  const warnings: string[] = [];
  if (isProduction && configuredOrigins.length === 0) {
    warnings.push("CORS_ORIGINS vazio em produção: nenhum navegador conseguirá chamar a API. Configure os domínios do web e do admin.");
  }
  if (!adminApiKey) {
    warnings.push(`ADMIN_API_KEY ausente ou com menos de ${MIN_ADMIN_KEY_LENGTH} caracteres: as rotas administrativas responderão 503.`);
  }

  return {
    port: PORT,
    isProduction,
    corsOrigins: configuredOrigins.length > 0 ? configuredOrigins : isProduction ? [] : DEV_ORIGINS,
    adminApiKey,
    trustProxy: TRUST_PROXY,
    warnings,
  };
}
