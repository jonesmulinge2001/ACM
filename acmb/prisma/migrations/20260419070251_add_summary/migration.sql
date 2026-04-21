-- CreateTable
CREATE TABLE "public"."AcademicResourceSummary" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyPoints" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicResourceSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicResourceSummary_resourceId_key" ON "public"."AcademicResourceSummary"("resourceId");

-- AddForeignKey
ALTER TABLE "public"."AcademicResourceSummary" ADD CONSTRAINT "AcademicResourceSummary_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."AcademicResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
