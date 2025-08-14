-- CreateTable
CREATE TABLE "AcademicResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "fileUrl" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaderId" TEXT NOT NULL,

    CONSTRAINT "AcademicResource_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AcademicResource" ADD CONSTRAINT "AcademicResource_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
