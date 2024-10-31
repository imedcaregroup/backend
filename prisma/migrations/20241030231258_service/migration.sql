-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);
