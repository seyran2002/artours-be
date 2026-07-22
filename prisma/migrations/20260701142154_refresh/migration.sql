-- CreateTable
CREATE TABLE "Tour" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "enTitle" TEXT NOT NULL,
    "ruTitle" TEXT NOT NULL,
    "enDescription" TEXT NOT NULL,
    "ruDescription" TEXT NOT NULL,
    "mainImage" TEXT NOT NULL,
    "images" TEXT[],
    "minimumPrice" INTEGER NOT NULL,
    "duration" TEXT,
    "routePolyline" TEXT,
    "entranceFees" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourTransfer" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TourTransfer_tourId_idx" ON "TourTransfer"("tourId");

-- CreateIndex
CREATE INDEX "TourTransfer_tourId_order_idx" ON "TourTransfer"("tourId", "order");

-- CreateIndex
CREATE INDEX "TourTransfer_transferId_idx" ON "TourTransfer"("transferId");

-- CreateIndex
CREATE UNIQUE INDEX "TourTransfer_tourId_transferId_key" ON "TourTransfer"("tourId", "transferId");

-- AddForeignKey
ALTER TABLE "TourTransfer" ADD CONSTRAINT "TourTransfer_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourTransfer" ADD CONSTRAINT "TourTransfer_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
