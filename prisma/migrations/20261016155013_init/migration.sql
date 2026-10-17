-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('REVIEWING', 'ACTIVE');

-- CreateTable
CREATE TABLE "Comments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'REVIEWING',
    "originalText" TEXT NOT NULL,
    "ruText" TEXT,
    "hyText" TEXT,
    "enText" TEXT,
    "rating" INTEGER NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comments_status_idx" ON "Comments"("status");
