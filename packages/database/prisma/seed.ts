import { PrismaClient, RoleName } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

const ROLES: Array<{ name: RoleName; description: string }> = [
  { name: "ADMIN", description: "Full system access" },
  { name: "ORGANIZER", description: "Festival and event management" },
  { name: "MODERATOR", description: "Content moderation and user management" },
  { name: "MEMBER", description: "Standard community member" },
  { name: "GUEST", description: "Unverified visitor" },
];

const PERMISSIONS: Array<{ key: string; description: string }> = [
  { key: "auth:login", description: "Log in to the platform" },
  { key: "auth:register", description: "Register a new account" },
  { key: "users:read", description: "View all users" },
  { key: "users:read:self", description: "View own profile" },
  { key: "users:update", description: "Update any user" },
  { key: "users:update:self", description: "Update own profile" },
  { key: "users:delete", description: "Delete any user" },
  { key: "events:read", description: "View events" },
  { key: "events:create", description: "Create events" },
  { key: "events:update", description: "Update events" },
  { key: "events:delete", description: "Delete events" },
  { key: "events:rsvp", description: "RSVP to events" },
  { key: "registrations:read", description: "View registrations" },
  { key: "registrations:create", description: "Create registrations" },
  { key: "registrations:update:status", description: "Update registration status" },
  { key: "announcements:read", description: "View announcements" },
  { key: "announcements:create", description: "Create announcements" },
  { key: "announcements:update", description: "Update announcements" },
  { key: "announcements:delete", description: "Delete announcements" },
  { key: "gallery:read", description: "View gallery" },
  { key: "gallery:submit", description: "Submit gallery items" },
  { key: "gallery:approve", description: "Approve gallery items" },
  { key: "gallery:delete", description: "Delete gallery items" },
  { key: "faqs:read", description: "View FAQs" },
  { key: "faqs:create", description: "Create FAQs" },
  { key: "faqs:update", description: "Update FAQs" },
  { key: "faqs:delete", description: "Delete FAQs" },
  { key: "faqs:reorder", description: "Reorder FAQs" },
  { key: "notifications:read:self", description: "View own notifications" },
  { key: "notifications:broadcast", description: "Send broadcast notifications" },
  { key: "settings:read", description: "View settings" },
  { key: "settings:update", description: "Update settings" },
  { key: "analytics:read", description: "View analytics" },
  { key: "audit:read", description: "View audit logs" },
  { key: "discord:sync", description: "Sync Discord data" },
  { key: "discord:webhook:test", description: "Test Discord webhooks" },
  { key: "discord:logs:read", description: "View Discord logs" },
];

const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  ADMIN: PERMISSIONS.map((p: { key: string; description: string }) => p.key),
  ORGANIZER: [
    "events:read", "events:create", "events:update",
    "registrations:read", "registrations:create", "registrations:update:status",
    "announcements:read", "announcements:create", "announcements:update",
    "notifications:read:self", "notifications:broadcast",
    "gallery:read", "gallery:submit", "gallery:approve",
    "analytics:read",
    "users:read:self", "users:update:self",
    "faqs:read",
    "discord:sync",
  ],
  MODERATOR: [
    "events:read",
    "registrations:read",
    "announcements:read", "announcements:update",
    "gallery:read", "gallery:submit", "gallery:approve",
    "users:read", "users:read:self", "users:update:self",
    "faqs:read",
    "notifications:read:self",
  ],
  MEMBER: [
    "events:read", "events:rsvp",
    "registrations:create",
    "announcements:read",
    "gallery:read", "gallery:submit",
    "users:read:self", "users:update:self",
    "faqs:read",
    "notifications:read:self",
    "discord:sync",
  ],
  GUEST: [
    "events:read",
    "announcements:read",
    "gallery:read",
    "faqs:read",
  ],
};

async function main(): Promise<void> {
  console.log("Seeding database...");

  // 1. Create roles
  const roleRecords = await Promise.all(
    ROLES.map((role: { name: RoleName; description: string }) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: { description: role.description },
        create: { name: role.name, description: role.description },
      })
    )
  );
  console.log(`  Created ${roleRecords.length} roles`);

  const roleMap = new Map(roleRecords.map((r: { name: RoleName; id: string }) => [r.name, r.id]));

  // 2. Create permissions
  const permRecords = await Promise.all(
    PERMISSIONS.map((perm: { key: string; description: string }) =>
      prisma.permission.upsert({
        where: { key: perm.key },
        update: { description: perm.description },
        create: { key: perm.key, description: perm.description },
      })
    )
  );
  console.log(`  Created ${permRecords.length} permissions`);

  const permMap = new Map(permRecords.map((p: { key: string; id: string }) => [p.key, p.id]));

  // 3. Map permissions to roles
  let mappingCount = 0;
  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap.get(roleName as RoleName);
    if (!roleId) continue;

    await Promise.all(
      permKeys.map((permKey: string) => {
        const permId = permMap.get(permKey);
        if (!permId) return Promise.resolve();
        mappingCount++;
        return prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId, permissionId: permId },
          },
          update: {},
          create: { roleId, permissionId: permId },
        });
      })
    );
  }
  console.log(`  Created ${mappingCount} role-permission mappings`);

  // 4. Create default admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@gameverse.delhincr.com";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.warn("  WARNING: ADMIN_PASSWORD env var not set. Skipping admin user creation.");
    console.warn("  Set ADMIN_PASSWORD and re-run the seed to create the admin user.");
  } else {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const passwordHash = await hashPassword(adminPassword);

      const adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          username: "admin",
          passwordHash,
          emailVerified: true,
          isVerified: true,
        },
      });

      const adminRoleId = roleMap.get("ADMIN");
      if (adminRoleId) {
        await prisma.userRole.create({
          data: {
            userId: adminUser.id,
            roleId: adminRoleId,
          },
        });
      }

      console.log(`  Created admin user: ${adminEmail}`);
      console.log(`  IMPORTANT: Change this password after first login!`);
    } else {
      console.log(`  Admin user already exists: ${adminEmail}`);
    }
  }

  // 5. Create a default festival for the event
  const existingFestival = await prisma.festival.findFirst({
    where: { slug: "gameverse-2026" },
  });

  if (!existingFestival) {
    await prisma.festival.create({
      data: {
        name: "Delhi NCR Gameverse 2026",
        slug: "gameverse-2026",
        shortDescription: "A month-long community festival for gamers, artists, and creators",
        fullDescription:
          "Delhi NCR Gameverse 2026 is a month-long community festival hosted by the Delhi NCR Discord Community. Join us for gaming nights, tournaments, creative contests, voice hangouts, and giveaways throughout October 2026.",
        themeColor: "#5865F2",
        discordInvite: "https://discord.gg/delhi",
        registrationEnabled: true,
        registrationStart: new Date("2026-09-01T00:00:00+05:30"),
        registrationEnd: new Date("2026-10-31T23:59:59+05:30"),
        startDate: new Date("2026-10-01T00:00:00+05:30"),
        endDate: new Date("2026-10-31T23:59:59+05:30"),
        timezone: "Asia/Kolkata",
        visibility: "PUBLIC",
        status: "UPCOMING",
        isActive: true,
      },
    });
    console.log("  Created default festival: Delhi NCR Gameverse 2026");
  } else {
    console.log("  Default festival already exists");
  }

  console.log("Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
