/*
  Warnings:

  - Added the required column `createdById` to the `InstitutionInvite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."InstitutionInvite" ADD COLUMN     "createdById" TEXT NOT NULL;
