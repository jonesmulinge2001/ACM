-- AlterTable
ALTER TABLE "UserSuspension" ADD COLUMN     "restoredBy" TEXT;

-- AddForeignKey
ALTER TABLE "UserSuspension" ADD CONSTRAINT "UserSuspension_restoredBy_fkey" FOREIGN KEY ("restoredBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
