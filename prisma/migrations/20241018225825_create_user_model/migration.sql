-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "mobileNumber" TEXT,
    "otp" INTEGER,
    "name" TEXT,
    "surName" TEXT,
    "pytroNym" TEXT,
    "pin" TEXT,
    "dob" TIMESTAMP(3),
    "city" TEXT,
    "district" TEXT,
    "address" TEXT,
    "authProvider" TEXT NOT NULL,
    "googleId" TEXT,
    "notificationEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
