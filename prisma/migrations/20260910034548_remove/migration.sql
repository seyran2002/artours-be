-- AlterEnum
ALTER TYPE "BookingType" ADD VALUE 'LOCATION';

-- DropForeignKey
ALTER TABLE "_TagToTransfer" DROP CONSTRAINT "_TagToTransfer_A_fkey";

-- DropForeignKey
ALTER TABLE "_TagToTransfer" DROP CONSTRAINT "_TagToTransfer_B_fkey";

-- AddForeignKey
ALTER TABLE "_TagToTransfer" ADD CONSTRAINT "_TagToTransfer_A_fkey" FOREIGN KEY ("A") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTransfer" ADD CONSTRAINT "_TagToTransfer_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
