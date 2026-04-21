-- CreateTable
CREATE TABLE "public"."AcademicResourceClassification" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "subject" TEXT,
    "topic" TEXT,
    "difficulty" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicResourceClassification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicResourceClassification_resourceId_key" ON "public"."AcademicResourceClassification"("resourceId");

-- AddForeignKey
ALTER TABLE "public"."AcademicResourceClassification" ADD CONSTRAINT "AcademicResourceClassification_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."AcademicResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
