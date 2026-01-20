import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Cargar variables de entorno
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});
