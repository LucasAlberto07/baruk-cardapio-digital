# Guia de desenvolvimento

## Setup

Pré-requisitos: **Node.js 20+** e um PostgreSQL (local ou Neon).

```bash
npm install                            # instala todos os workspaces
cp api/.env.example api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
```

### `api/.env`

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | Connection string do PostgreSQL (`?sslmode=require` no Neon) |
| `ADMIN_API_KEY` | sim | Chave do painel, **mínimo 32 caracteres**. Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `PORT` | não | Porta da API (padrão 3001) |
| `CORS_ORIGINS` | em produção | Origens do web e do admin separadas por vírgula. Em desenvolvimento, vazio libera `localhost:5173` e `5174` |
| `TRUST_PROXY` | não | Quantos proxies há na frente da API (Railway/Render: `1`) — o rate limit usa o IP real |
| `NODE_ENV` | não | `production` ativa as regras de produção do CORS |

Variáveis inválidas impedem a API de subir (`config/env.ts`). Chave fraca ou
`CORS_ORIGINS` vazio em produção geram avisos no log.

As variáveis dos fronts estão em [FRONTENDS](FRONTENDS.md#variáveis-de-ambiente).

### Banco

```bash
npm run prisma:deploy --workspace api   # aplica as migrações existentes (não apaga nada)
npm run db:seed                         # cardápio inicial
```

## Scripts

| Comando (na raiz) | O que faz |
|---|---|
| `npm run dev:api` | API com recarga automática (`tsx watch`) em `:3001` |
| `npm run dev:web` | Cardápio em `:5173` |
| `npm run dev:admin` | Painel em `:5174` |
| `npm test` | Todos os testes (Vitest) de todos os workspaces |
| `npm run db:seed` | Seed do cardápio |
| `npm run build --workspace <api\|web\|admin>` | Build de produção |
| `npm run typecheck --workspace <api\|web\|admin>` | Checagem de tipos |
| `npm run prisma:deploy --workspace api` | Aplica migrações pendentes |

## Testes

```bash
npm test                          # tudo (103 testes)
npm test --workspace api          # só a API
cd apps/web && npx vitest         # modo watch num app
```

| Onde | O que cobre |
|---|---|
| `packages/shared/src/*.test.ts` | Preço em centavos, fuso de São Paulo, etapas do pedido, telefone, mensagens, cliente HTTP |
| `api/src/**/*.test.ts` | Rotas reais via Supertest com **repositórios em memória** (`test-support/`): pedidos, preços, promoções, etapas, busca, paginação, rate limit, auth, catálogo |
| `apps/web/src/domain/*.test.ts` | Carrinho, edição, organização do cardápio, mensagem do WhatsApp |
| `apps/admin/src/domain/*.test.ts` | Validação de produto, etapas, link de aviso, datas, alerta de pedidos |

Nenhum teste precisa de banco. Componentes React não têm testes automatizados;
as regras que eles usam estão em `domain/` e são testadas lá.

## Migrações (leia antes)

> ⚠️ **Nunca aponte comandos que usam "shadow database" para um banco com dados.**
> `prisma migrate dev`, `migrate reset` e `migrate diff --shadow-database-url`
> **apagam** o banco usado como shadow. Isso já aconteceu neste projeto: o banco
> de desenvolvimento no Neon foi zerado e precisou ser restaurado pelo histórico
> do Neon.

Fluxo seguro para criar uma migração:

1. Altere `api/prisma/schema.prisma`.
2. Gere o SQL **sem banco**, comparando o schema antigo com o novo:

   ```bash
   cd api
   git show HEAD:api/prisma/schema.prisma > /tmp/old-schema.prisma
   npx prisma migrate diff \
     --from-schema-datamodel /tmp/old-schema.prisma \
     --to-schema-datamodel prisma/schema.prisma --script
   ```
3. Crie `prisma/migrations/<AAAAMMDDHHMMSS>_<nome>/migration.sql` com esse SQL
   (revise; ajuste se precisar preservar dados).
4. `npx prisma generate` para atualizar o client (no Windows, pare o
   `dev:api` antes — ele trava o arquivo do engine).
5. Aplique com `npm run prisma:deploy --workspace api`, que só executa migrações
   pendentes e não apaga nada.

`prisma migrate dev` só deve ser usado contra um PostgreSQL **local e
descartável**. Em bancos compartilhados/produção, use sempre `migrate deploy`.
Antes de migrar produção, faça backup (no Neon: crie um branch).

## Convenções de código

- **TypeScript estrito** em todos os workspaces.
- **Arquitetura em camadas** — detalhes e regras em [ARQUITETURA](ARQUITETURA.md).
  Resumo: rotas finas, regras em services/`domain/`, acesso a dados em
  repositórios, erros de domínio traduzidos só no `error-handler`.
- **Regra que front e API precisam concordar vai para `packages/shared`**
  (preço, etapas, telefone, mensagens).
- **Dinheiro em centavos** com `toCents`/`unitPriceCents`; nunca some reais em
  ponto flutuante.
- **Idioma:** código (nomes) em inglês; mensagens ao usuário, comentários e
  documentação em português.
- **Comentários** explicam o *porquê*, não o *o quê*.
- **Toda regra nova vem com teste.**

### Adicionando um módulo na API

1. `api/src/modules/<nome>/` com `<nome>.schemas.ts`, `.repository.ts`
   (interface + `Prisma<Nome>Repository`), `.service.ts` e `.routes.ts`
   (`create<Nome>Router(service, auth)`).
2. Registre o repositório e o service em `container.ts` e o router em `app.ts`.
3. Implemente o repositório em memória em `test-support/in-memory-repositories.ts`
   e escreva os testes com `createTestApp()`.

## Git

- Branch principal: `main`. Mensagens de commit no formato
  `tipo(escopo): descrição` (`feat`, `fix`, `refactor`, `docs`, `chore`).
- `.env` nunca é versionado (está no `.gitignore`); só os `.env.example`.

## Deploy

| Parte | Sugestão | Build | Start |
|---|---|---|---|
| API | Railway ou Render | `npm install && npm run build --workspace api` | `npm run prisma:deploy --workspace api && npm run start --workspace api` |
| Cardápio | Vercel/Netlify (raiz `apps/web`) | `npm run build --workspace web` → `apps/web/dist` | estático |
| Painel | Vercel/Netlify (raiz `apps/admin`) | `npm run build --workspace admin` → `apps/admin/dist` | estático |

Checklist de produção:

- API: `NODE_ENV=production`, `DATABASE_URL`, `ADMIN_API_KEY` **nova** (não
  reaproveite a de desenvolvimento), `CORS_ORIGINS` com os domínios do web e do
  admin, `TRUST_PROXY=1` atrás de proxy, HTTPS.
- Web: `VITE_API_URL` (URL pública da API) e `VITE_WHATSAPP_NUMBER` (número real).
- Admin: `VITE_API_URL`.
- O build da API usa `tsup` e embute o `@baruk/shared` em `dist/server.js`
  (o pacote compartilhado é publicado como `.ts`).
- O rate limit guarda contadores **na memória do processo**: com mais de uma
  instância da API, cada uma conta separado.

## Problemas comuns

| Sintoma | Causa / solução |
|---|---|
| Painel responde "Painel indisponível" (503) | `ADMIN_API_KEY` ausente ou com menos de 32 caracteres |
| `EPERM ... query_engine-windows.dll.node` no `prisma generate` | A API está rodando e trava o arquivo; pare o `dev:api` |
| Navegador: "Origem não permitida" (403) | Origem fora de `CORS_ORIGINS` |
| Cardápio: "Não foi possível carregar o cardápio" | API parada ou `VITE_API_URL` errado |
| `429` ao testar pedidos | Rate limit (10 a cada 15 min por IP); reinicie a API em dev |
