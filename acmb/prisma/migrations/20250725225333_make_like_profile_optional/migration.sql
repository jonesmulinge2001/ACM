-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_profileId_fkey";

-- AlterTable
ALTER TABLE "Like" ALTER COLUMN "profileId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
