import { PrismaClient } from "@prisma/client";

declare global {
  var __db: PrismaClient;
}

if (!global.__db) {
  global.__db = new PrismaClient();
}
