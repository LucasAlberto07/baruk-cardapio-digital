# Banco de dados

PostgreSQL (hospedado no **Neon** em desenvolvimento), acessado pelo Prisma 5.
Schema em [`api/prisma/schema.prisma`](../api/prisma/schema.prisma).

## Modelo

```mermaid
erDiagram
  Category ||--o{ Product : contem
  Order ||--|{ OrderItem : possui

  Category {
    string id PK "cuid"
    string name UK
    string slug UK "imutável pela API"
    int sortOrder
  }
  Product {
    string id PK
    string name "único por categoria"
    string description
    decimal price "10,2"
    boolean active
    string categoryId FK
    datetime createdAt
    datetime updatedAt
  }
  Extra {
    string id PK
    string name UK
    decimal price "10,2"
  }
  Promo {
    string id PK
    int weekday "0 = domingo … 6 = sábado"
    string label
    string title
    string description
    decimal price "nulo = informativa"
    string note
  }
  Order {
    string id PK
    int number UK "SERIAL, exibido como #0042"
    OrderStatus status
    string customerName
    string customerPhone "5511912345678; nulo em pedidos antigos"
    string address
    string notes
    decimal total "10,2"
    datetime createdAt
    datetime updatedAt
    datetime completedAt
  }
  OrderItem {
    string id PK
    string orderId FK "ON DELETE CASCADE"
    string label "rótulo congelado no momento do pedido"
    int qty
    decimal unitPrice "10,2, congelado"
  }
```

`OrderStatus`: `RECEIVED`, `CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `COMPLETED`.

Índices extras em `Order`: `(status, createdAt)` para a fila e `(completedAt)`
para o histórico.

## Convenções

- **Dinheiro** é `DECIMAL(10,2)` no banco. Os repositórios convertem para
  `number` (`core/money.ts`) e todo cálculo é feito em centavos.
- **`OrderItem` não referencia `Product`** de propósito: guarda o rótulo e o preço
  do momento do pedido. Alterar ou excluir um produto não muda pedidos antigos.
- **`Order.number`** vem de uma sequência (`SERIAL`); pode ter lacunas se uma
  transação falhar.
- **Ids** são `cuid()` gerados pelo Prisma.

## Migrações

Ficam em `api/prisma/migrations/`, aplicadas em ordem:

| Migração | O que faz |
|---|---|
| `20260928223114_init` | Tabelas iniciais (preços como `DOUBLE PRECISION`) |
| `20260929230000_money_decimal` | Converte todos os valores monetários para `DECIMAL(10,2)` (arredondando para 2 casas) |
| `20260930120000_order_management` | Enum `OrderStatus`; `number`, `status`, `updatedAt`, `completedAt` e índices em `Order` |
| `20260930150000_order_delivery_steps` | Etapas `CONFIRMED` e `OUT_FOR_DELIVERY`; coluna `customerPhone` |

Como criar e aplicar migrações com segurança está em
[DESENVOLVIMENTO](DESENVOLVIMENTO.md#migrações-leia-antes).

## Seed

`npm run db:seed` executa [`api/prisma/seed.ts`](../api/prisma/seed.ts) numa
transação:

- 4 categorias: Tradicionais, Especiais, Doces, Bebidas;
- 32 produtos (sabores e refrigerantes) e 13 adicionais — por `upsert`: roda de
  novo sem duplicar e **restaura os preços do seed**;
- 7 promoções, uma por dia da semana — **apaga e recria** todas as promoções.

Não mexe em pedidos. Atenção: rodar o seed em produção desfaz preços alterados
pelo painel.
