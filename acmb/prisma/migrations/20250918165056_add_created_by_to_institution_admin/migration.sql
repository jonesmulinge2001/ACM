/*
  Warnings:

  - Added the required column `createdById` to the `InstitutionAdmin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."InstitutionAdmin" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."InstitutionAdmin" ADD CONSTRAINT "InstitutionAdmin_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
