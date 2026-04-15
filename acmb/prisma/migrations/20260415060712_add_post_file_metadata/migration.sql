-- AlterTable
ALTER TABLE "public"."Comment" ADD COLUMN     "depth" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileType" TEXT;

-- CreateIndex
CREATE INDEX "Comment_postId_createdAt_idx" ON "public"."Comment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "public"."Comment"("parentId");
