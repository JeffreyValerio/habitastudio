-- Add cost column
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Add temporary price_float column
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "price_float" DOUBLE PRECISION;

-- Convert price from string to float (remove currency symbols and parse)
UPDATE "Product" 
SET "price_float" = CASE 
  WHEN "price" ~ '^[0-9]+\.?[0-9]*$' THEN CAST("price" AS DOUBLE PRECISION)
  WHEN "price" ~ '^[^0-9]*([0-9]+\.?[0-9]*)[^0-9]*$' THEN 
    CAST(REGEXP_REPLACE("price", '[^0-9.]', '', 'g') AS DOUBLE PRECISION)
  ELSE 0
END
WHERE "price_float" IS NULL;

-- Set default for any null values
UPDATE "Product" SET "price_float" = 0 WHERE "price_float" IS NULL;

-- Make price_float NOT NULL
ALTER TABLE "Product" ALTER COLUMN "price_float" SET NOT NULL;

-- Drop old price column
ALTER TABLE "Product" DROP COLUMN "price";

-- Rename price_float to price
ALTER TABLE "Product" RENAME COLUMN "price_float" TO "price";

