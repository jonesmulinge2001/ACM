-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "commentsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "idx_post_createdAt" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "idx_post_author_createdAt" ON "Post"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_post_isDeleted_createdAt" ON "Post"("isDeleted", "createdAt");
