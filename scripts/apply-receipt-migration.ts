import { Pool } from "pg";
import { config } from "dotenv";

config();

async function applyMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const migrationSQL = `
-- CreateTable
CREATE TABLE IF NOT EXISTS "Receipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concept" TEXT NOT NULL,
    "notes" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReceiptSequence" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiptSequence_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Receipt_quoteId_idx" ON "Receipt"("quoteId");

-- AddForeignKey (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Receipt_quoteId_fkey'
    ) THEN
        ALTER TABLE "Receipt" 
        ADD CONSTRAINT "Receipt_quoteId_fkey" 
        FOREIGN KEY ("quoteId") 
        REFERENCES "Quote"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;
  `;

  try {
    console.log("Applying migration...");
    await pool.query(migrationSQL);
    console.log("✅ Migration applied successfully!");
  } catch (error) {
    console.error("❌ Error applying migration:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

applyMigration()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
