# API REST

Base local: `http://localhost:3001`. Corpo e respostas em JSON (limite de 64 KB).
Valores monetários são números em reais com até duas casas (`79.99`); datas em
ISO 8601 (UTC).

## Convenções

- **Autenticação administrativa:** header `x-admin-key: <ADMIN_API_KEY>`.
  Sem chave configurada no servidor → `503`; chave errada/ausente → `401`.
- **Erros:** sempre `{ "error": "mensagem em português" }`.

  | Status | Quando |
  |---|---|
  | 400 | Validação (`ValidationError`), JSON malformado |
  | 401 | Chave administrativa inválida |
  | 403 | Origem não permitida pelo CORS |
  | 404 | Registro não encontrado |
  | 409 | Conflito (registro duplicado, status que não pode voltar, categoria com produtos) |
  | 429 | Limite de requisições (pedidos e login do painel) |
  | 503 | Painel desativado (`ADMIN_API_KEY` ausente ou fraca) |

- **Cache:** toda a `/api` responde `Cache-Control: no-store`.
- **CORS:** só as origens de `CORS_ORIGINS`; requisições sem `Origin` (curl,
  health check) passam.

## Resumo das rotas

| Método | Rota | Acesso |
|---|---|---|
| GET | `/health` | público |
| GET | `/ready` | público |
| POST | `/api/admin/session` | público (rate limit) |
| GET | `/api/menu` | público |
| POST | `/api/orders` | público (rate limit) |
| GET | `/api/orders` | admin |
| GET | `/api/orders/:id` | admin |
| PATCH | `/api/orders/:id/status` | admin |
| GET/POST | `/api/products` | admin |
| PUT/DELETE | `/api/products/:id` | admin |
| GET/POST | `/api/categories` | admin |
| PUT/DELETE | `/api/categories/:id` | admin |
| GET | `/api/extras` | público |
| POST, PUT/DELETE `/:id` | `/api/extras` | admin |
| GET | `/api/promos` | público |
| POST, PUT/DELETE `/:id` | `/api/promos` | admin |

---

## Saúde

**`GET /health`** → `200 { "ok": true }` (processo no ar).
**`GET /ready`** → `200 { "ok": true, "database": "available" }` (executa `SELECT 1`).

## Sessão do painel

**`POST /api/admin/session`** — confere a chave digitada no login.

```json
{ "key": "..." }
```

`204` chave correta · `401` incorreta · `503` painel desativado · `429` excesso de tentativas
(10 a cada 15 min por IP).

## Cardápio

**`GET /api/menu`** — tudo o que o cardápio precisa em uma chamada.

```json
{
  "categories": [{ "id": "…", "name": "Tradicionais", "slug": "tradicionais", "sortOrder": 1 }],
  "products":   [{ "id": "…", "name": "Calabresa", "description": "…", "price": 50, "active": true,
                   "categoryId": "…", "createdAt": "…", "updatedAt": "…" }],
  "extras":     [{ "id": "…", "name": "Alho", "price": 6 }],
  "promos":     [{ "id": "…", "weekday": 1, "label": "Segunda", "title": "Combo Baruk",
                   "description": "…", "price": 60, "note": null }]
}
```

Categorias por `sortOrder`, **somente produtos ativos** (por nome), adicionais por
preço, promoções por dia da semana.

## Pedidos

### `POST /api/orders` — registrar pedido (público)

```json
{
  "customerName": "Ana Souza",
  "customerPhone": "(11) 91234-5678",
  "address": "Rua A, 1 — Centro",
  "notes": "sem cebola",
  "items": [
    { "productId": "<Calabresa>", "qty": 2, "slice": "8 fatias", "extraIds": ["<Alho>"], "drinkProductId": "<Sprite 2L>" }
  ]
}
```

Formatos de item:

| Item | Exemplo |
|---|---|
| Pizza | `{ "productId": "…", "qty": 2, "slice": "8 fatias", "extraIds": ["…"], "drinkProductId": "…" }` — `slice`, `extraIds` (até 10, sem repetir) e `drinkProductId` são opcionais |
| Bebida avulsa | `{ "productId": "<id de uma bebida>", "qty": 1 }` |
| Promoção do dia | `{ "promoId": "…", "qty": 1 }` |
- Preços e rótulos são **calculados no servidor**. Regras completas em
  [REGRAS-DE-NEGOCIO](REGRAS-DE-NEGOCIO.md#pedido).

`201` — o pedido registrado (mesmo formato de `GET /api/orders/:id`). Com
Calabresa R$ 50 + Alho R$ 6 + Sprite 2L R$ 14 = R$ 70 por unidade:

```json
{
  "id": "cm…", "number": 42, "status": "RECEIVED",
  "customerName": "Ana Souza", "customerPhone": "5511912345678",
  "address": "Rua A, 1 — Centro", "notes": "sem cebola", "total": 140,
  "createdAt": "…", "updatedAt": "…", "completedAt": null,
  "items": [{ "id": "…", "orderId": "cm…", "label": "Pizza Calabresa (8 fatias) + Alho + Sprite 2L",
              "qty": 2, "unitPrice": 70 }]
}
```

Erros comuns (`400`): "Pedido inválido: informe cliente, endereço e de 1 a 30
itens.", "Informe um telefone válido com DDD, ex.: (11) 91234-5678.", "Um ou mais
itens do pedido são inválidos.", "O cardápio mudou ou contém uma opção
indisponível…", "Essa promoção não está disponível hoje.", "Uma ou mais
combinações de adicionais/bebidas são inválidas.". Limite: `429` após 10 pedidos
em 15 min por IP.

### `GET /api/orders` — fila e histórico (admin)

| Query | Valores | Padrão |
|---|---|---|
| `view` | `open` (não concluídos, mais antigos primeiro) ou `history` (concluídos, mais recentes primeiro) | `open` |
| `search` | `#0042`, `0042` ou `42` busca pelo número; outro texto busca no nome do cliente (sem diferenciar maiúsculas) | — |
| `page` | ≥ 1 | 1 |
| `pageSize` | 1–50 | 20 |

```json
{ "items": [ /* pedidos */ ], "total": 3, "page": 1, "pageSize": 20, "latestOrderNumber": 42 }
```

`latestOrderNumber` é o maior número de pedido já criado: o painel compara entre
consultas para detectar pedidos novos.

### `GET /api/orders/:id` — detalhes (admin)

`200` pedido · `404` "Pedido não encontrado."

### `PATCH /api/orders/:id/status` — avançar etapa (admin)

```json
{ "status": "CONFIRMED" }
```

Valores: `RECEIVED`, `CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `COMPLETED`.
`200` pedido atualizado (com `completedAt` ao concluir) · `400` status inválido ·
`404` · `409` ao tentar voltar ou repetir a etapa:
`O pedido #0001 está "Concluído" e não pode passar para "Em preparo".`

## Produtos (admin)

- **`GET /api/products`** — todos (inclusive inativos), com `category`.
- **`POST /api/products`**

  ```json
  { "name": "Calabresa", "description": "…", "price": 50, "categoryId": "…" }
  ```
  ou `"categoryName": "Tradicionais"` no lugar de `categoryId` (cria a categoria se
  não existir). `201` produto.
- **`PUT /api/products/:id`** — parcial: `name`, `description`, `price`, `active`.
- **`DELETE /api/products/:id`** — `204`. Pedidos antigos não são afetados (o item
  do pedido guarda o rótulo e o preço da época).

## Categorias (admin)

- **`GET /api/categories`** — com `_count.products`.
- **`POST /api/categories`** — `{ "name": "Doces", "sortOrder": 3 }` (`sortOrder`
  opcional, 0–9999, padrão 999). Slug gerado do nome.
- **`PUT /api/categories/:id`** — `name` e/ou `sortOrder`. Enviar `slug` → `400`.
- **`DELETE /api/categories/:id`** — `204`; `409` se houver produtos.

## Adicionais

- **`GET /api/extras`** (público) — por preço.
- **`POST /api/extras`** — `{ "name": "Bacon", "price": 10 }`.
- **`PUT /api/extras/:id`** — `name` e/ou `price`. **`DELETE /api/extras/:id`** — `204`.

## Promoções

- **`GET /api/promos`** (público) — por dia da semana.
- **`POST /api/promos`**

  ```json
  { "weekday": 1, "label": "Segunda", "title": "Combo Baruk", "description": "…", "price": 60, "note": null }
  ```
  Obrigatórios: `weekday` (0–6), `label` (≤ 40), `title` (≤ 100), `description`
  (≤ 500). Opcionais: `price` (ou `null` = promoção informativa), `note` (≤ 200).
- **`PUT /api/promos/:id`** — qualquer subconjunto dos campos. **`DELETE`** — `204`.

## Exemplos com curl

```bash
KEY="sua-admin-api-key"

curl localhost:3001/api/menu
curl "localhost:3001/api/orders?view=open" -H "x-admin-key: $KEY"
curl -X PATCH localhost:3001/api/orders/<id>/status \
  -H "x-admin-key: $KEY" -H "content-type: application/json" \
  -d '{"status":"CONFIRMED"}'
```
