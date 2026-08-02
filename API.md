# API Specification: Delhi NCR Gameverse 2026

## Overview

This document defines the complete API contract for the **Delhi NCR Gameverse 2026** community festival platform. Every endpoint, payload, validation rule, error shape, and operational policy is specified here. Implementation will use **Next.js 15 Server Actions** and **Route Handlers**.

---

## 1. API Foundations

### 1.1 Base URL

```
Production:  https://gameverse.delhincr.com/api/v1
Staging:     https://staging.gameverse.delhincr.com/api/v1
```

### 1.2 Versioning

All routes are prefixed with `/api/v1`. Breaking changes require a new version prefix (`/api/v2`). Non-breaking additions (new optional fields, new endpoints) are shipped under the existing version.

### 1.3 Content Type

- **Request**: `application/json` for all endpoints except file uploads (`multipart/form-data`).
- **Response**: `application/json` for all endpoints.

### 1.4 Authentication Mechanism

Discord OAuth2 session tokens stored in encrypted `HttpOnly` cookies (`SameSite=Lax`, `Secure=true`). The cookie name is `__session`. No Bearer tokens are exposed to client JavaScript.

---

## 2. Standard Response Envelope

### 2.1 Success Response

```json
{
  "success": true,
  "data": { },
  "meta": {
    "timestamp": "2026-10-01T12:00:00Z",
    "request_id": "req_7f8a9b0c"
  }
}
```

### 2.2 Paginated Success Response

```json
{
  "success": true,
  "data": [ ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 342,
    "total_pages": 18,
    "has_next": true,
    "has_prev": false
  },
  "meta": {
    "timestamp": "2026-10-01T12:00:00Z",
    "request_id": "req_7f8a9b0c"
  }
}
```

### 2.3 Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description of what went wrong.",
    "details": [
      {
        "field": "title",
        "message": "Title is required.",
        "rule": "required"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-10-01T12:00:00Z",
    "request_id": "req_7f8a9b0c"
  }
}
```

### 2.4 Standard Error Codes

| Code | HTTP Status | Meaning |
| :--- | :---: | :--- |
| `UNAUTHORIZED` | 401 | Missing or invalid session cookie. |
| `FORBIDDEN` | 403 | Authenticated but insufficient role/permission. |
| `NOT_FOUND` | 404 | Requested resource does not exist. |
| `VALIDATION_ERROR` | 422 | Request body failed schema validation. |
| `CONFLICT` | 409 | Duplicate resource or constraint violation. |
| `RATE_LIMITED` | 429 | Too many requests. Retry after `Retry-After` header. |
| `INTERNAL_ERROR` | 500 | Unexpected server failure. |

---

## 3. Pagination, Filtering, Sorting & Search

### 3.1 Pagination

All list endpoints accept:

| Parameter | Type | Default | Max | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | Integer | `1` | — | Page number (1-indexed). |
| `per_page` | Integer | `20` | `100` | Items per page. |

### 3.2 Filtering

Filters are passed as query parameters matching column names:

```
GET /api/v1/events?category=GAMING_NIGHT&status=SCHEDULED&week_number=2
```

### 3.3 Sorting

```
GET /api/v1/events?sort_by=start_time&sort_order=asc
```

| Parameter | Values | Default |
| :--- | :--- | :--- |
| `sort_by` | Any sortable column name. | `created_at` |
| `sort_order` | `asc`, `desc` | `desc` |

### 3.4 Search

Full-text search on supported endpoints:

```
GET /api/v1/events?search=valorant
```

The `search` parameter performs case-insensitive partial matching against `title` and `description`.

---

## 4. Rate Limiting Strategy

| Tier | Scope | Limit | Window |
| :--- | :--- | :--- | :--- |
| **Public Read** | Unauthenticated GET requests | 60 req | 1 minute |
| **Authenticated Read** | Authenticated GET requests | 120 req | 1 minute |
| **Authenticated Write** | POST / PATCH / DELETE | 30 req | 1 minute |
| **Registration** | Pass claim & RSVP | 5 req | 1 minute |
| **File Upload** | Media uploads | 10 req | 5 minutes |
| **Admin Write** | Admin mutations | 60 req | 1 minute |

Rate limit state is communicated via response headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1727784000
Retry-After: 18
```

---

## 5. Caching Strategy

| Resource | Cache Layer | TTL | Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| Landing page data | Edge CDN (ISR) | 60s | Deploy / Admin edit |
| Event list | Redis | 30s | Event create / update / delete |
| FAQ list | Edge CDN (ISR) | 300s | FAQ create / update / delete |
| Gallery (approved) | Redis | 60s | Gallery item approval |
| Announcements | Redis | 30s | Announcement publish |
| User session | Redis | 7 days | Logout / Token refresh |
| Analytics aggregates | Redis | 5 min | Background job recalculation |

---

## 6. Security Policies

- **Input Sanitization**: All string inputs are stripped of HTML tags and trimmed of leading/trailing whitespace before validation.
- **SQL Injection**: Prevented by parameterized queries through the ORM layer (Prisma). No raw SQL interpolation.
- **CSRF Protection**: Enforced via `SameSite=Lax` cookies and `Origin` header validation on mutation endpoints.
- **File Upload Validation**: MIME type whitelist (`image/jpeg`, `image/png`, `image/gif`, `image/webp`). Max file size: 5 MB. Files are scanned for magic bytes to prevent MIME spoofing.
- **Audit Logging**: Every mutation by `ADMIN`, `ORGANIZER`, or `MODERATOR` roles writes an immutable record to `audit_logs`.

---

## 7. File Upload Strategy

- **Transport**: `multipart/form-data` via `POST /api/v1/media/upload`.
- **Storage**: Cloudflare R2 (S3-compatible). Files are stored with a generated key: `uploads/{year}/{month}/{uuid}.{ext}`.
- **Processing**: Server validates MIME type, enforces max 5 MB, generates a unique `file_key`, uploads to R2, and inserts a row into the `media` table.
- **Response**: Returns the `media` record including `id`, `url`, and `file_key`.
- **Linking**: The returned `media.id` is then passed as `media_id` when creating gallery items or attaching images to announcements.

---

## 8. Module Endpoints

---

### 8.1 Authentication

#### `POST /api/v1/auth/discord`
- **Purpose**: Initiate Discord OAuth2 login flow.
- **Auth Required**: No.
- **Request Body**: None.
- **Response** (`200`):
  ```json
  { "success": true, "data": { "redirect_url": "https://discord.com/oauth2/authorize?..." } }
  ```
- **Rate Limit**: Public Read.

#### `GET /api/v1/auth/discord/callback`
- **Purpose**: Handle Discord OAuth2 callback. Exchange code for tokens, verify guild membership in `discord.gg/delhi`, upsert user, set session cookie.
- **Auth Required**: No.
- **Query Parameters**:
  - `code` (String, required) — OAuth2 authorization code.
  - `state` (String, required) — CSRF state token.
- **Success Response** (`302`): Redirect to `/dashboard` with `__session` cookie set.
- **Error Responses**:
  - `401` — Invalid or expired authorization code.
  - `403` — User is not a member of the Delhi NCR Discord server.
- **Audit Log**: Yes — `AUTH_LOGIN` with `discord_id`.

#### `POST /api/v1/auth/logout`
- **Purpose**: Destroy session and clear cookie.
- **Auth Required**: Yes (any role).
- **Request Body**: None.
- **Success Response** (`200`):
  ```json
  { "success": true, "data": { "message": "Logged out successfully." } }
  ```
- **Audit Log**: Yes — `AUTH_LOGOUT`.

#### `GET /api/v1/auth/me`
- **Purpose**: Return the currently authenticated user profile with roles and permissions.
- **Auth Required**: Yes (any role).
- **Success Response** (`200`):
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "discord_id": "123456789",
      "username": "gamer_xyz",
      "global_name": "Gamer XYZ",
      "avatar_url": "https://cdn.discordapp.com/...",
      "email": "user@example.com",
      "is_verified": true,
      "roles": ["MEMBER"],
      "permissions": ["events:rsvp", "gallery:submit"]
    }
  }
  ```

---

### 8.2 Users

#### `GET /api/v1/users`
- **Purpose**: List all platform users.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`, `MODERATOR`.
- **Query Parameters**: `page`, `per_page`, `search`, `sort_by` (`username`, `created_at`), `sort_order`, `role` (filter by role name), `is_verified` (Boolean filter).
- **Success Response** (`200`): Paginated array of user objects (excluding `deleted_at IS NOT NULL`).
- **Rate Limit**: Authenticated Read.

#### `GET /api/v1/users/:id`
- **Purpose**: Get a single user by ID.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`, `MODERATOR`. Members can only fetch their own record.
- **Path Parameters**: `id` (UUID, required).
- **Success Response** (`200`): Full user object with roles.
- **Error Responses**: `404` — User not found.

#### `PATCH /api/v1/users/:id`
- **Purpose**: Update a user's profile fields.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` can update any user. Members can only update their own `global_name` and `email`.
- **Path Parameters**: `id` (UUID, required).
- **Request Body**:
  ```json
  {
    "global_name": "New Display Name",
    "email": "updated@example.com"
  }
  ```
- **Validation**:
  - `global_name`: Optional, max 128 characters.
  - `email`: Optional, valid email format, must be unique.
- **Success Response** (`200`): Updated user object.
- **Error Responses**: `409` — Email already in use. `422` — Validation failure.
- **Audit Log**: Yes — `USER_UPDATE` with changed fields.

#### `DELETE /api/v1/users/:id`
- **Purpose**: Soft-delete a user account.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Path Parameters**: `id` (UUID, required).
- **Success Response** (`200`): Confirmation message.
- **Cascade**: Sets `deleted_at` on user. Associated `registrations`, `event_rsvps`, and `notifications` remain for audit purposes.
- **Audit Log**: Yes — `USER_DELETE`.

---

### 8.3 Roles

#### `GET /api/v1/roles`
- **Purpose**: List all system roles with their associated permissions.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`.
- **Success Response** (`200`): Array of role objects, each containing a `permissions` array.

#### `POST /api/v1/users/:userId/roles`
- **Purpose**: Assign a role to a user.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Path Parameters**: `userId` (UUID, required).
- **Request Body**:
  ```json
  { "role_id": "uuid" }
  ```
- **Validation**: `role_id` must reference an existing role. User must not already have this role.
- **Success Response** (`201`): Updated user object with new roles array.
- **Error Responses**: `409` — Role already assigned. `404` — User or role not found.
- **Audit Log**: Yes — `ROLE_ASSIGN` with `user_id` and `role_name`.

#### `DELETE /api/v1/users/:userId/roles/:roleId`
- **Purpose**: Remove a role from a user.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Path Parameters**: `userId` (UUID), `roleId` (UUID).
- **Validation**: Cannot remove the last `ADMIN` role if it would leave zero admins.
- **Success Response** (`200`): Updated user object.
- **Audit Log**: Yes — `ROLE_REVOKE`.

---

### 8.4 Permissions

#### `GET /api/v1/permissions`
- **Purpose**: List all granular permission keys.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`.
- **Success Response** (`200`): Array of `{ id, key, description }`.

#### `PUT /api/v1/roles/:roleId/permissions`
- **Purpose**: Replace the full permission set for a role.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Path Parameters**: `roleId` (UUID, required).
- **Request Body**:
  ```json
  { "permission_ids": ["uuid1", "uuid2", "uuid3"] }
  ```
- **Validation**: All `permission_ids` must reference existing permissions. Array must not be empty for non-`GUEST` roles.
- **Success Response** (`200`): Updated role object with new permissions.
- **Audit Log**: Yes — `PERMISSIONS_UPDATE` with before/after diff.

---

### 8.5 Festivals

#### `GET /api/v1/festivals`
- **Purpose**: List all festival editions.
- **Auth Required**: No (public).
- **Success Response** (`200`): Array of festival objects. Typically a single active festival.
- **Cache**: Edge CDN, 300s TTL.

#### `GET /api/v1/festivals/:id`
- **Purpose**: Get a single festival by ID.
- **Auth Required**: No (public).
- **Path Parameters**: `id` (UUID, required).
- **Success Response** (`200`): Full festival object.

#### `POST /api/v1/festivals`
- **Purpose**: Create a new festival edition.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Request Body**:
  ```json
  {
    "name": "Delhi NCR Gameverse 2026",
    "slug": "gameverse-2026",
    "start_date": "2026-10-01T00:00:00+05:30",
    "end_date": "2026-10-31T23:59:59+05:30"
  }
  ```
- **Validation**:
  - `name`: Required, 3–128 characters.
  - `slug`: Required, lowercase alphanumeric and hyphens, unique.
  - `start_date`: Required, valid ISO 8601.
  - `end_date`: Required, must be after `start_date`.
- **Success Response** (`201`): Created festival object.
- **Error Responses**: `409` — Slug already exists. `422` — Validation failure.
- **Audit Log**: Yes — `FESTIVAL_CREATE`.

#### `PATCH /api/v1/festivals/:id`
- **Purpose**: Update festival metadata or toggle active state.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Request Body**: Partial festival fields.
- **Audit Log**: Yes — `FESTIVAL_UPDATE` with changed fields.

---

### 8.6 Event Categories

#### `GET /api/v1/event-categories`
- **Purpose**: List all event category types with display names and colors.
- **Auth Required**: No (public).
- **Success Response** (`200`):
  ```json
  {
    "success": true,
    "data": [
      { "id": "uuid", "type": "GAMING_NIGHT", "display_name": "Gaming Nights", "icon_emoji": "🎮", "color_hex": "#5865F2" }
    ]
  }
  ```
- **Cache**: Edge CDN, 300s TTL.

#### `POST /api/v1/event-categories`
- **Purpose**: Create a new event category.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Request Body**:
  ```json
  { "type": "MUSIC_LOUNGE", "display_name": "Music Lounges", "icon_emoji": "🎵", "color_hex": "#50e3c2" }
  ```
- **Validation**: `type` must be a valid `EventCategoryType` enum value and unique.
- **Success Response** (`201`): Created category object.
- **Audit Log**: Yes — `CATEGORY_CREATE`.

#### `PATCH /api/v1/event-categories/:id`
- **Purpose**: Update category display name, emoji, or color.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Audit Log**: Yes — `CATEGORY_UPDATE`.

---

### 8.7 Community Events

#### `GET /api/v1/events`
- **Purpose**: List community events with filtering and pagination.
- **Auth Required**: No (public).
- **Query Parameters**: `page`, `per_page`, `search`, `sort_by` (`start_time`, `title`, `created_at`), `sort_order`, `category` (EventCategoryType enum), `status` (EventStatus enum), `week_number` (1–4), `is_featured` (Boolean).
- **Success Response** (`200`): Paginated array of event objects including nested `category` object.
- **Cache**: Redis, 30s TTL. Invalidated on event mutation.

#### `GET /api/v1/events/:slug`
- **Purpose**: Get a single event by slug, including RSVP count.
- **Auth Required**: No (public).
- **Path Parameters**: `slug` (String, required).
- **Success Response** (`200`):
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "title": "Valorant Customs Night",
      "slug": "valorant-customs-night-w2",
      "category": { "type": "GAMING_NIGHT", "display_name": "Gaming Nights", "color_hex": "#5865F2" },
      "description": "...",
      "week_number": 2,
      "start_time": "2026-10-10T20:00:00+05:30",
      "end_time": "2026-10-10T23:00:00+05:30",
      "status": "SCHEDULED",
      "discord_voice_channel_id": "123456789",
      "host_name": "ModeratorX",
      "is_featured": true,
      "rsvp_count": 47,
      "user_has_rsvped": false
    }
  }
  ```
- **Note**: `user_has_rsvped` is `null` for unauthenticated requests, `true`/`false` for authenticated.

#### `POST /api/v1/events`
- **Purpose**: Create a new community event.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`.
- **Request Body**:
  ```json
  {
    "festival_id": "uuid",
    "category_id": "uuid",
    "title": "Among Us Game Night",
    "description": "Join us for an evening of deception and fun.",
    "week_number": 3,
    "start_time": "2026-10-18T21:00:00+05:30",
    "end_time": "2026-10-18T23:30:00+05:30",
    "discord_voice_channel_id": "987654321",
    "host_name": "HostName",
    "is_featured": false
  }
  ```
- **Validation**:
  - `title`: Required, 3–128 characters.
  - `description`: Required, 10–5000 characters.
  - `week_number`: Required, integer 1–4.
  - `start_time`: Required, valid ISO 8601, must be within festival date range.
  - `end_time`: Required, must be after `start_time`.
  - `festival_id`: Required, must reference an existing active festival.
  - `category_id`: Required, must reference an existing category.
  - `host_name`: Required, 2–64 characters.
- **Slug Generation**: Auto-generated from `title` + `week_number` suffix (e.g., `among-us-game-night-w3`). If slug exists, append incremental counter.
- **Success Response** (`201`): Created event object.
- **Side Effects**: Invalidate Redis event cache. Optionally trigger Discord webhook to `#event-announcements`.
- **Audit Log**: Yes — `EVENT_CREATE`.

#### `PATCH /api/v1/events/:id`
- **Purpose**: Update event details or status.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`.
- **Path Parameters**: `id` (UUID, required).
- **Request Body**: Partial event fields. `status` can transition: `DRAFT` → `SCHEDULED` → `LIVE` → `COMPLETED`, or any → `CANCELLED`.
- **Validation**: `start_time` and `end_time` must remain within festival date range. Status transitions must follow valid state machine.
- **Side Effects**: Invalidate Redis event cache. If status changed to `CANCELLED`, send notification to all RSVPed users.
- **Audit Log**: Yes — `EVENT_UPDATE` with before/after diff.

#### `DELETE /api/v1/events/:id`
- **Purpose**: Soft-delete an event.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Cascade**: Sets `deleted_at`. Associated RSVPs remain for audit.
- **Audit Log**: Yes — `EVENT_DELETE`.

#### `POST /api/v1/events/:id/rsvp`
- **Purpose**: RSVP to a community event.
- **Auth Required**: Yes.
- **Authorization**: `MEMBER`, `MODERATOR`, `ORGANIZER`, `ADMIN`.
- **Path Parameters**: `id` (UUID, required).
- **Validation**: Event must exist, not be soft-deleted, and have status `SCHEDULED` or `LIVE`. User must not already have an RSVP for this event.
- **Success Response** (`201`):
  ```json
  { "success": true, "data": { "event_id": "uuid", "user_id": "uuid", "rsvped_at": "..." } }
  ```
- **Error Responses**: `409` — Already RSVPed. `422` — Event not accepting RSVPs.
- **Rate Limit**: Registration tier (5 req/min).
- **Audit Log**: No (member action, not staff).

#### `DELETE /api/v1/events/:id/rsvp`
- **Purpose**: Cancel an RSVP.
- **Auth Required**: Yes.
- **Authorization**: The RSVPing user only.
- **Success Response** (`200`): Confirmation message.

#### `GET /api/v1/events/:id/rsvps`
- **Purpose**: List all RSVPs for an event.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`, `MODERATOR`.
- **Query Parameters**: `page`, `per_page`.
- **Success Response** (`200`): Paginated array of `{ user_id, username, avatar_url, rsvped_at }`.

---

### 8.8 Registrations (Festival Passes)

#### `POST /api/v1/registrations`
- **Purpose**: Claim a free digital festival pass.
- **Auth Required**: Yes.
- **Authorization**: `MEMBER`, `MODERATOR`, `ORGANIZER`, `ADMIN`.
- **Request Body**:
  ```json
  {
    "festival_id": "uuid",
    "primary_interest": "Gaming Nights"
  }
  ```
- **Validation**:
  - `festival_id`: Required, must reference an active festival.
  - User must not already have a registration for this festival (unique constraint on `user_id` + `festival_id`).
- **Pass Number Generation**: Server generates a unique pass number in format `GV26-XXXX-XXXX` using a cryptographically random alphanumeric string.
- **Success Response** (`201`):
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "pass_number": "GV26-A1B2-C3D4",
      "status": "ACTIVE",
      "registered_at": "2026-09-15T10:30:00Z"
    }
  }
  ```
- **Error Responses**: `409` — Already registered for this festival.
- **Side Effects**: Assign `Gameverse 2026 Attendee` Discord role via bot. Send notification.
- **Rate Limit**: Registration tier (5 req/min).
- **Audit Log**: Yes — `REGISTRATION_CREATE`.

#### `GET /api/v1/registrations/me`
- **Purpose**: Get the current user's festival registration and pass.
- **Auth Required**: Yes.
- **Success Response** (`200`): Registration object with pass number and status, or `null` data if not registered.

#### `GET /api/v1/registrations`
- **Purpose**: List all registrations (admin view).
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`.
- **Query Parameters**: `page`, `per_page`, `search` (searches by pass_number or username), `status` (PassStatus enum), `sort_by` (`registered_at`), `sort_order`.
- **Success Response** (`200`): Paginated array of registration objects with nested user summary.

#### `PATCH /api/v1/registrations/:id/status`
- **Purpose**: Update registration status (revoke or check-in).
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`.
- **Request Body**:
  ```json
  { "status": "REVOKED" }
  ```
- **Validation**: Valid status transition: `ACTIVE` → `CHECKED_IN`, `ACTIVE` → `REVOKED`.
- **Audit Log**: Yes — `REGISTRATION_STATUS_UPDATE`.

---

### 8.9 Registration Forms (Form Builder)

#### `GET /api/v1/festivals/:festivalId/form-fields`
- **Purpose**: Get all custom registration form fields for a festival.
- **Auth Required**: No (public, needed for rendering the registration form).
- **Path Parameters**: `festivalId` (UUID, required).
- **Success Response** (`200`): Array of form field objects ordered by `display_order`.

#### `POST /api/v1/festivals/:festivalId/form-fields`
- **Purpose**: Add a custom field to the registration form.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Request Body**:
  ```json
  {
    "field_name": "favorite_game",
    "label": "What is your favorite game?",
    "field_type": "SELECT",
    "options": ["Valorant", "Minecraft", "BGMI", "Among Us", "Chess", "Other"],
    "is_required": true,
    "display_order": 1
  }
  ```
- **Validation**:
  - `field_name`: Required, 2–64 chars, lowercase snake_case, unique per festival.
  - `label`: Required, 3–128 chars.
  - `field_type`: Required, valid `FormFieldType` enum.
  - `options`: Required when `field_type` is `SELECT`, `CHECKBOX`, or `RADIO`. Must be array of 2+ strings.
  - `display_order`: Required, non-negative integer.
- **Audit Log**: Yes — `FORM_FIELD_CREATE`.

#### `PATCH /api/v1/form-fields/:id`
- **Purpose**: Update a form field label, options, or order.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Audit Log**: Yes — `FORM_FIELD_UPDATE`.

#### `DELETE /api/v1/form-fields/:id`
- **Purpose**: Remove a form field. Hard delete (orphaned responses are retained).
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Audit Log**: Yes — `FORM_FIELD_DELETE`.

#### `POST /api/v1/registrations/:registrationId/responses`
- **Purpose**: Submit responses to custom form fields during registration.
- **Auth Required**: Yes.
- **Authorization**: The registering user only.
- **Request Body**:
  ```json
  {
    "responses": [
      { "form_field_id": "uuid", "response_value": "Valorant" },
      { "form_field_id": "uuid", "response_value": "gamer#1234" }
    ]
  }
  ```
- **Validation**: All required fields must have a response. `form_field_id` must reference valid fields. Response values must match field type constraints (e.g., SELECT values must be in `options` array).

#### `GET /api/v1/registrations/:registrationId/responses`
- **Purpose**: View submitted form responses for a registration.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`, or the registering user.

---

### 8.10 Announcements

#### `GET /api/v1/announcements`
- **Purpose**: List published announcements.
- **Auth Required**: No (public).
- **Query Parameters**: `page`, `per_page`, `is_pinned` (Boolean filter), `sort_by` (`published_at`), `sort_order`.
- **Success Response** (`200`): Paginated array of announcement objects (excluding soft-deleted).
- **Cache**: Redis, 30s TTL.

#### `GET /api/v1/announcements/:id`
- **Purpose**: Get a single announcement.
- **Auth Required**: No (public).

#### `POST /api/v1/announcements`
- **Purpose**: Publish a new announcement.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`.
- **Request Body**:
  ```json
  {
    "title": "Week 2 Schedule Released!",
    "content": "Check out all the gaming nights and activities planned for Week 2...",
    "is_pinned": false
  }
  ```
- **Validation**:
  - `title`: Required, 3–128 characters.
  - `content`: Required, 10–10000 characters.
  - `is_pinned`: Optional, Boolean.
- **Side Effects**: Invalidate announcement cache. Optionally trigger Discord webhook to `#announcements` channel.
- **Audit Log**: Yes — `ANNOUNCEMENT_CREATE`.

#### `PATCH /api/v1/announcements/:id`
- **Purpose**: Edit announcement content or toggle pin.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`.
- **Audit Log**: Yes — `ANNOUNCEMENT_UPDATE`.

#### `DELETE /api/v1/announcements/:id`
- **Purpose**: Soft-delete an announcement.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Audit Log**: Yes — `ANNOUNCEMENT_DELETE`.

---

### 8.11 Notifications

#### `GET /api/v1/notifications`
- **Purpose**: List current user's notifications.
- **Auth Required**: Yes.
- **Authorization**: Any authenticated user (returns only their own notifications).
- **Query Parameters**: `page`, `per_page`, `is_read` (Boolean filter).
- **Success Response** (`200`): Paginated array of notification objects.

#### `PATCH /api/v1/notifications/:id/read`
- **Purpose**: Mark a notification as read.
- **Auth Required**: Yes.
- **Authorization**: Owner of the notification only.
- **Success Response** (`200`): Updated notification object.

#### `POST /api/v1/notifications/read-all`
- **Purpose**: Mark all unread notifications as read for the current user.
- **Auth Required**: Yes.
- **Success Response** (`200`):
  ```json
  { "success": true, "data": { "updated_count": 12 } }
  ```

#### `POST /api/v1/notifications/broadcast` (Admin)
- **Purpose**: Send a notification to all registered members or a filtered subset.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`.
- **Request Body**:
  ```json
  {
    "type": "SYSTEM_ALERT",
    "title": "Festival Starts Tomorrow!",
    "message": "Get ready for an amazing October...",
    "target": "ALL_REGISTERED"
  }
  ```
- **Validation**: `target` must be one of `ALL_REGISTERED`, `ALL_MEMBERS`, `ROLE:<role_name>`.
- **Side Effects**: Background job creates notification rows for each target user.
- **Audit Log**: Yes — `NOTIFICATION_BROADCAST`.

---

### 8.12 Gallery

#### `GET /api/v1/gallery`
- **Purpose**: List approved gallery items.
- **Auth Required**: No (public).
- **Query Parameters**: `page`, `per_page`, `sort_by` (`created_at`), `sort_order`.
- **Success Response** (`200`): Paginated array of gallery items with nested `media.url` and `author` summary.
- **Cache**: Redis, 60s TTL.

#### `POST /api/v1/gallery`
- **Purpose**: Submit a gallery item for approval.
- **Auth Required**: Yes.
- **Authorization**: `MEMBER`, `MODERATOR`, `ORGANIZER`, `ADMIN`.
- **Request Body**:
  ```json
  {
    "media_id": "uuid",
    "title": "My Gaming Setup"
  }
  ```
- **Validation**:
  - `media_id`: Required, must reference an existing `media` record uploaded by the current user.
  - `title`: Required, 3–128 characters.
- **Success Response** (`201`): Created gallery item with `is_approved: false`.

#### `PATCH /api/v1/gallery/:id/approve`
- **Purpose**: Approve or reject a gallery submission.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`, `MODERATOR`.
- **Request Body**:
  ```json
  { "is_approved": true }
  ```
- **Side Effects**: Invalidate gallery cache. Send notification to the submitting user.
- **Audit Log**: Yes — `GALLERY_APPROVE` or `GALLERY_REJECT`.

#### `DELETE /api/v1/gallery/:id`
- **Purpose**: Remove a gallery item.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` or the submitting user.
- **Audit Log**: Yes (if admin action) — `GALLERY_DELETE`.

---

### 8.13 Media Uploads

#### `POST /api/v1/media/upload`
- **Purpose**: Upload an image file to cloud storage.
- **Auth Required**: Yes.
- **Authorization**: Any authenticated user.
- **Content-Type**: `multipart/form-data`.
- **Request Body**: Form field `file` containing the image binary.
- **Validation**:
  - MIME type must be one of: `image/jpeg`, `image/png`, `image/gif`, `image/webp`.
  - File size must not exceed 5 MB.
  - Magic byte validation to prevent MIME spoofing.
- **Success Response** (`201`):
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "file_key": "uploads/2026/10/abc123.webp",
      "url": "https://cdn.gameverse.delhincr.com/uploads/2026/10/abc123.webp",
      "mime_type": "image/webp",
      "size_bytes": 245678
    }
  }
  ```
- **Rate Limit**: File Upload tier (10 req/5 min).

#### `GET /api/v1/media/:id`
- **Purpose**: Get media metadata by ID.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`, `MODERATOR`, or the uploader.

#### `DELETE /api/v1/media/:id`
- **Purpose**: Delete media from storage and database.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` or the uploader (if not linked to an approved gallery item).
- **Side Effects**: Delete file from R2 storage. Hard delete the `media` row.
- **Audit Log**: Yes (if admin action) — `MEDIA_DELETE`.

---

### 8.14 FAQs

#### `GET /api/v1/faqs`
- **Purpose**: List all published FAQs ordered by `display_order`.
- **Auth Required**: No (public).
- **Query Parameters**: `search` (searches `question` and `answer` text).
- **Success Response** (`200`): Array of FAQ objects where `is_published = true`.
- **Cache**: Edge CDN, 300s TTL.

#### `POST /api/v1/faqs`
- **Purpose**: Create a new FAQ entry.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Request Body**:
  ```json
  {
    "question": "Do I need to live in Delhi to join?",
    "answer": "Not at all! All events are hosted 100% online on our Discord server.",
    "display_order": 3,
    "is_published": true
  }
  ```
- **Validation**:
  - `question`: Required, 10–500 characters.
  - `answer`: Required, 10–5000 characters.
  - `display_order`: Required, non-negative integer.
- **Audit Log**: Yes — `FAQ_CREATE`.

#### `PATCH /api/v1/faqs/:id`
- **Purpose**: Update FAQ content or reorder.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Audit Log**: Yes — `FAQ_UPDATE`.

#### `DELETE /api/v1/faqs/:id`
- **Purpose**: Hard delete a FAQ entry.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Audit Log**: Yes — `FAQ_DELETE`.

#### `PUT /api/v1/faqs/reorder`
- **Purpose**: Bulk reorder all FAQs.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Request Body**:
  ```json
  {
    "order": [
      { "id": "uuid1", "display_order": 0 },
      { "id": "uuid2", "display_order": 1 },
      { "id": "uuid3", "display_order": 2 }
    ]
  }
  ```
- **Validation**: All IDs must reference existing FAQs. `display_order` values must be unique non-negative integers.
- **Audit Log**: Yes — `FAQ_REORDER`.

---

### 8.15 Settings

#### `GET /api/v1/settings`
- **Purpose**: List all platform settings.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Success Response** (`200`): Array of `{ key, value_json, description, updated_at }`.

#### `GET /api/v1/settings/:key`
- **Purpose**: Get a single setting by key.
- **Auth Required**: Conditional. Some settings (e.g., `registration_enabled`) are public. Others are admin-only.
- **Path Parameters**: `key` (String, required).

#### `PUT /api/v1/settings/:key`
- **Purpose**: Update a setting value.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Request Body**:
  ```json
  { "value_json": { "enabled": true, "max_registrations": 50000 } }
  ```
- **Validation**: `value_json` must be valid JSON.
- **Audit Log**: Yes — `SETTING_UPDATE` with before/after value.

---

### 8.16 Discord Accounts

#### `GET /api/v1/discord/account`
- **Purpose**: Get the current user's linked Discord account metadata (excluding tokens).
- **Auth Required**: Yes.
- **Success Response** (`200`):
  ```json
  {
    "success": true,
    "data": {
      "discord_id": "123456789",
      "joined_discord_at": "2024-03-15T00:00:00Z",
      "synced_at": "2026-09-20T14:00:00Z"
    }
  }
  ```

#### `POST /api/v1/discord/sync`
- **Purpose**: Force re-sync Discord profile data (username, avatar, guild membership).
- **Auth Required**: Yes.
- **Side Effects**: Uses stored refresh token to fetch latest Discord profile. Updates `users` table with new username/avatar. Re-validates guild membership.
- **Success Response** (`200`): Updated user profile.
- **Error Responses**: `401` — Refresh token expired, re-authentication required.
- **Rate Limit**: Registration tier (5 req/min).

---

### 8.17 Discord Webhooks

#### `POST /api/v1/discord/webhooks/test`
- **Purpose**: Send a test message to a configured Discord webhook URL.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Request Body**:
  ```json
  { "webhook_url": "https://discord.com/api/webhooks/...", "message": "Test from Gameverse Platform" }
  ```
- **Validation**: `webhook_url` must match `https://discord.com/api/webhooks/*` pattern.
- **Audit Log**: Yes — `WEBHOOK_TEST`.

#### `GET /api/v1/discord/webhook-logs`
- **Purpose**: List outgoing webhook execution logs.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Query Parameters**: `page`, `per_page`, `status` (WebhookStatus enum filter), `sort_by` (`executed_at`), `sort_order`.
- **Success Response** (`200`): Paginated array of webhook log entries.

---

### 8.18 Discord Logs

#### `GET /api/v1/discord/logs`
- **Purpose**: List Discord bot operation logs (role assignments, voice state events).
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Query Parameters**: `page`, `per_page`, `action` (filter by action type), `discord_user_id` (filter by Discord user), `sort_by` (`timestamp`), `sort_order`.
- **Success Response** (`200`): Paginated array of Discord log entries.

---

### 8.19 Audit Logs

#### `GET /api/v1/audit-logs`
- **Purpose**: List immutable administrative audit trail.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Query Parameters**: `page`, `per_page`, `actor_id` (UUID filter), `action` (String filter), `target_entity` (String filter), `sort_by` (`timestamp`), `sort_order`, `from_date` (ISO 8601), `to_date` (ISO 8601).
- **Success Response** (`200`): Paginated array of audit log entries with nested actor summary (`username`, `avatar_url`).
- **Note**: This table is append-only. No `PATCH`, `PUT`, or `DELETE` endpoints exist.

---

### 8.20 Analytics

#### `GET /api/v1/analytics/overview`
- **Purpose**: Get high-level festival metrics dashboard.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`.
- **Success Response** (`200`):
  ```json
  {
    "success": true,
    "data": {
      "total_registrations": 4823,
      "total_events": 47,
      "total_rsvps": 12450,
      "events_by_category": [
        { "category": "GAMING_NIGHT", "count": 16 },
        { "category": "VOICE_ACTIVITY", "count": 12 }
      ],
      "registrations_over_time": [
        { "date": "2026-09-15", "count": 120 },
        { "date": "2026-09-16", "count": 340 }
      ],
      "top_events_by_rsvp": [
        { "event_id": "uuid", "title": "Valorant Customs Night", "rsvp_count": 234 }
      ]
    }
  }
  ```
- **Cache**: Redis, 5 min TTL.

#### `GET /api/v1/analytics/events`
- **Purpose**: Get per-event analytics (RSVP trends, category breakdown).
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`.
- **Query Parameters**: `week_number` (filter by week), `category` (filter by category).

#### `GET /api/v1/analytics/registrations`
- **Purpose**: Get registration analytics (daily signups, pass status distribution).
- **Auth Required**: Yes.
- **Authorization**: `ADMIN`, `ORGANIZER`.
- **Query Parameters**: `from_date`, `to_date`.

---

## 9. Webhook Payload Structures

### 9.1 Event Announcement Webhook (Outgoing to Discord)

Triggered when a new event is created or status changes to `LIVE`.

```json
{
  "embeds": [{
    "title": "🎮 New Event: Valorant Customs Night",
    "description": "Join us for custom 10v10 lobbies this Friday night!",
    "color": 5793266,
    "fields": [
      { "name": "📅 When", "value": "Oct 10, 8:00 PM IST", "inline": true },
      { "name": "🎯 Category", "value": "Gaming Night", "inline": true },
      { "name": "🎙️ Host", "value": "ModeratorX", "inline": true }
    ],
    "footer": { "text": "Delhi NCR Gameverse 2026 • discord.gg/delhi" },
    "timestamp": "2026-10-08T12:00:00Z"
  }]
}
```

### 9.2 Announcement Webhook (Outgoing to Discord)

```json
{
  "embeds": [{
    "title": "📢 Week 2 Schedule Released!",
    "description": "Check out all the gaming nights and activities planned for Week 2...",
    "color": 5793266,
    "footer": { "text": "Delhi NCR Gameverse 2026" },
    "timestamp": "2026-10-07T12:00:00Z"
  }]
}
```

### 9.3 Registration Milestone Webhook (Outgoing to Discord)

Triggered at registration milestones (1000, 5000, 10000, etc.).

```json
{
  "embeds": [{
    "title": "🎉 Milestone: 5,000 Registrations!",
    "description": "The Gameverse community has crossed 5,000 festival registrations!",
    "color": 3066993,
    "footer": { "text": "Delhi NCR Gameverse 2026 • discord.gg/delhi" }
  }]
}
```

---

## 10. Bulk Action Endpoints

#### `POST /api/v1/events/bulk-status`
- **Purpose**: Update status for multiple events at once.
- **Auth Required**: Yes.
- **Authorization**: `ADMIN` only.
- **Request Body**:
  ```json
  { "event_ids": ["uuid1", "uuid2"], "status": "CANCELLED" }
  ```
- **Validation**: Max 50 event IDs per request. All IDs must exist. Status transition rules apply to each.
- **Audit Log**: Yes — one `EVENT_BULK_STATUS_UPDATE` entry with all affected IDs.

#### `POST /api/v1/notifications/bulk-delete`
- **Purpose**: Delete multiple notifications for the current user.
- **Auth Required**: Yes.
- **Request Body**:
  ```json
  { "notification_ids": ["uuid1", "uuid2", "uuid3"] }
  ```
- **Validation**: Max 100 IDs. All must belong to the current user.

---

## 11. Validation Strategy Summary

| Rule | Implementation |
| :--- | :--- |
| **Schema Validation** | Zod schemas validate every request body at the handler entry point. Invalid payloads return `422` with field-level error details. |
| **String Sanitization** | All string inputs are trimmed and stripped of HTML tags before validation. |
| **Enum Enforcement** | Enum fields are validated against the defined enum values. Invalid values return `422`. |
| **UUID Format** | All ID parameters are validated as UUID format. Invalid UUIDs return `422`. |
| **Date Validation** | All date fields must be valid ISO 8601 strings with timezone offsets. |
| **Slug Generation** | Slugs are auto-generated from titles using `lowercase`, `trim`, `replace spaces with hyphens`, `remove special characters`, and appended uniqueness suffix if collision detected. |
| **Foreign Key Existence** | All foreign key references are validated for existence before insert. Missing references return `404`. |
| **Rate Limit Enforcement** | Enforced via Redis sliding window counters. Exceeded limits return `429` with `Retry-After` header. |
