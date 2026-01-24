-- CreateTable
CREATE TABLE "public"."UniTokVideo" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniTokVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UniTokVideoLike" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniTokVideoLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UniTokComment" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniTokComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UniTokVideo_creatorId_idx" ON "public"."UniTokVideo"("creatorId");

-- CreateIndex
CREATE INDEX "UniTokVideo_createdAt_idx" ON "public"."UniTokVideo"("createdAt");

-- CreateIndex
CREATE INDEX "UniTokVideoLike_videoId_idx" ON "public"."UniTokVideoLike"("videoId");

-- CreateIndex
CREATE INDEX "UniTokVideoLike_userId_idx" ON "public"."UniTokVideoLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UniTokVideoLike_videoId_userId_key" ON "public"."UniTokVideoLike"("videoId", "userId");

-- CreateIndex
CREATE INDEX "UniTokComment_videoId_idx" ON "public"."UniTokComment"("videoId");

-- CreateIndex
CREATE INDEX "UniTokComment_authorId_idx" ON "public"."UniTokComment"("authorId");

-- AddForeignKey
ALTER TABLE "public"."UniTokVideo" ADD CONSTRAINT "UniTokVideo_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UniTokVideoLike" ADD CONSTRAINT "UniTokVideoLike_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."UniTokVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UniTokVideoLike" ADD CONSTRAINT "UniTokVideoLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UniTokComment" ADD CONSTRAINT "UniTokComment_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."UniTokVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UniTokComment" ADD CONSTRAINT "UniTokComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
