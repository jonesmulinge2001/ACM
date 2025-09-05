-- AlterTable
ALTER TABLE "public"."AcademicResource" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."AcademicResourceFlag" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reason" TEXT NOT NULL,
    "status" "public"."FlagStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicResourceFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcademicResourceFlag_resourceId_idx" ON "public"."AcademicResourceFlag"("resourceId");

-- CreateIndex
CREATE INDEX "AcademicResourceFlag_reporterId_idx" ON "public"."AcademicResourceFlag"("reporterId");

-- CreateIndex
CREATE INDEX "AcademicResourceFlag_reviewedById_idx" ON "public"."AcademicResourceFlag"("reviewedById");

-- AddForeignKey
ALTER TABLE "public"."AcademicResourceFlag" ADD CONSTRAINT "AcademicResourceFlag_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."AcademicResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AcademicResourceFlag" ADD CONSTRAINT "AcademicResourceFlag_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AcademicResourceFlag" ADD CONSTRAINT "AcademicResourceFlag_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
