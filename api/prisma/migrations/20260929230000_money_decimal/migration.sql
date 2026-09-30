-- Preserve existing values to two decimal places while avoiding floating-point money.
ALTER TABLE "Product"
  ALTER COLUMN "price" TYPE DECIMAL(10, 2) USING ROUND("price"::numeric, 2);

ALTER TABLE "Extra"
  ALTER COLUMN "price" TYPE DECIMAL(10, 2) USING ROUND("price"::numeric, 2);

ALTER TABLE "Promo"
  ALTER COLUMN "price" TYPE DECIMAL(10, 2) USING ROUND("price"::numeric, 2);

ALTER TABLE "Order"
  ALTER COLUMN "total" TYPE DECIMAL(10, 2) USING ROUND("total"::numeric, 2);

ALTER TABLE "OrderItem"
  ALTER COLUMN "unitPrice" TYPE DECIMAL(10, 2) USING ROUND("unitPrice"::numeric, 2);