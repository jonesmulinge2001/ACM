/*
  Warnings:

  - The values [ARCHIVED] on the enum `NotificationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [LIKE,FRIEND_REQUEST] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."NotificationStatus_new" AS ENUM ('UNREAD', 'READ');
ALTER TABLE "public"."Notification" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Notification" ALTER COLUMN "status" TYPE "public"."NotificationStatus_new" USING ("status"::text::"public"."NotificationStatus_new");
ALTER TYPE "public"."NotificationStatus" RENAME TO "NotificationStatus_old";
ALTER TYPE "public"."NotificationStatus_new" RENAME TO "NotificationStatus";
DROP TYPE "public"."NotificationStatus_old";
ALTER TABLE "public"."Notification" ALTER COLUMN "status" SET DEFAULT 'UNREAD';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."NotificationType_new" AS ENUM ('ANNOUNCEMENT', 'POST', 'COMMENT', 'MESSAGE', 'SYSTEM');
ALTER TABLE "public"."Notification" ALTER COLUMN "type" TYPE "public"."NotificationType_new" USING ("type"::text::"public"."NotificationType_new");
ALTER TYPE "public"."NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "public"."NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "readAt" TIMESTAMP(3);
