"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { Card, CardContent,  } from "@gameverse/ui/card";
import { Badge } from "@gameverse/ui/badge";
import { Skeleton } from "@gameverse/ui/skeleton";

import { getUserBadges } from "@/app/dashboard/_actions/gamification";

type BadgeItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  pointValue: number;
  earnedAt?: Date;
};

const TIER_STYLES: Record<string, { color: string; label: string }> = {
  BRONZE: { color: "bg-amber-700/15 text-amber-700 border-amber-700/30", label: "Bronze" },
  SILVER: { color: "bg-gray-400/15 text-gray-400 border-gray-400/30", label: "Silver" },
  GOLD: { color: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30", label: "Gold" },
  PLATINUM: { color: "bg-blue-500/15 text-blue-500 border-blue-500/30", label: "Platinum" },
  DIAMOND: { color: "bg-purple-500/15 text-purple-500 border-purple-500/30", label: "Diamond" },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function BadgeCard({ badge, earned }: { badge: BadgeItem; earned: boolean }) {
  const tierStyle = TIER_STYLES[badge.tier as keyof typeof TIER_STYLES] ?? { color: "bg-gray-500/15 text-gray-500 border-gray-500/30", label: badge.tier };

  return (
    <motion.div variants={item}>
      <Card
        className={`transition-all ${
          earned
            ? "border-primary/20" :"opacity-60 grayscale"
        }`}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-3xl">
              {badge.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{badge.name}</h3>
                <Badge
                  variant="outline"
                  className={`text-xs ${tierStyle.color}`}
                >
                  {tierStyle.label}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {badge.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  +{badge.pointValue} pts
                </Badge>
                {earned && badge.earnedAt && (
                  <span className="text-xs text-muted-foreground">
                    Earned on {formatDate(badge.earnedAt)}
                  </span>
                )}
                {!earned && (
                  <span className="text-xs text-muted-foreground">
                    Not yet earned
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function BadgesPage() {
  const [earned, setEarned] = useState<BadgeItem[]>([]);
  const [available, setAvailable] = useState<BadgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBadges() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getUserBadges();
        if (!result.success) {
          setError(result.error ?? "Failed to load badges");
          return;
        }
        setEarned(result.data.earned);
        setAvailable(result.data.available);
      } catch {
        setError("Something went wrong loading badges");
      } finally {
        setIsLoading(false);
      }
    }
    fetchBadges();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          🎖️ Badges
        </h1>
        <p className="text-muted-foreground">
          Collect badges by achieving milestones and completing challenges
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-14 w-14 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-[140px]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-5 w-[50px] rounded-full" />
                      <Skeleton className="h-5 w-[80px] rounded-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <span className="text-4xl">⚠️</span>
            <h3 className="mt-4 text-lg font-semibold">Error</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Earned Section */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                ✅ Earned ({earned.length})
              </h2>
            </div>
            {earned.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <span className="text-3xl">🎖️</span>
                  <p className="mt-3 text-sm text-muted-foreground">
                    No badges earned yet. Start participating to earn your first badge!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              >
                {earned.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} earned />
                ))}
              </motion.div>
            )}
          </div>

          {/* Available Section */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                🎯 Available ({available.length})
              </h2>
            </div>
            {available.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <span className="text-3xl">🏆</span>
                  <p className="mt-3 text-sm text-muted-foreground">
                    You&apos;ve earned every available badge!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              >
                {available.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} earned={false} />
                ))}
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
