-- Gerenciamento de pedidos: número sequencial, status e histórico de conclusão.
CREATE TYPE "OrderStatus" AS ENUM ('RECEIVED', 'PREPARING', 'COMPLETED');

-- SERIAL numera também os pedidos já existentes, na ordem física da tabela.
ALTER TABLE "Order"
  ADD COLUMN "number" SERIAL NOT NULL,
  ADD COLUMN "status" "OrderStatus" NOT NULL DEFAULT 'RECEIVED',
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "Order_completedAt_idx" ON "Order"("completedAt");
