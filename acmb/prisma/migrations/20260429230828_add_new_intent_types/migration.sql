-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."IntentType" ADD VALUE 'FIND_COFOUNDER';
ALTER TYPE "public"."IntentType" ADD VALUE 'HACKATHON_TEAM';
ALTER TYPE "public"."IntentType" ADD VALUE 'SKILL_EXCHANGE';
ALTER TYPE "public"."IntentType" ADD VALUE 'MENTORSHIP';
ALTER TYPE "public"."IntentType" ADD VALUE 'RESEARCH_COLLAB';
ALTER TYPE "public"."IntentType" ADD VALUE 'ACCOUNTABILITY_PARTNER';
