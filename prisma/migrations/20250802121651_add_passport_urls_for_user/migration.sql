-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passportUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
