"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { Card, CardContent,  } from "@gameverse/ui/card";
import { Badge } from "@gameverse/ui/badge";
import { Skeleton } from "@gameverse/ui/skeleton";

import { getUserAchievements } from "@/app/dashboard/_actions/gamification";

type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  pointValue: number;
  unlockedAt?: Date;
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

function AchievementCard({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
  return (
    <motion.div variants={item}>
      <Card
        className={`transition-all ${
          unlocked
            ? "border-green-500/30 bg-green-500/5" :"opacity-60 grayscale"
        }`}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-3xl">
              {achievement.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{achievement.name}</h3>
                {unlocked && (
                  <span className="text-green-500 text-sm">✓ Unlocked</span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {achievement.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {achievement.category}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  +{achievement.pointValue} pts
                </Badge>
                {unlocked && achievement.unlockedAt && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(achievement.unlockedAt)}
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

export default function AchievementsPage() {
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);
  const [locked, setLocked] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAchievements() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getUserAchievements();
        if (!result.success) {
          setError(result.error || "Failed to load achievements");
          return;
        }
        setUnlocked(result.data.unlocked);
        setLocked(result.data.locked);
      } catch {
        setError("Something went wrong loading achievements");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAchievements();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          🏅 Achievements
        </h1>
        <p className="text-muted-foreground">
          Your accomplishments and milestones across the festival
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
                      <Skeleton className="h-5 w-[60px] rounded-full" />
                      <Skeleton className="h-5 w-[50px] rounded-full" />
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
          {/* Unlocked Section */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                ✅ Unlocked ({unlocked.length})
              </h2>
            </div>
            {unlocked.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <span className="text-3xl">🔓</span>
                  <p className="mt-3 text-sm text-muted-foreground">
                    No achievements unlocked yet. Keep participating!
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
                {unlocked.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    unlocked
                  />
                ))}
              </motion.div>
            )}
          </div>

          {/* Locked Section */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                🔒 Locked ({locked.length})
              </h2>
            </div>
            {locked.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <span className="text-3xl">🏆</span>
                  <p className="mt-3 text-sm text-muted-foreground">
                    You&apos;ve unlocked every achievement!
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
                {locked.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    unlocked={false}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
