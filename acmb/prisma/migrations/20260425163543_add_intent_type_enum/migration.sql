/*
  Warnings:

  - Changed the type of `type` on the `Intent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."Intent" DROP COLUMN "type",
ADD COLUMN     "type" "public"."IntentType" NOT NULL;

-- CreateIndex
CREATE INDEX "Intent_type_idx" ON "public"."Intent"("type");
