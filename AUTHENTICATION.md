# Authentication & Authorization Specification: Delhi NCR Gameverse 2026

## Executive Summary

This document defines the complete identity, authentication, authorization, and session management architecture for the **Delhi NCR Gameverse 2026** platform. It serves as the implementation blueprint for a production-grade auth system built on **Better Auth**, **Next.js 15 App Router**, **Prisma ORM**, and **PostgreSQL**.

Every flow, security decision, edge case, and failure mode is specified here. No implementation code is included — this is the engineering blueprint that precedes code generation.

---

## 1. Technology Decisions & Rationale

### 1.1 Why Better Auth Over NextAuth

| Criteria | Better Auth | NextAuth (Auth.js v5) |
| :--- | :--- | :--- |
| **Email + Password** | First-class built-in support with email verification, forgot/reset password | Requires custom credential provider with manual session handling |
| **Database Sessions** | Native database sessions with multi-device management | JWT-first by default; database sessions require adapter configuration |
| **Session Revocation** | Built-in per-session revocation and listing | No built-in multi-device session listing |
| **Plugin Architecture** | Composable plugins for 2FA, rate limiting, admin panel | Monolithic callbacks with limited extensibility |
| **TypeScript** | End-to-end type-safe with Zod integration | Partial type safety, generic adapters |
| **Framework Agnostic** | Works with any framework; first-class Next.js support | Tightly coupled to Next.js |

**Decision**: Use **Better Auth** as the primary authentication framework with its Prisma adapter, Discord social provider, email/password plugin, and admin plugin.

### 1.2 Password Hashing Algorithm

**Decision**: **Argon2id** (via Better Auth's built-in hasher).

**Rationale**: Argon2id is the winner of the Password Hashing Competition and is recommended by OWASP. It is resistant to both GPU-based attacks (memory-hard) and side-channel attacks. Better Auth supports Argon2id natively.

**Parameters**: `memoryCost: 65536` (64 MB), `timeCost: 3`, `parallelism: 4`.

### 1.3 Session Storage

**Decision**: **Database-backed sessions** stored in PostgreSQL via Prisma.

**Rationale**: Database sessions enable:
- Multi-device session listing and selective revocation.
- Server-side session invalidation on password change or account compromise.
- No client-side JWT token exposure (tokens are opaque session IDs in HTTP-only cookies).

---

## 2. Database Schema (Auth-Specific Entities)

These entities extend the platform's `DATABASE.md` schema. They are managed by Better Auth's Prisma adapter with custom extensions.

### 2.1 Entity: `users` (Extended)

The existing `users` table from `DATABASE.md` is extended with auth-specific columns:

| Column | Type | Nullable | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| `email` | VARCHAR(255) | NOT NULL | — | Login identifier (unique) |
| `email_verified` | BOOLEAN | NOT NULL | `false` | Email verification status |
| `password_hash` | TEXT | NULLABLE | — | Argon2id hash. NULL for OAuth-only accounts |
| `discord_id` | VARCHAR(64) | NULLABLE | — | Linked Discord user ID (unique) |
| `username` | VARCHAR(64) | NOT NULL | — | Display username |
| `global_name` | VARCHAR(128) | NULLABLE | — | Discord global display name |
| `avatar_url` | TEXT | NULLABLE | — | Profile avatar URL |
| `bio` | TEXT | NULLABLE | — | User biography |
| `timezone` | VARCHAR(64) | NULLABLE | `'Asia/Kolkata'` | User's preferred timezone |
| `social_links` | JSONB | NULLABLE | `{}` | `{ twitter, instagram, youtube, twitch }` |
| `notification_prefs` | JSONB | NOT NULL | `{"email": true, "push": true, "discord": true}` | Notification channel preferences |
| `privacy_settings` | JSONB | NOT NULL | `{"show_profile": true, "show_email": false}` | Privacy visibility flags |
| `is_verified` | BOOLEAN | NOT NULL | `false` | Discord guild membership verified |
| `banned_at` | TIMESTAMPTZ | NULLABLE | — | Account ban timestamp |
| `ban_reason` | TEXT | NULLABLE | — | Reason for ban |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last profile update |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | — | Soft delete timestamp |

**Unique Constraints**: `email` (partial, WHERE `deleted_at IS NULL`), `discord_id` (partial, WHERE `deleted_at IS NULL`).

### 2.2 Entity: `sessions`

| Column | Type | Nullable | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NOT NULL | — | FK → `users.id` CASCADE |
| `token` | VARCHAR(255) | NOT NULL | — | Opaque session token (hashed) |
| `ip_address` | VARCHAR(45) | NULLABLE | — | Client IP at session creation |
| `user_agent` | TEXT | NULLABLE | — | Browser/device user agent string |
| `expires_at` | TIMESTAMPTZ | NOT NULL | — | Session expiration timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Session creation time |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last activity timestamp |

**Indexes**: `idx_sessions_token` (unique on `token`), `idx_sessions_user` on (`user_id`), `idx_sessions_expires` on (`expires_at`).

### 2.3 Entity: `accounts` (OAuth Providers)

| Column | Type | Nullable | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NOT NULL | — | FK → `users.id` CASCADE |
| `provider` | VARCHAR(32) | NOT NULL | — | `'discord'`, `'credential'` |
| `provider_account_id` | VARCHAR(255) | NOT NULL | — | Provider's user ID |
| `access_token` | TEXT | NULLABLE | — | Encrypted OAuth access token |
| `refresh_token` | TEXT | NULLABLE | — | Encrypted OAuth refresh token |
| `token_expires_at` | TIMESTAMPTZ | NULLABLE | — | Token expiration |
| `scope` | TEXT | NULLABLE | — | Granted OAuth scopes |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Link creation time |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last token refresh |

**Unique Constraint**: (`provider`, `provider_account_id`).

### 2.4 Entity: `verification_tokens`

| Column | Type | Nullable | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NOT NULL | — | FK → `users.id` CASCADE |
| `token` | VARCHAR(255) | NOT NULL | — | Hashed verification token |
| `type` | VARCHAR(32) | NOT NULL | — | `'EMAIL_VERIFY'`, `'PASSWORD_RESET'` |
| `expires_at` | TIMESTAMPTZ | NOT NULL | — | Token expiry (15 min for reset, 24h for verify) |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation time |

### 2.5 Entity: `rate_limit_attempts`

| Column | Type | Nullable | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| `key` | VARCHAR(255) | NOT NULL | — | Rate limit key (e.g., `login:192.168.1.1`) |
| `count` | INT | NOT NULL | `1` | Attempt count in window |
| `window_start` | TIMESTAMPTZ | NOT NULL | `NOW()` | Window start time |
| `expires_at` | TIMESTAMPTZ | NOT NULL | — | Window expiry |

**Note**: For production at scale, rate limiting should migrate to Redis. The database table serves as a fallback and audit record.

---

## 3. Authentication Flows

### 3.1 Email + Password Registration

```
[User visits /register]
       │
       ▼
[Client renders registration form]
  Fields: username, email, password, confirm_password
       │
       ▼
[Client-side Zod validation]
  - username: 3–64 chars, alphanumeric + underscores
  - email: valid RFC 5322 format
  - password: min 8 chars, 1 uppercase, 1 lowercase, 1 digit
  - confirm_password: must match password
       │
       ▼
[POST /api/auth/sign-up (Better Auth endpoint)]
       │
       ▼
[Server-side validation]
  1. Check email uniqueness (case-insensitive, WHERE deleted_at IS NULL)
  2. Check username uniqueness
  3. Validate password strength
       │
       ▼
[Hash password with Argon2id]
       │
       ▼
[Create user record in database]
  - email_verified = false
  - Default role: MEMBER assigned via user_roles junction
       │
       ▼
[Generate email verification token]
  - Cryptographically random 32-byte token
  - Hashed with SHA-256 before storage
  - Expires in 24 hours
       │
       ▼
[Send verification email with link]
  Link: https://gameverse.delhincr.com/verify-email?token=<raw_token>
       │
       ▼
[Create database session + set HTTP-only cookie]
  - User is logged in immediately but flagged as unverified
  - Certain actions are gated behind email_verified = true
       │
       ▼
[Redirect to /dashboard with verification banner]
```

### 3.2 Email Verification

```
[User clicks verification link in email]
       │
       ▼
[GET /verify-email?token=<raw_token>]
       │
       ▼
[Server hashes the raw token with SHA-256]
       │
       ▼
[Look up verification_tokens WHERE hashed_token matches AND type = 'EMAIL_VERIFY']
       │
       ├── Token not found → 400: "Invalid or expired verification link."
       ├── Token expired → 400: "Verification link has expired. Request a new one."
       │
       ▼
[Update users SET email_verified = true]
       │
       ▼
[Delete the used verification token]
       │
       ▼
[Redirect to /dashboard with success toast]
       │
       ▼
[Write audit log: EMAIL_VERIFIED]
```

### 3.3 Email + Password Login

```
[User visits /login]
       │
       ▼
[Client renders login form]
  Fields: email, password, remember_me (checkbox)
       │
       ▼
[POST /api/auth/sign-in/email (Better Auth endpoint)]
       │
       ▼
[Rate Limit Check]
  Key: login:<ip_address>
  Limit: 5 attempts per 15-minute window
  Exceeded → 429: "Too many login attempts. Try again in X minutes."
       │
       ▼
[Look up user by email (case-insensitive)]
       │
       ├── User not found → 401: "Invalid email or password."
       │   (Generic message to prevent email enumeration)
       │
       ├── User soft-deleted → 401: "Invalid email or password."
       │
       ├── User banned → 403: "Your account has been suspended. Reason: <ban_reason>"
       │
       ▼
[Verify password against stored Argon2id hash]
       │
       ├── Mismatch → Increment rate_limit_attempts → 401: "Invalid email or password."
       │
       ▼
[Password matches — create session]
  - Session duration: 24 hours (default) or 30 days (if remember_me = true)
  - Store IP address and user agent for session listing
       │
       ▼
[Set HTTP-only session cookie]
  Name: __session
  Flags: HttpOnly, Secure, SameSite=Lax, Path=/
       │
       ▼
[Reset rate limit counter for this IP]
       │
       ▼
[Redirect to /dashboard]
       │
       ▼
[Write audit log: AUTH_LOGIN, method: 'email']
```

### 3.4 Discord OAuth Login

```
[User clicks "Login with Discord"]
       │
       ▼
[POST /api/auth/sign-in/social (provider: 'discord')]
       │
       ▼
[Better Auth generates Discord OAuth2 authorization URL]
  Scopes: identify, email, guilds.members.read
  State: CSRF-protected random string
       │
       ▼
[Redirect to Discord consent screen]
       │
       ▼
[User authorizes — Discord redirects to callback URL]
  GET /api/auth/callback/discord?code=<auth_code>&state=<csrf_state>
       │
       ▼
[Validate CSRF state token]
       │
       ├── Invalid state → 403: "Authentication failed. Please try again."
       │
       ▼
[Exchange auth code for access token + refresh token]
       │
       ▼
[Fetch Discord user profile using access token]
  GET https://discord.com/api/v10/users/@me
  Returns: id, username, global_name, email, avatar
       │
       ▼
[Check if Discord account is already linked to an existing user]
       │
       ├── YES: Linked to existing user
       │   ├── User soft-deleted? → 401
       │   ├── User banned? → 403
       │   └── Update Discord profile data (username, avatar) → Create session → Redirect
       │
       ├── NO: No linked account
       │   ├── Does email match an existing user?
       │   │   ├── YES: Auto-link Discord to existing email account → Create session
       │   │   └── NO: Create new user with Discord profile data → Assign MEMBER role → Create session
       │
       ▼
[Verify Discord guild membership — see Section 3.5]
       │
       ▼
[Store/update OAuth tokens (encrypted) in accounts table]
       │
       ▼
[Set HTTP-only session cookie (30 day expiry for OAuth logins)]
       │
       ▼
[Redirect to /dashboard]
       │
       ▼
[Write audit log: AUTH_LOGIN, method: 'discord']
```

### 3.5 Discord Guild Membership Verification

```
[After successful Discord OAuth, with access token available]
       │
       ▼
[Fetch guild membership]
  GET https://discord.com/api/v10/users/@me/guilds
  Look for Delhi NCR Discord Server guild ID in response
       │
       ├── MEMBER of guild
       │   └── Set users.is_verified = true
       │       Store guild join date
       │       Optionally sync Discord roles → user_roles
       │
       ├── NOT a member of guild
       │   └── Set users.is_verified = false
       │       User CAN still use the platform (reduced access)
       │       Show persistent banner: "Join discord.gg/delhi to unlock all festival features"
       │
       ▼
[Return verification status as part of session data]
```

**Access Policy for Non-Guild Members**:

| Feature | Guild Member | Non-Member |
| :--- | :---: | :---: |
| View landing page, schedule, FAQ | ✅ | ✅ |
| Register for festival pass | ✅ | ❌ |
| RSVP to events | ✅ | ❌ |
| Submit gallery items | ✅ | ❌ |
| Enter giveaways | ✅ | ❌ |
| View event details | ✅ | ✅ |
| Access dashboard (read-only) | ✅ | ✅ |

**Rationale**: Non-members are not blocked entirely. They can browse and explore, which encourages them to join the Discord server. Registration and participation features require verified guild membership.

### 3.6 Discord Account Linking (Existing Email Users)

```
[User is logged in via email/password, no Discord linked]
       │
       ▼
[User visits /settings/accounts → clicks "Link Discord"]
       │
       ▼
[Initiate Discord OAuth flow with scope: identify, email, guilds.members.read]
  Better Auth handles as account linking (not new login)
       │
       ▼
[Discord callback returns]
       │
       ▼
[Check if this Discord ID is already linked to ANOTHER user]
       │
       ├── YES → 409: "This Discord account is already linked to another user."
       │
       ▼
[Link Discord account to current user]
  - Insert into accounts table (provider: 'discord')
  - Update users.discord_id
  - Sync avatar, username, global_name from Discord
       │
       ▼
[Run guild membership verification (Section 3.5)]
       │
       ▼
[Write audit log: DISCORD_LINK]
```

### 3.7 Forgot Password

```
[User visits /forgot-password]
       │
       ▼
[Client renders email input form]
       │
       ▼
[POST /api/auth/forgot-password]
       │
       ▼
[Rate Limit Check]
  Key: forgot:<email>
  Limit: 3 requests per 15 minutes
       │
       ▼
[Look up user by email]
       │
       ├── User not found → 200: "If an account exists, a reset link has been sent."
       │   (Always return 200 to prevent email enumeration)
       │
       ├── User is OAuth-only (no password_hash) → 200 + send email explaining
       │   "Your account uses Discord login. Use 'Login with Discord' instead."
       │
       ▼
[Invalidate any existing password reset tokens for this user]
       │
       ▼
[Generate password reset token]
  - 32-byte cryptographically random token
  - Hash with SHA-256 before storage
  - Expires in 15 minutes
       │
       ▼
[Send reset email]
  Link: https://gameverse.delhincr.com/reset-password?token=<raw_token>
       │
       ▼
[Return 200: "If an account exists, a reset link has been sent."]
```

### 3.8 Reset Password

```
[User clicks reset link in email]
       │
       ▼
[GET /reset-password?token=<raw_token>]
       │
       ▼
[Client renders new password form]
  Fields: new_password, confirm_password
       │
       ▼
[POST /api/auth/reset-password]
  Body: { token, new_password }
       │
       ▼
[Hash the raw token → look up verification_tokens WHERE type = 'PASSWORD_RESET']
       │
       ├── Not found → 400: "Invalid or expired reset link."
       ├── Expired → 400: "This reset link has expired. Request a new one."
       │
       ▼
[Validate new password strength]
       │
       ▼
[Hash new password with Argon2id]
       │
       ▼
[Update users.password_hash]
       │
       ▼
[Delete the used reset token]
       │
       ▼
[Invalidate ALL existing sessions for this user]
  (Security: ensures any compromised session is terminated)
       │
       ▼
[Create a new session for the user]
       │
       ▼
[Write audit log: PASSWORD_RESET]
       │
       ▼
[Redirect to /dashboard with success message]
```

### 3.9 Change Password (Authenticated)

```
[User visits /settings/security]
       │
       ▼
[Client renders change password form]
  Fields: current_password, new_password, confirm_password
       │
       ▼
[POST /api/auth/change-password (Server Action)]
       │
       ▼
[Verify current_password against stored hash]
       │
       ├── Mismatch → 401: "Current password is incorrect."
       │
       ▼
[Validate new_password ≠ current_password]
       │
       ▼
[Hash new password with Argon2id]
       │
       ▼
[Update users.password_hash]
       │
       ▼
[Invalidate all OTHER sessions (keep current session active)]
       │
       ▼
[Write audit log: PASSWORD_CHANGE]
       │
       ▼
[Return success with toast: "Password updated. All other sessions have been signed out."]
```

### 3.10 Logout

```
[User clicks Logout]
       │
       ▼
[POST /api/auth/sign-out]
       │
       ▼
[Delete session record from database]
       │
       ▼
[Clear __session cookie (set to empty with immediate expiry)]
       │
       ▼
[Write audit log: AUTH_LOGOUT]
       │
       ▼
[Redirect to /login]
```

---

## 4. Session Lifecycle

### 4.1 Session Creation

- **Trigger**: Successful login (email/password or Discord OAuth).
- **Token**: 32-byte cryptographically random string, URL-safe base64 encoded.
- **Storage**: Hashed with SHA-256 and stored in `sessions` table. Raw token is sent to client in cookie.
- **Metadata Captured**: `ip_address`, `user_agent` (for multi-device listing).
- **Duration**:
  - Default: **24 hours**.
  - Remember Me / OAuth: **30 days**.

### 4.2 Session Validation (Every Request)

```
[Incoming request]
       │
       ▼
[Extract __session cookie value]
       │
       ├── Missing → Unauthenticated (proceed as GUEST for public routes, redirect to /login for protected)
       │
       ▼
[Hash cookie value → look up sessions table]
       │
       ├── Not found → Cookie is stale → Clear cookie → Redirect to /login
       │
       ▼
[Check sessions.expires_at > NOW()]
       │
       ├── Expired → Delete session → Clear cookie → Redirect to /login
       │
       ▼
[Check associated user]
       │
       ├── User soft-deleted? → Delete session → 401
       ├── User banned? → Delete session → 403: "Account suspended"
       │
       ▼
[Session is valid → attach user + roles + permissions to request context]
       │
       ▼
[Sliding window: if session is >50% through its lifetime, extend expires_at]
  (This prevents active users from being logged out unexpectedly)
```

### 4.3 Multi-Device Session Management

Users can view and manage all active sessions from `/settings/sessions`.

**List Sessions** (`GET /api/v1/sessions`):
```json
[
  {
    "id": "uuid",
    "ip_address": "192.168.1.42",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
    "device_summary": "Chrome on Windows",
    "created_at": "2026-09-28T10:00:00Z",
    "last_active": "2026-09-28T14:30:00Z",
    "is_current": true
  }
]
```

**Revoke Session** (`DELETE /api/v1/sessions/:id`):
- User can revoke any session except current (unless it's a "sign out everywhere" action).
- Admin can revoke any user's session.

**Revoke All Other Sessions** (`POST /api/v1/sessions/revoke-others`):
- Deletes all sessions for the user except the current one.
- Triggered automatically on password change and password reset.

### 4.4 Session Rotation

- **On Password Change**: All other sessions are invalidated. Current session token is rotated (new token issued, old one deleted).
- **On Password Reset**: All sessions are invalidated. A fresh session is created.
- **On Role Change**: Session data is invalidated from cache. Next request re-fetches permissions from the database.

---

## 5. Authorization & RBAC

### 5.1 Role Hierarchy

```
ADMIN (Level 5)
  └── Full system control. Can do everything.

ORGANIZER (Level 4)
  └── Create/edit events, publish announcements, approve gallery, manage registrations.

MODERATOR (Level 3)
  └── View registrations, manage announcements, review gallery submissions.

MEMBER (Level 2)
  └── Authenticated user. Can RSVP, register, submit gallery, enter giveaways.
      Requires is_verified = true (Discord guild member) for write actions.

GUEST (Level 1)
  └── Unauthenticated visitor. Read-only access to public pages.
```

### 5.2 Permission Keys

```
# Authentication
auth:login
auth:register

# Users
users:read
users:read:self
users:update
users:update:self
users:delete

# Events
events:read
events:create
events:update
events:delete
events:rsvp

# Registrations
registrations:read
registrations:create
registrations:update:status

# Announcements
announcements:read
announcements:create
announcements:update
announcements:delete

# Gallery
gallery:read
gallery:submit
gallery:approve
gallery:delete

# FAQs
faqs:read
faqs:create
faqs:update
faqs:delete
faqs:reorder

# Notifications
notifications:read:self
notifications:broadcast

# Settings
settings:read
settings:update

# Analytics
analytics:read

# Audit
audit:read

# Discord
discord:sync
discord:webhook:test
discord:logs:read
```

### 5.3 Role → Permission Mapping

| Permission | GUEST | MEMBER | MODERATOR | ORGANIZER | ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `events:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `events:rsvp` | — | ✅ | ✅ | ✅ | ✅ |
| `events:create` | — | — | — | ✅ | ✅ |
| `events:update` | — | — | — | ✅ | ✅ |
| `events:delete` | — | — | — | — | ✅ |
| `registrations:create` | — | ✅ | ✅ | ✅ | ✅ |
| `registrations:read` | — | — | ✅ | ✅ | ✅ |
| `registrations:update:status` | — | — | — | ✅ | ✅ |
| `announcements:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `announcements:create` | — | — | — | ✅ | ✅ |
| `announcements:update` | — | — | ✅ | ✅ | ✅ |
| `announcements:delete` | — | — | — | — | ✅ |
| `gallery:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `gallery:submit` | — | ✅ | ✅ | ✅ | ✅ |
| `gallery:approve` | — | — | ✅ | ✅ | ✅ |
| `gallery:delete` | — | — | — | — | ✅ |
| `faqs:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `faqs:create` | — | — | — | — | ✅ |
| `faqs:update` | — | — | — | — | ✅ |
| `faqs:delete` | — | — | — | — | ✅ |
| `notifications:read:self` | — | ✅ | ✅ | ✅ | ✅ |
| `notifications:broadcast` | — | — | — | ✅ | ✅ |
| `users:read` | — | — | ✅ | ✅ | ✅ |
| `users:read:self` | — | ✅ | ✅ | ✅ | ✅ |
| `users:update:self` | — | ✅ | ✅ | ✅ | ✅ |
| `users:update` | — | — | — | — | ✅ |
| `users:delete` | — | — | — | — | ✅ |
| `settings:read` | — | — | — | — | ✅ |
| `settings:update` | — | — | — | — | ✅ |
| `analytics:read` | — | — | — | ✅ | ✅ |
| `audit:read` | — | — | — | — | ✅ |
| `discord:sync` | — | ✅ | ✅ | ✅ | ✅ |
| `discord:webhook:test` | — | — | — | — | ✅ |
| `discord:logs:read` | — | — | — | — | ✅ |

### 5.4 Permission Resolution Algorithm

```
[Request arrives at protected endpoint]
       │
       ▼
[Extract user from session (Section 4.2)]
       │
       ├── No session → Role = GUEST
       │
       ▼
[Fetch user's roles from user_roles junction table]
  (Cached in Redis for 5 minutes, invalidated on role change)
       │
       ▼
[Fetch permissions for all user roles from role_permissions]
  (A user with multiple roles gets the UNION of all permissions)
       │
       ▼
[Check if required permission key exists in user's permission set]
       │
       ├── Permission exists → ALLOW
       ├── Permission missing → 403: FORBIDDEN
       │
       ▼
[Additional contextual checks]
  - "Self" permissions: users:update:self requires target_id === session.user_id
  - Guild verification: events:rsvp requires is_verified = true
  - Email verification: registrations:create requires email_verified = true
```

---

## 6. Route Protection Strategy

### 6.1 Route Classification

| Route Pattern | Access Level | Auth Required | Verification Required |
| :--- | :--- | :--- | :--- |
| `/` | Public | No | No |
| `/about` | Public | No | No |
| `/events` | Public | No | No |
| `/events/[slug]` | Public | No | No |
| `/schedule` | Public | No | No |
| `/faq` | Public | No | No |
| `/gallery` | Public | No | No |
| `/login` | Guest Only | No (redirect if logged in) | No |
| `/register` | Guest Only | No (redirect if logged in) | No |
| `/forgot-password` | Guest Only | No | No |
| `/reset-password` | Guest Only | No | No |
| `/dashboard` | Authenticated | Yes | No |
| `/dashboard/pass` | Authenticated | Yes | Email verified |
| `/dashboard/events` | Authenticated | Yes | No |
| `/settings/**` | Authenticated | Yes | No |
| `/admin` | Staff | Yes | Yes (role ≥ MODERATOR) |
| `/admin/events` | Staff | Yes | Yes (role ≥ ORGANIZER) |
| `/admin/registrations` | Staff | Yes | Yes (role ≥ ORGANIZER) |
| `/admin/announcements` | Staff | Yes | Yes (role ≥ MODERATOR) |
| `/admin/gallery` | Staff | Yes | Yes (role ≥ MODERATOR) |
| `/admin/analytics` | Staff | Yes | Yes (role ≥ ORGANIZER) |
| `/admin/settings` | Admin | Yes | Yes (role = ADMIN) |
| `/admin/users` | Admin | Yes | Yes (role = ADMIN) |
| `/admin/roles` | Admin | Yes | Yes (role = ADMIN) |
| `/admin/audit-logs` | Admin | Yes | Yes (role = ADMIN) |

### 6.2 Middleware Flow

```
[Every incoming request]
       │
       ▼
[Next.js Middleware (edge runtime)]
       │
       ▼
[Step 1: Rate Limit Check]
  - Check request IP against rate limit counters
  - If exceeded → return 429 response immediately
       │
       ▼
[Step 2: Route Classification]
  - Match request path against route configuration
  - Determine: isPublic, requiresAuth, requiredRole, requiredPermission
       │
       ├── Public route → PASS THROUGH (no auth check needed)
       │
       ▼
[Step 3: Session Extraction]
  - Read __session cookie
  - Validate session (lightweight check in middleware — full validation in Server Components/Actions)
       │
       ├── No valid session + route requires auth → Redirect to /login?redirect=<original_path>
       │
       ▼
[Step 4: Guest-Only Route Check]
  - If user is authenticated and route is guest-only (/login, /register)
  → Redirect to /dashboard
       │
       ▼
[Step 5: Role-Based Route Guard]
  - If route requires a minimum role level
  - Check user's highest role level against requirement
       │
       ├── Insufficient role → Redirect to /403 (forbidden page)
       │
       ▼
[Step 6: Pass through to page/API handler]
  - Attach session data to request headers for downstream consumption
```

**Important Middleware Principle**: The edge middleware performs **coarse-grained** route protection only (is the user logged in? do they have the right role tier?). **Fine-grained** permission checks (`events:create`, `gallery:approve`) are enforced in **Server Actions** and **API route handlers** where full database context is available.

---

## 7. Security Controls

### 7.1 Cookie Configuration

```
Name:     __session
Value:    <opaque_session_token>
HttpOnly: true       // Cannot be read by client-side JavaScript
Secure:   true       // Only sent over HTTPS
SameSite: Lax        // Sent with top-level navigations (needed for OAuth redirects)
Path:     /          // Available on all routes
MaxAge:   86400      // 24 hours (or 2592000 for remember_me)
Domain:   .gameverse.delhincr.com
```

### 7.2 CSRF Protection

- **Primary Defense**: `SameSite=Lax` cookies prevent cross-origin POST requests from sending the session cookie.
- **Secondary Defense**: All mutation Server Actions validate the `Origin` header matches the expected domain.
- **OAuth Flows**: Protected by cryptographic `state` parameter verified on callback.

### 7.3 Brute Force Protection

| Target | Key Pattern | Limit | Window | Lockout |
| :--- | :--- | :--- | :--- | :--- |
| Login | `login:<ip>` | 5 attempts | 15 min | Block IP for remaining window |
| Login (per email) | `login:<email>` | 10 attempts | 1 hour | Temporary account lock |
| Forgot Password | `forgot:<email>` | 3 requests | 15 min | Silently ignore excess |
| Registration | `register:<ip>` | 3 accounts | 1 hour | Block IP |
| Discord Sync | `discord-sync:<user_id>` | 5 requests | 5 min | 429 response |

**Account Lockout**: After 10 failed login attempts against a single email within 1 hour, the account enters a temporary 30-minute lockout. The user is informed: "Too many failed attempts. Please try again in 30 minutes or reset your password."

### 7.4 XSS Prevention

- All user-generated content is escaped at the rendering layer (React's default behavior).
- `Content-Security-Policy` header restricts script sources to `self` and explicitly whitelisted CDN domains.
- User-provided URLs (social links, avatar URLs) are validated against allowlisted domains (`cdn.discordapp.com`, `i.imgur.com`).

### 7.5 SQL Injection Protection

- All database queries are executed through Prisma's parameterized query builder. No raw SQL string interpolation.
- Database user has restricted permissions (no `DROP`, `ALTER`, `TRUNCATE` on production).

### 7.6 Token Security

| Token Type | Generation | Storage | Lifetime | Transmission |
| :--- | :--- | :--- | :--- | :--- |
| Session Token | 32-byte `crypto.randomBytes` | SHA-256 hash in DB | 24h / 30d | HTTP-only cookie |
| Email Verification | 32-byte `crypto.randomBytes` | SHA-256 hash in DB | 24 hours | Email link |
| Password Reset | 32-byte `crypto.randomBytes` | SHA-256 hash in DB | 15 minutes | Email link |
| OAuth Access Token | Issued by Discord | AES-256 encrypted in DB | Per Discord policy | Never exposed to client |
| OAuth Refresh Token | Issued by Discord | AES-256 encrypted in DB | Per Discord policy | Never exposed to client |

---

## 8. User Profile & Account Settings

### 8.1 Profile Data Model

```
Profile (visible to others based on privacy_settings):
├── avatar_url          → Synced from Discord or uploaded
├── username            → Editable, unique, 3-64 chars
├── global_name         → Synced from Discord
├── bio                 → Optional, max 500 chars
├── social_links        → { twitter, instagram, youtube, twitch } (validated URLs)
├── timezone            → IANA timezone string (e.g., "Asia/Kolkata")
└── discord_id          → Read-only, populated via Discord link
```

### 8.2 Account Settings Pages

```
/settings
├── /settings/profile          → Edit username, bio, social links, timezone
├── /settings/accounts         → Link/unlink Discord, view connected providers
├── /settings/security         → Change password, view active sessions
├── /settings/sessions         → List and revoke active sessions across devices
├── /settings/notifications    → Toggle email, push, Discord notification channels
├── /settings/privacy          → Toggle profile visibility, email visibility
└── /settings/danger           → Delete account (requires password confirmation)
```

### 8.3 Account Deletion Flow

```
[User visits /settings/danger → clicks "Delete My Account"]
       │
       ▼
[Confirmation modal with warning text]
  "This action is irreversible. All your data including registrations,
   RSVPs, and gallery submissions will be permanently removed."
       │
       ▼
[User must type their username to confirm]
       │
       ▼
[If password-based account: require current password]
[If Discord-only account: require Discord re-authentication]
       │
       ▼
[Server Action: soft-delete user]
  - Set users.deleted_at = NOW()
  - Invalidate ALL sessions
  - Clear __session cookie
  - Remove Discord role via bot (if applicable)
  - DO NOT hard-delete: retain for 30-day recovery window
       │
       ▼
[Write audit log: ACCOUNT_DELETE]
       │
       ▼
[Redirect to / with toast: "Your account has been deleted."]
       │
       ▼
[Background job: after 30 days, hard-delete user data and anonymize audit logs]
```

---

## 9. Edge Cases & Error Handling

### 9.1 Authentication Edge Cases

| Scenario | Handling |
| :--- | :--- |
| User logs in with email, then tries to register with same email | `409`: "An account with this email already exists." |
| User logs in via Discord, email matches existing password account | Auto-link Discord to existing account. Merge profiles. |
| Discord OAuth token expires during session | On next Discord API call failure, prompt user to re-authenticate with Discord. |
| User changes Discord username after linking | Username updates on next login or manual sync (`POST /api/v1/discord/sync`). |
| User leaves Delhi NCR Discord server after verification | `is_verified` remains `true` until next sync. Periodic background job (daily) re-verifies guild membership. |
| User tries to link Discord account already linked to another user | `409`: "This Discord account is linked to another user." |
| Two browser tabs open, one logs out | Second tab's next request detects invalid session → redirected to /login. |
| Session cookie exists but session deleted from DB | Cookie is cleared, user is redirected to /login. |
| User registers with disposable email | Allow (no email domain blocklist). Email verification ensures deliverability. |
| Admin changes a user's role while they are active | Role cache is invalidated. User's permissions update on their next request (within 5 minutes max). |

### 9.2 Error Response Patterns

**Authentication Errors** (Never leak existence of accounts):
```json
// Login failure (regardless of whether email exists)
{ "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid email or password." } }

// Forgot password (regardless of whether email exists)
{ "success": false, "error": { "code": "RESET_EMAIL_SENT", "message": "If an account exists, a reset link has been sent." } }
// Note: This is returned as success (200) to prevent enumeration
```

**Authorization Errors**:
```json
// Missing session
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Please log in to continue." } }

// Insufficient permissions
{ "success": false, "error": { "code": "FORBIDDEN", "message": "You do not have permission to perform this action." } }

// Account banned
{ "success": false, "error": { "code": "ACCOUNT_SUSPENDED", "message": "Your account has been suspended.", "details": { "reason": "Violation of community guidelines.", "banned_at": "2026-10-05T12:00:00Z" } } }

// Guild membership required
{ "success": false, "error": { "code": "GUILD_MEMBERSHIP_REQUIRED", "message": "Join discord.gg/delhi to unlock this feature." } }

// Email not verified
{ "success": false, "error": { "code": "EMAIL_NOT_VERIFIED", "message": "Please verify your email address to continue." } }
```

---

## 10. Audit Logging Strategy

### 10.1 Auth-Specific Audit Events

| Action Code | Trigger | Data Captured |
| :--- | :--- | :--- |
| `AUTH_LOGIN` | Successful login | `method` (email/discord), `ip`, `user_agent` |
| `AUTH_LOGOUT` | User logout | `session_id` |
| `AUTH_LOGIN_FAILED` | Failed login attempt | `email` (hashed), `ip`, `reason` |
| `EMAIL_VERIFIED` | Email verification complete | `email` |
| `PASSWORD_CHANGE` | Password changed | `sessions_revoked_count` |
| `PASSWORD_RESET` | Password reset via email | `sessions_revoked_count` |
| `DISCORD_LINK` | Discord account linked | `discord_id` |
| `DISCORD_UNLINK` | Discord account unlinked | `discord_id` |
| `DISCORD_SYNC` | Discord profile synced | `fields_updated` |
| `GUILD_VERIFY` | Guild membership verified | `is_member`, `guild_id` |
| `ROLE_ASSIGN` | Role assigned to user | `target_user_id`, `role_name` |
| `ROLE_REVOKE` | Role removed from user | `target_user_id`, `role_name` |
| `ACCOUNT_DELETE` | Account soft-deleted | `user_id` |
| `ACCOUNT_BAN` | Account banned | `target_user_id`, `reason` |
| `ACCOUNT_UNBAN` | Account unbanned | `target_user_id` |
| `SESSION_REVOKE` | Session manually revoked | `target_session_id` |

### 10.2 Retention Policy

- **Auth audit logs**: Retained for **1 year**.
- **Failed login attempts**: Retained for **90 days** then purged.
- **Rate limit records**: Retained for **24 hours** then purged.

---

## 11. Best Practices & Implementation Guidance

### 11.1 Password Policy (Enforced via Zod)

```
Minimum length:    8 characters
Maximum length:    128 characters
Must contain:      At least 1 uppercase letter
                   At least 1 lowercase letter
                   At least 1 digit
Must NOT be:       Same as email or username
Must NOT be:       In the list of 10,000 most common passwords
```

### 11.2 Email Normalization

- Convert to lowercase before storage and lookup.
- Trim whitespace.
- For Gmail: remove dots and `+alias` suffixes during uniqueness checks (optional, configurable).

### 11.3 Avatar Sync Priority

```
1. User-uploaded custom avatar (if set)
2. Discord avatar (synced from Discord CDN URL)
3. Generated avatar (Dicebear/Boring Avatars based on username hash)
```

### 11.4 Environment Variables Required

```
# Better Auth
BETTER_AUTH_SECRET          → 64-char random string for signing
BETTER_AUTH_URL             → https://gameverse.delhincr.com

# Discord OAuth
DISCORD_CLIENT_ID           → Discord application client ID
DISCORD_CLIENT_SECRET       → Discord application client secret
DISCORD_GUILD_ID            → Delhi NCR Discord server guild ID
DISCORD_BOT_TOKEN           → Bot token for role sync and guild queries

# Database
DATABASE_URL                → PostgreSQL connection string

# Email (for verification & reset)
SMTP_HOST                   → SMTP server hostname
SMTP_PORT                   → SMTP port
SMTP_USER                   → SMTP username
SMTP_PASS                   → SMTP password
EMAIL_FROM                  → noreply@gameverse.delhincr.com

# Encryption
TOKEN_ENCRYPTION_KEY        → AES-256 key for OAuth token encryption
```
