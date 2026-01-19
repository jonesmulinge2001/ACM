/*
  Warnings:

  - You are about to drop the column `title` on the `GroupResource` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `recipientId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `referenceId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `ConversationMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_recipientId_fkey";

-- DropIndex
DROP INDEX "public"."Notification_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Notification_recipientId_idx";

-- DropIndex
DROP INDEX "public"."Notification_status_idx";

-- AlterTable
ALTER TABLE "public"."ConversationMessage" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Group" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."GroupMessage" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "replyToId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."GroupResource" DROP COLUMN "title",
ADD COLUMN     "commentsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "content" TEXT,
ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "originalName" TEXT,
ALTER COLUMN "resourceUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Notification" DROP COLUMN "message",
DROP COLUMN "readAt",
DROP COLUMN "recipientId",
DROP COLUMN "referenceId",
DROP COLUMN "status",
ADD COLUMN     "actorIds" TEXT[],
ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "seen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."NotificationType";

-- CreateTable
CREATE TABLE "public"."GroupResourceLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupResourceLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupResourceComment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupResourceComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupResourceCommentLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupResourceCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupResourceLike_userId_resourceId_key" ON "public"."GroupResourceLike"("userId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupResourceCommentLike_userId_commentId_key" ON "public"."GroupResourceCommentLike"("userId", "commentId");

-- CreateIndex
CREATE INDEX "Notification_userId_seen_idx" ON "public"."Notification"("userId", "seen");

-- CreateIndex
CREATE INDEX "Notification_userId_type_entityId_idx" ON "public"."Notification"("userId", "type", "entityId");

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMessage" ADD CONSTRAINT "GroupMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."GroupMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupResourceLike" ADD CONSTRAINT "GroupResourceLike_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."GroupResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupResourceLike" ADD CONSTRAINT "GroupResourceLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupResourceComment" ADD CONSTRAINT "GroupResourceComment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."GroupResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupResourceComment" ADD CONSTRAINT "GroupResourceComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupResourceCommentLike" ADD CONSTRAINT "GroupResourceCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."GroupResourceComment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupResourceCommentLike" ADD CONSTRAINT "GroupResourceCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
