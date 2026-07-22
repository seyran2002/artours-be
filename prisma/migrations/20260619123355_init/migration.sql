-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "enTitle" TEXT NOT NULL,
    "ruTitle" TEXT NOT NULL,
    "enDescription" TEXT,
    "ruDescription" TEXT,
    "enLongDescription" TEXT,
    "ruLongDescription" TEXT,
    "mainImage" TEXT,
    "images" TEXT[],
    "distanceFromYerevan" INTEGER,
    "minimumPrice" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_slug_key" ON "Transfer"("slug");
