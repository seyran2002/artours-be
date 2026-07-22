-- CreateTable
CREATE TABLE "_TagToTransfer" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TagToTransfer_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TagToTransfer_B_index" ON "_TagToTransfer"("B");

-- AddForeignKey
ALTER TABLE "_TagToTransfer" ADD CONSTRAINT "_TagToTransfer_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTransfer" ADD CONSTRAINT "_TagToTransfer_B_fkey" FOREIGN KEY ("B") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
