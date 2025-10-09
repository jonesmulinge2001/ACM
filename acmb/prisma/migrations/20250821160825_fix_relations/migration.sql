-- CreateEnum
CREATE TYPE "public"."ResourceAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE_SOFT', 'DELETE_HARD', 'RESTORE', 'FLAG', 'FLAG_REVIEWED', 'APPROVE', 'UNPUBLISH');

-- CreateTable
CREATE TABLE "public"."ResourceActivityLog" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "public"."ResourceAction" NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceActivityLog_resourceId_idx" ON "public"."ResourceActivityLog"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceActivityLog_userId_idx" ON "public"."ResourceActivityLog"("userId");

-- AddForeignKey
ALTER TABLE "public"."ResourceActivityLog" ADD CONSTRAINT "ResourceActivityLog_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."AcademicResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResourceActivityLog" ADD CONSTRAINT "ResourceActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
