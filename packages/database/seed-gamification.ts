import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ACHIEVEMENTS = [
  { name: "First Steps", description: "Register for your first event", icon: "👣", category: "registration", pointValue: 50 },
  { name: "Social Butterfly", description: "Join 5 different events", icon: "🦋", category: "events", pointValue: 100 },
  { name: "Veteran", description: "Join 10 different events", icon: "🎖️", category: "events", pointValue: 250 },
  { name: "Champion", description: "Win your first event", icon: "🏆", category: "competition", pointValue: 200 },
  { name: "Unstoppable", description: "Win 3 events", icon: "🔥", category: "competition", pointValue: 500 },
  { name: "Legend", description: "Win 5 events", icon: "⭐", category: "competition", pointValue: 1000 },
  { name: "Early Bird", description: "Register for an event within 24 hours of creation", icon: "🐦", category: "special", pointValue: 75 },
  { name: "Community Star", description: "Earn 500 total points", icon: "🌟", category: "milestone", pointValue: 100 },
  { name: "Game Master", description: "Earn 1000 total points", icon: "🎮", category: "milestone", pointValue: 200 },
  { name: "Festival Hero", description: "Attend all events in a festival", icon: "🦸", category: "special", pointValue: 500 },
];

const BADGES = [
  { name: "Bronze Warrior", description: "Joined your first event", icon: "🥉", tier: "Bronze", pointValue: 25 },
  { name: "Silver Explorer", description: "Joined 5 events", icon: "🥈", tier: "Silver", pointValue: 100 },
  { name: "Gold Champion", description: "Won 3 events", icon: "🥇", tier: "Gold", pointValue: 300 },
  { name: "Platinum Elite", description: "Earned 1000 points", icon: "💎", tier: "Platinum", pointValue: 500 },
  { name: "Diamond Legend", description: "Earned 5000 points", icon: "👑", tier: "Diamond", pointValue: 1000 },
  { name: "Event Master", description: "Joined 15 events", icon: "🎮", tier: "Gold", pointValue: 200 },
  { name: "Social Star", description: "Referred 5 friends", icon: "⭐", tier: "Silver", pointValue: 150 },
  { name: "Festival King", description: "Attended every event in a festival", icon: "👑", tier: "Diamond", pointValue: 750 },
];

const REWARDS = [
  { name: "Custom Role", description: "Get a custom Discord role", icon: "🎭", pointCost: 500, stock: 50 },
  { name: "Priority Registration", description: "Skip the queue for next event", icon: "⚡", pointCost: 300, stock: 100 },
  { name: "Exclusive Badge", description: "Unlock a secret badge", icon: "🏅", pointCost: 750, stock: 25 },
  { name: "Game Credits", description: "₹100 game store credit", icon: "🎁", pointCost: 1000, stock: 20 },
  { name: "Merch Discount", description: "30% off festival merch", icon: "👕", pointCost: 400, stock: 75 },
  { name: "VIP Access", description: "VIP access to next festival", icon: "👑", pointCost: 2000, stock: 10 },
];

async function main() {
  console.log("Seeding gamification data...");

  // Achievements
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { name: a.name },
      update: {},
      create: a,
    });
  }
  console.log(`  Created ${ACHIEVEMENTS.length} achievements`);

  // Badges
  for (const b of BADGES) {
    await prisma.badge.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    });
  }
  console.log(`  Created ${BADGES.length} badges`);

  // Rewards
  for (const r of REWARDS) {
    await prisma.reward.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }
  console.log(`  Created ${REWARDS.length} rewards`);

  // Give admin user some starter points and badges
  const admin = await prisma.user.findUnique({ where: { email: "admin@delhincr.fun" } });
  if (admin) {
    // Points
    const existingPoints = await prisma.userPoints.findFirst({ where: { userId: admin.id } });
    if (!existingPoints) {
      await prisma.userPoints.createMany({
        data: [
          { userId: admin.id, points: 200, source: "seed", reason: "Welcome bonus" },
          { userId: admin.id, points: 100, source: "seed", reason: "Early adopter" },
          { userId: admin.id, points: 545, source: "seed", reason: "Achievement rewards" },
        ],
      });
      console.log("  Given admin user 845 points");
    }

    // Badges
    const first3Badges = await prisma.badge.findMany({ take: 3 });
    for (const badge of first3Badges) {
      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId: admin.id, badgeId: badge.id } },
        update: {},
        create: { userId: admin.id, badgeId: badge.id },
      });
    }
    console.log("  Given admin user 3 badges");

    // Achievements
    const first3Achievements = await prisma.achievement.findMany({ take: 3 });
    for (const ach of first3Achievements) {
      await prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId: admin.id, achievementId: ach.id } },
        update: {},
        create: { userId: admin.id, achievementId: ach.id },
      });
    }
    console.log("  Given admin user 3 achievements");
  }

  console.log("Gamification seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
