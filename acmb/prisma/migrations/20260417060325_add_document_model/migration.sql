/*
  Warnings:

  - You are about to drop the column `approvedBy` on the `AcademicResource` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `AcademicResource` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `AcademicResource` table. All the data in the column will be lost.
  - You are about to drop the column `institution` on the `AcademicResource` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `AcademicResource` table. All the data in the column will be lost.
  - You are about to drop the column `unitName` on the `AcademicResource` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedAt` on the `AcademicResource` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `AcademicResource` table. All the data in the column will be lost.
  - Added the required column `institutionId` to the `AcademicResource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `AcademicResource` table without a default value. This is not possible if the table is not empty.
  - Made the column `fileUrl` on table `AcademicResource` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."ProcessingStatus" AS ENUM ('QUEUED', 'EXTRACTING', 'MODERATING', 'CLASSIFYING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "public"."AcademicResource" DROP COLUMN "approvedBy",
DROP COLUMN "deletedAt",
DROP COLUMN "description",
DROP COLUMN "institution",
DROP COLUMN "semester",
DROP COLUMN "unitName",
DROP COLUMN "uploadedAt",
DROP COLUMN "year",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "institutionId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "fileUrl" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."AcademicResourceProcessing" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "status" "public"."ProcessingStatus" NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicResourceProcessing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AcademicResourceExtraction" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicResourceExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AcademicResourceModeration" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "isAcademic" BOOLEAN NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "flaggedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicResourceModeration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicResourceProcessing_resourceId_key" ON "public"."AcademicResourceProcessing"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicResourceExtraction_resourceId_key" ON "public"."AcademicResourceExtraction"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicResourceModeration_resourceId_key" ON "public"."AcademicResourceModeration"("resourceId");

-- AddForeignKey
ALTER TABLE "public"."AcademicResourceProcessing" ADD CONSTRAINT "AcademicResourceProcessing_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."AcademicResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AcademicResourceExtraction" ADD CONSTRAINT "AcademicResourceExtraction_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."AcademicResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AcademicResourceModeration" ADD CONSTRAINT "AcademicResourceModeration_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."AcademicResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
