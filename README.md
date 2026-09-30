# Baruk Pizzaria & Esfiharia — Cardápio Digital

Sistema de pedidos online da Baruk: o cliente monta o pedido no **cardápio web**, o
pedido é registrado na **API** e enviado para o WhatsApp da loja, e o lojista
acompanha tudo no **painel admin** — fila de pedidos, etapas (Confirmado → Em
preparo → Saiu para entrega → Concluído), avisos ao cliente pelo WhatsApp e
edição de preços do cardápio.

## Stack

| Parte | Tecnologia |
|---|---|
| API | Node.js, Express 4, Prisma 5, PostgreSQL (Neon), zod, TypeScript |
| Cardápio (`apps/web`) | React 18 + Vite 5, TypeScript |
| Painel (`apps/admin`) | React 18 + Vite 5, TypeScript |
| Código compartilhado (`packages/shared`) | TypeScript puro (tipos, preço, regras, cliente HTTP) |
| Testes | Vitest (+ Supertest na API) — 103 testes, sem precisar de banco |

## Estrutura do monorepo

```
api/                -> API REST (camadas: routes → service → repository)
apps/web/           -> cardápio do cliente, carrinho e checkout
apps/admin/         -> painel do lojista: pedidos e cardápio
packages/shared/    -> regras e tipos usados pela API e pelos dois fronts
docs/               -> documentação técnica (comece por aqui)
```

## Início rápido

Pré-requisitos: Node.js 20+ e um banco PostgreSQL.

```bash
npm install
cp api/.env.example api/.env          # preencha DATABASE_URL e ADMIN_API_KEY
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env

npm run prisma:deploy --workspace api # aplica as migrações existentes
npm run db:seed                       # cardápio inicial (categorias, sabores, promoções)

npm run dev:api     # http://localhost:3001
npm run dev:web     # http://localhost:5173  (cardápio)
npm run dev:admin   # http://localhost:5174  (painel — pede a ADMIN_API_KEY)

npm test            # todos os testes
```

Detalhes, variáveis de ambiente e cuidados com o banco em
[docs/DESENVOLVIMENTO.md](docs/DESENVOLVIMENTO.md).

## Documentação

| Documento | Conteúdo |
|---|---|
| [ARQUITETURA](docs/ARQUITETURA.md) | Visão geral, camadas, fluxo de um pedido, decisões de design |
| [REGRAS DE NEGÓCIO](docs/REGRAS-DE-NEGOCIO.md) | Preço, promoções, bebidas, etapas do pedido, telefone, WhatsApp |
| [API](docs/API.md) | Todas as rotas, autenticação, formatos de requisição/resposta e erros |
| [BANCO DE DADOS](docs/BANCO-DE-DADOS.md) | Modelos, migrações, seed e convenções de dados |
| [FRONTENDS](docs/FRONTENDS.md) | Estrutura e fluxos do cardápio e do painel |
| [DESENVOLVIMENTO](docs/DESENVOLVIMENTO.md) | Setup, scripts, testes, migrações, convenções de código e deploy |
| [ESTADO ATUAL](docs/ESTADO-ATUAL.md) | O que está pronto, limitações conhecidas e próximos passos |
