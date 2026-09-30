# Baruk Pizzaria & Esfiharia — Cardápio Digital (Full-stack)

Monorepo com backend (API) e dois frontends em React: o cardápio do cliente e o
painel do lojista. Os dois consomem a mesma API, então uma mudança de preço no
painel aparece no cardápio na hora.

## Estrutura

```
apps/
  web/      -> React (Vite) — cardápio do cliente, carrinho, checkout WhatsApp
  admin/    -> React (Vite) — painel do lojista: categorias, produtos, extras
api/        -> Node + Express + Prisma — API REST + banco PostgreSQL
packages/
  shared/   -> tipos e cálculo de preço usados pelos dois frontends
```

Por que separado assim:
- `packages/shared` existe para que a lógica de "quanto custa esse item com esses
  adicionais" só exista em um lugar. Sem isso, web e admin acabam com contas
  duplicadas que um dia ficam diferentes uma da outra.
- `admin` é um app à parte (não uma tela dentro do `web`) porque tem outro
  público (o lojista) e outra necessidade de autenticação — crescer um não
  força mudança no outro.
- A API não sabe nada de React; ela só expõe dados. Isso permite trocar o
  frontend no futuro (ex.: um app mobile) sem tocar no backend.

## Arquitetura da API

A API segue SOLID em camadas, organizada por módulo:

```
api/src/
  server.ts          -> lê a config, monta o container e sobe o servidor
  app.ts             -> createApp(deps): só conecta middlewares e rotas recebidos
  container.ts       -> composition root: Prisma → repositórios → services
  config/env.ts      -> variáveis de ambiente validadas com zod
  core/              -> erros de domínio, dinheiro, helpers de validação (sem Express/Prisma)
  http/              -> Express: auth admin, CORS, rate limit, error handler
  infra/prisma/      -> PrismaClient e tradução dos erros do Prisma
  modules/<módulo>/
    *.schemas.ts     -> valida e normaliza a entrada (zod)
    *.repository.ts  -> interface + implementação Prisma (converte Decimal → number)
    *.service.ts     -> regras de negócio; depende só das interfaces
    *.routes.ts      -> controller fino: parse → service → resposta
  test-support/      -> repositórios em memória e app de teste
```

Regras para código novo:
- **Rotas não têm regra de negócio** e **services não conhecem Express nem Prisma**.
  Um service recebe os repositórios pelo construtor (inversão de dependência).
- Erros de negócio são lançados como `ValidationError`, `NotFoundError`,
  `ConflictError`... (`core/errors.ts`); só o `http/error-handler.ts` os
  transforma em status HTTP.
- Um módulo novo = schemas + repository + service + routes, registrado no
  `container.ts` e no `app.ts`.
- Testes usam `createTestApp()` com repositórios em memória — sem banco e sem `vi.mock`.

## Arquitetura dos fronts (web e admin)

Mesma separação de responsabilidades da API:

```
apps/<app>/src/
  config/env.ts   -> único lugar que lê variáveis VITE_*
  api/            -> um gateway por recurso (products-api, orders-api...) sobre o
                     createHttpClient do @baruk/shared
  domain/         -> regras puras, sem React (carrinho, cardápio, mensagem do
                     WhatsApp, validação de formulário) — é aqui que ficam os testes
  hooks/          -> orquestram domínio + api + estado (useCheckout, useProducts...)
  context/        -> estado compartilhado (web: carrinho via useReducer)
  components/     -> apresentação: recebem dados e callbacks por props
  pages/          -> compõem componentes e hooks de uma tela
```

Regras para código novo:
- **Componentes não chamam `fetch` nem contêm regra de negócio**: usam um hook,
  e o hook usa `domain/` e `api/`.
- Conta de dinheiro sempre em centavos, com as funções do `@baruk/shared`
  (`unitPriceCents`, `toCents`, `isValidPrice`) — as mesmas que a API usa.
- Erros da API chegam como `ApiError` (mensagem pronta para exibir); use
  `errorMessage(cause, textoPadrão)` nos `catch`.
- `packages/shared` guarda o que front e API precisam concordar: tipos, preço,
  regras do cardápio e o cliente HTTP.

## Rodando localmente

Pré-requisitos: Node 18+, PostgreSQL rodando (local ou um serviço como Neon/Railway).

```bash
npm install

# configure a connection string do banco
cp api/.env.example api/.env
# edite api/.env com DATABASE_URL e uma ADMIN_API_KEY aleatória e forte

npm run prisma:migrate --workspace api  # cria/atualiza as tabelas
npm run db:seed        # insere os sabores/preços atuais
npm run dev:api        # http://localhost:3001
npm run dev:web        # http://localhost:5173  (cardápio do cliente)
npm run dev:admin      # http://localhost:5174  (painel do lojista)
```

## Antes de publicar

- Em `apps/web/.env` (crie a partir de `.env.example`), defina `VITE_WHATSAPP_NUMBER`
  com o número real da pizzaria (DDI+DDD+número, só dígitos).
- Em produção, configure `DATABASE_URL`, `ADMIN_API_KEY`, `CORS_ORIGINS` e `PORT`
  no ambiente do servidor. Use HTTPS e uma chave administrativa aleatória, longa,
  exclusiva e nunca incluída no bundle do frontend.
- A tela do admin solicita a chave administrativa. Ela protege as rotas de
  produtos, adicionais e leitura de pedidos. Rotacione a chave se houver suspeita
  de exposição.
- Preços de produtos/adicionais aceitam de R$ 0,01 a R$ 9.999,99, em centavos.
  O servidor recalcula o valor dos pedidos usando os preços atuais no banco; o
  payload do navegador contém apenas IDs de produtos/opções e quantidades.
- Aplique migrações no deploy com `npm run prisma:deploy --workspace api`; o seed
  é uma operação separada e transacional.
- Em produção **sem `CORS_ORIGINS`** a API bloqueia todos os navegadores (a API
  avisa no log ao subir). Liste os domínios do web e do admin separados por vírgula.
- `POST /api/orders` e `POST /api/admin/session` têm limite de 10 requisições a
  cada 15 min por IP. Atrás de proxy (Railway/Render) defina `TRUST_PROXY=1`.
- O build da API (`npm run build --workspace api`) usa tsup e embute o
  `@baruk/shared` no `dist/server.js`.

## Regras de negócio compartilhadas

`packages/shared` concentra o que o cardápio e a API precisam concordar:
- `unitPriceCents` — preço em centavos (produto + adicionais + bebida). O
  cardápio mostra e a API cobra com a mesma função.
- `isDrinkCategory` — a categoria com slug `bebidas`. O slug de categoria não é
  editável pela API, então renomear a categoria não quebra a regra.
- `weekdayInSaoPaulo` — dia da semana no fuso da pizzaria. Promoções com preço só
  são aceitas no próprio dia.

## Rotas da API

| Rota | Acesso |
|---|---|
| `GET /api/menu` | público |
| `POST /api/orders` | público (rate limit) |
| `GET /api/orders` | admin |
| `/api/products` | admin |
| `GET /api/extras`, `GET /api/promos` | público |
| `POST/PUT/DELETE /api/extras`, `/api/promos` | admin |
| `/api/categories` | admin |

Admin = header `x-admin-key` com o valor de `ADMIN_API_KEY`.

## Testes

```bash
npm test   # vitest em todos os workspaces (a API usa repositórios em memória, não precisa de banco)
```

## Deploy sugerido

- **API**: Railway ou Render (sobem Node + Postgres juntos com pouca configuração).
- **web** e **admin**: Vercel ou Netlify, um projeto para cada, apontando para
  `apps/web` e `apps/admin`.

## Próximos passos naturais

- Guardar os pedidos (`/api/orders`) num painel de "pedidos do dia" no admin,
  em vez de só mandar pro WhatsApp.
- Upload de foto por sabor (hoje os cards usam um desenho genérico).
