-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
