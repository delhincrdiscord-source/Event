-- Migration: Add Registration Discord Runtime fields + DiscordConfig fields + AuditLog indexes
-- Created: 2026-08-02

-- 1. Registration model: add Discord runtime fields
ALTER TABLE "registrations" ADD COLUMN "full_name" VARCHAR(128);
ALTER TABLE "registrations" ADD COLUMN "email" VARCHAR(255);
ALTER TABLE "registrations" ADD COLUMN "interest" VARCHAR(128);
ALTER TABLE "registrations" ADD COLUMN "discord_username" VARCHAR(128);
ALTER TABLE "registrations" ADD COLUMN "discord_message_id" VARCHAR(64);
ALTER TABLE "registrations" ADD COLUMN "discord_channel_id" VARCHAR(64);

-- Backfill existing rows with defaults so we can enforce NOT NULL
UPDATE "registrations" SET "full_name" = 'Unknown' WHERE "full_name" IS NULL;
UPDATE "registrations" SET "email" = 'unknown@example.com' WHERE "email" IS NULL;
UPDATE "registrations" SET "interest" = 'General' WHERE "interest" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "registrations" ALTER COLUMN "full_name" SET NOT NULL;
ALTER TABLE "registrations" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "registrations" ALTER COLUMN "interest" SET NOT NULL;

-- 2. DiscordConfig model: add role and channel fields
ALTER TABLE "discord_configs" ADD COLUMN "registered_role_id" VARCHAR(64);
ALTER TABLE "discord_configs" ADD COLUMN "registrations_channel_id" VARCHAR(64);

-- 3. AuditLog indexes for performance
CREATE INDEX "idx_audit_logs_actor" ON "audit_logs"("actor_id");
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action");
CREATE INDEX "idx_audit_logs_target" ON "audit_logs"("target_entity", "target_id");
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs"("timestamp");
