# Database Architecture Specification: Delhi NCR Gameverse 2026

## Executive Summary
This document defines the complete, production-ready relational database architecture for **Delhi NCR Gameverse 2026**, the community festival management platform for the **Delhi NCR Discord Community** ([discord.gg/delhi](https://discord.gg/delhi)).

It details 20 entities across 10 core domain modules, specifying every column, constraint, relationship, index, cascade rule, soft delete pattern, and performance optimization strategy for a 10,000–100,000 user scale.

---

## 1. Architectural Standards & Design Policies

### 1.1 Naming Conventions
- **Table Names**: Lowercase `snake_case` plural nouns (e.g., `users`, `community_events`, `event_categories`).
- **Column Names**: Lowercase `snake_case` singular nouns (e.g., `user_id`, `created_at`, `discord_username`).
- **Primary Keys**: Named `id` on every table.
- **Foreign Keys**: Named `<singular_target_table>_id` (e.g., `event_id` referencing `community_events.id`).
- **Junction Tables**: Plural combination of entity names (e.g., `role_permissions`, `event_rsvps`).

### 1.2 Primary Key & UUID Strategy
- **UUID Version**: `UUIDv7` (or PostgreSQL `gen_random_uuid()`).
- **Rationale**: `UUIDv7` combines a timestamp-first prefix with cryptographically random bits. Unlike standard random `UUIDv4`, `UUIDv7` maintains natural index locality and prevents B-Tree index fragmentation during high-throughput inserts.

### 1.3 Soft Delete Policy
- **Active Record**: Identified by `deleted_at IS NULL`.
- **Soft-Deleted Record**: Populated with `deleted_at = TIMESTAMP WITH TIME ZONE`.
- **Enforced Tables**: `users`, `community_events`, `announcements`, `gallery_items`.
- **Hard Delete Tables**: Log tables (`webhook_logs`, `audit_logs`, `discord_logs`) and ephemeral notifications.

### 1.4 Audit Strategy
- **Creation Audit**: `created_at` (Timestamp), `created_by_id` (UUID foreign key).
- **Modification Audit**: `updated_at` (Timestamp), `updated_by_id` (UUID foreign key).
- **Immutable Log Engine**: Managed via the dedicated `audit_logs` table for tracking state changes across system entities.

---

## 2. Global Enum Definitions

```
ENUM RoleName {
    ADMIN
    ORGANIZER
    MODERATOR
    MEMBER
    GUEST
}

ENUM EventCategoryType {
    GAMING_NIGHT
    VOICE_ACTIVITY
    MOVIE_WATCHPARTY
    GIVEAWAY
    CREATIVE_CONTEST
    MINECRAFT_SMP
    CUSTOM_LOBBY
    MUSIC_LOUNGE
}

ENUM EventStatus {
    DRAFT
    SCHEDULED
    LIVE
    COMPLETED
    CANCELLED
}

ENUM PassStatus {
    ACTIVE
    CHECKED_IN
    REVOKED
}

ENUM FormFieldType {
    TEXT
    TEXTAREA
    SELECT
    CHECKBOX
    RADIO
    DISCORD_TAG
}

ENUM NotificationType {
    SYSTEM_ALERT
    EVENT_REMINDER
    GIVEAWAY_WINNER
    ANNOUNCEMENT
}

ENUM WebhookStatus {
    SUCCESS
    FAILED
    RETRYING
}
```

---

## 3. Entity & Table Specifications

### 3.1 Module 1: Users & RBAC

#### Table: `users`
- **Purpose**: Central identity store for community members and platform staff.
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `discord_id` (VARCHAR(64), NOT NULL, UNIQUE)
  - `username` (VARCHAR(64), NOT NULL)
  - `global_name` (VARCHAR(128), NULLABLE)
  - `email` (VARCHAR(255), NULLABLE, UNIQUE)
  - `avatar_url` (TEXT, NULLABLE)
  - `is_verified` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
  - `deleted_at` (TIMESTAMPTZ, NULLABLE)
- **Relationships**:
  - `1:1` with `discord_accounts`
  - `1:N` with `user_roles`
  - `1:N` with `registrations`
  - `1:N` with `event_rsvps`
- **Indexes**:
  - Unique Index: `idx_users_discord_id` on (`discord_id`) WHERE `deleted_at IS NULL`
  - Unique Index: `idx_users_email` on (`email`) WHERE `deleted_at IS NULL`
- **Validation**: `email` must match RFC 5322 regex format.
- **Performance**: High-read profile; `discord_id` index enables O(1) OAuth lookup.

#### Table: `roles`
- **Purpose**: System role definitions for RBAC governance.
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `name` (Enum `RoleName`, NOT NULL, UNIQUE)
  - `description` (TEXT, NULLABLE)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- **Relationships**:
  - `1:N` with `user_roles`
  - `N:M` with `permissions` via `role_permissions`

#### Table: `permissions`
- **Purpose**: Granular feature permission strings (e.g., `events:create`, `announcements:publish`).
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `key` (VARCHAR(64), NOT NULL, UNIQUE)
  - `description` (TEXT, NULLABLE)

#### Table: `user_roles` (Junction)
- **Columns**:
  - `user_id` (UUID, NOT NULL, FK -> `users.id` CASCADE)
  - `role_id` (UUID, NOT NULL, FK -> `roles.id` CASCADE)
- **Primary Key**: Composite (`user_id`, `role_id`)

#### Table: `role_permissions` (Junction)
- **Columns**:
  - `role_id` (UUID, NOT NULL, FK -> `roles.id` CASCADE)
  - `permission_id` (UUID, NOT NULL, FK -> `permissions.id` CASCADE)
- **Primary Key**: Composite (`role_id`, `permission_id`)

---

### 3.2 Module 2: Festivals & Event Core

#### Table: `festivals`
- **Purpose**: High-level festival edition metadata (e.g., Gameverse 2026).
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `name` (VARCHAR(128), NOT NULL)
  - `slug` (VARCHAR(64), NOT NULL, UNIQUE)
  - `start_date` (TIMESTAMPTZ, NOT NULL)
  - `end_date` (TIMESTAMPTZ, NOT NULL)
  - `is_active` (BOOLEAN, NOT NULL, DEFAULT `true`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

#### Table: `event_categories`
- **Purpose**: Taxonomy for organizing activities (Gaming Nights, Movie Watchparties, Voice Hangouts).
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `type` (Enum `EventCategoryType`, NOT NULL, UNIQUE)
  - `display_name` (VARCHAR(64), NOT NULL)
  - `icon_emoji` (VARCHAR(16), NULLABLE)
  - `color_hex` (VARCHAR(7), NOT NULL, DEFAULT `#5865F2`)

#### Table: `community_events`
- **Purpose**: Individual scheduled community activities across the 30-day timeline.
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `festival_id` (UUID, NOT NULL, FK -> `festivals.id` CASCADE)
  - `category_id` (UUID, NOT NULL, FK -> `event_categories.id` RESTRICT)
  - `title` (VARCHAR(128), NOT NULL)
  - `slug` (VARCHAR(128), NOT NULL, UNIQUE)
  - `description` (TEXT, NOT NULL)
  - `week_number` (INT, NOT NULL) -- 1, 2, 3, 4
  - `start_time` (TIMESTAMPTZ, NOT NULL)
  - `end_time` (TIMESTAMPTZ, NOT NULL)
  - `status` (Enum `EventStatus`, NOT NULL, DEFAULT `SCHEDULED`)
  - `discord_voice_channel_id` (VARCHAR(64), NULLABLE)
  - `host_name` (VARCHAR(64), NOT NULL)
  - `is_featured` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
  - `deleted_at` (TIMESTAMPTZ, NULLABLE)
- **Indexes**:
  - Composite Index: `idx_events_schedule` on (`week_number`, `start_time`) WHERE `deleted_at IS NULL`
  - Index: `idx_events_category` on (`category_id`)

---

### 3.3 Module 3: Registration & Form Builder

#### Table: `registrations`
- **Purpose**: Issued digital festival passes for community members.
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `user_id` (UUID, NOT NULL, FK -> `users.id` CASCADE)
  - `festival_id` (UUID, NOT NULL, FK -> `festivals.id` CASCADE)
  - `pass_number` (VARCHAR(32), NOT NULL, UNIQUE)
  - `status` (Enum `PassStatus`, NOT NULL, DEFAULT `ACTIVE`)
  - `registered_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
- **Constraints**: Unique (`user_id`, `festival_id`) — 1 pass per user per festival edition.

#### Table: `form_fields` (Form Builder)
- **Purpose**: Dynamic custom fields for event signups (e.g., Favorite Game, Discord Tag).
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `festival_id` (UUID, NOT NULL, FK -> `festivals.id` CASCADE)
  - `field_name` (VARCHAR(64), NOT NULL)
  - `label` (VARCHAR(128), NOT NULL)
  - `field_type` (Enum `FormFieldType`, NOT NULL)
  - `options` (JSONB, NULLABLE) -- Array of options for SELECT/CHECKBOX
  - `is_required` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `display_order` (INT, NOT NULL, DEFAULT `0`)

#### Table: `form_responses`
- **Purpose**: Stored member responses to dynamic registration form fields.
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `registration_id` (UUID, NOT NULL, FK -> `registrations.id` CASCADE)
  - `form_field_id` (UUID, NOT NULL, FK -> `form_fields.id` CASCADE)
  - `response_value` (TEXT, NOT NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

---

### 3.4 Module 4: Discord Integration & Logs

#### Table: `discord_accounts`
- **Purpose**: OAuth tokens and server metadata for synced Discord accounts.
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `user_id` (UUID, NOT NULL, UNIQUE, FK -> `users.id` CASCADE)
  - `access_token_encrypted` (TEXT, NOT NULL)
  - `refresh_token_encrypted` (TEXT, NOT NULL)
  - `expires_at` (TIMESTAMPTZ, NOT NULL)
  - `joined_discord_at` (TIMESTAMPTZ, NULLABLE)
  - `synced_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

#### Table: `webhook_logs`
- **Purpose**: Audit log of outgoing Discord webhook alerts (#announcements, #events).
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `target_channel_id` (VARCHAR(64), NOT NULL)
  - `event_type` (VARCHAR(64), NOT NULL)
  - `status` (Enum `WebhookStatus`, NOT NULL)
  - `payload_json` (JSONB, NOT NULL)
  - `error_message` (TEXT, NULLABLE)
  - `executed_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

#### Table: `discord_logs`
- **Purpose**: Log of automated Discord bot operations (role assignments, voice state tracking).
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `discord_user_id` (VARCHAR(64), NOT NULL)
  - `action` (VARCHAR(64), NOT NULL)
  - `details` (JSONB, NULLABLE)
  - `timestamp` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

---

### 3.5 Module 5: Announcements, FAQ, Gallery, Media & Settings

#### Table: `announcements`
- **Purpose**: Official festival news alerts and daily highlights.
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `title` (VARCHAR(128), NOT NULL)
  - `content` (TEXT, NOT NULL)
  - `author_id` (UUID, NOT NULL, FK -> `users.id` SET NULL)
  - `is_pinned` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `published_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)
  - `deleted_at` (TIMESTAMPTZ, NULLABLE)

#### Table: `media`
- **Purpose**: Master asset registry for uploaded images (R2/S3 storage references).
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `file_key` (VARCHAR(255), NOT NULL, UNIQUE)
  - `url` (TEXT, NOT NULL)
  - `mime_type` (VARCHAR(64), NOT NULL)
  - `size_bytes` (BIGINT, NOT NULL)
  - `uploader_id` (UUID, NULLABLE, FK -> `users.id` SET NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

#### Table: `gallery_items`
- **Purpose**: Community screenshot, setup, fanart, and cosplay photo submission showcases.
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `media_id` (UUID, NOT NULL, FK -> `media.id` CASCADE)
  - `title` (VARCHAR(128), NOT NULL)
  - `author_id` (UUID, NOT NULL, FK -> `users.id` CASCADE)
  - `is_approved` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `approved_by_id` (UUID, NULLABLE, FK -> `users.id` SET NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

#### Table: `faqs`
- **Purpose**: Searchable community Q&A and festival guidelines.
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `question` (TEXT, NOT NULL)
  - `answer` (TEXT, NOT NULL)
  - `display_order` (INT, NOT NULL, DEFAULT `0`)
  - `is_published` (BOOLEAN, NOT NULL, DEFAULT `true`)

#### Table: `settings`
- **Purpose**: Centralized key-value platform configurations & feature flags.
- **Columns**:
  - `key` (VARCHAR(64), NOT NULL, PK)
  - `value_json` (JSONB, NOT NULL)
  - `description` (TEXT, NULLABLE)
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

#### Table: `notifications`
- **Purpose**: In-app member notifications (event reminders, announcement pings).
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `user_id` (UUID, NOT NULL, FK -> `users.id` CASCADE)
  - `type` (Enum `NotificationType`, NOT NULL)
  - `title` (VARCHAR(128), NOT NULL)
  - `message` (TEXT, NOT NULL)
  - `is_read` (BOOLEAN, NOT NULL, DEFAULT `false`)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

#### Table: `audit_logs`
- **Purpose**: Immutable security audit trail of staff actions.
- **Columns**:
  - `id` (UUID, NOT NULL, PK)
  - `actor_id` (UUID, NULLABLE, FK -> `users.id` SET NULL)
  - `action` (VARCHAR(128), NOT NULL)
  - `target_entity` (VARCHAR(64), NOT NULL)
  - `target_id` (VARCHAR(64), NULLABLE)
  - `changes_json` (JSONB, NULLABLE)
  - `ip_address` (VARCHAR(45), NULLABLE)
  - `timestamp` (TIMESTAMPTZ, NOT NULL, DEFAULT `NOW()`)

---

## 4. Migration & Schema Versioning Strategy

1. **Zero-Downtime Migration Pattern**:
   - All schema changes must follow **Expand-Contract Strategy**:
     - *Phase 1 (Expand)*: Add new columns as nullable or with defaults.
     - *Phase 2 (Migrate)*: Deploy updated app version to write to new columns.
     - *Phase 3 (Contract)*: Remove legacy unused columns in a subsequent release.

---

## 5. Query Optimization & Indexing Blueprint

```
-- Index for sub-10ms OAuth login lookup
CREATE UNIQUE INDEX idx_users_discord_active ON users (discord_id) WHERE deleted_at IS NULL;

-- Composite index for fast 4-week timeline calendar rendering
CREATE INDEX idx_events_calendar ON community_events (week_number, start_time, status) WHERE deleted_at IS NULL;

-- Index for instant user RSVP status checks
CREATE UNIQUE INDEX idx_rsvps_lookup ON event_rsvps (event_id, user_id);

-- Partial index for active published announcements
CREATE INDEX idx_announcements_active ON announcements (published_at DESC) WHERE deleted_at IS NULL;
```
