import { defineConfig } from "tsup";

// O @baruk/shared é publicado como .ts cru (consumido direto pelo Vite nos
// fronts), então entra no bundle da API em vez de ser um require em runtime.
export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs"],
  outDir: "dist",
  clean: true,
  noExternal: ["@baruk/shared"],
});
