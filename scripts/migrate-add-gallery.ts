import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log('Aplicando ALTER TABLE para agregar columna "gallery" en "Product"...');
  // Postgres: agregar columna si no existe
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Product"
    ADD COLUMN IF NOT EXISTS "gallery" text[] DEFAULT '{}'
  `);
  console.log('Columna "gallery" verificada/creada.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


