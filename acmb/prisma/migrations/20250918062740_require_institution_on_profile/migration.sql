/*
  Warnings:

  - You are about to drop the column `institution` on the `Profile` table. All the data in the column will be lost.
  - Made the column `institutionId` on table `Profile` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Profile" DROP CONSTRAINT "Profile_institutionId_fkey";

-- DropIndex
DROP INDEX "public"."Profile_institution_idx";

-- AlterTable
ALTER TABLE "public"."Profile" DROP COLUMN "institution",
ALTER COLUMN "institutionId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Profile_institutionId_idx" ON "public"."Profile"("institutionId");

-- AddForeignKey
ALTER TABLE "public"."Profile" ADD CONSTRAINT "Profile_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "public"."Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
