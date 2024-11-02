-- CreateTable
CREATE TABLE "Medical" (
    "id" SERIAL NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "Medical_pkey" PRIMARY KEY ("id")
);
