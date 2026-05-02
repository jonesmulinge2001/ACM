/*
  Warnings:

  - The values [PROJECT_COLLAB,MENTORSHIP,ACCOUNTABILITY] on the enum `IntentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."IntentType_new" AS ENUM ('STUDY_PARTNER', 'BUILD_PROJECT', 'INTERNSHIP', 'STARTUP');
ALTER TABLE "public"."Intent" ALTER COLUMN "type" TYPE "public"."IntentType_new" USING ("type"::text::"public"."IntentType_new");
ALTER TYPE "public"."IntentType" RENAME TO "IntentType_old";
ALTER TYPE "public"."IntentType_new" RENAME TO "IntentType";
DROP TYPE "public"."IntentType_old";
COMMIT;
