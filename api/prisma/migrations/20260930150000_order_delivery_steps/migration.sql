-- Etapas avisadas ao cliente no WhatsApp: Confirmado e Saiu para entrega.
ALTER TYPE "OrderStatus" ADD VALUE 'CONFIRMED' AFTER 'RECEIVED';
ALTER TYPE "OrderStatus" ADD VALUE 'OUT_FOR_DELIVERY' AFTER 'PREPARING';

-- Telefone do cliente para os avisos (nulo nos pedidos já existentes).
ALTER TABLE "Order" ADD COLUMN "customerPhone" TEXT;
