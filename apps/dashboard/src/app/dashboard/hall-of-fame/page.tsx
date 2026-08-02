"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
import { Badge } from "@gameverse/ui/badge";
import { Skeleton } from "@gameverse/ui/skeleton";

import { getHallOfFame } from "@/app/dashboard/_actions/gamification";

const RANK_EMOJIS: Record<number, string> = {
  1: "👑",
  2: "⭐",
  3: "🏆",
};

const PODIUM_ORDER = [1, 0, 2];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function HallOfFamePage() {
  const [hallOfFame, setHallOfFame] = useState<
    Array<{
      rank: number;
      userId: string;
      username: string;
      avatarUrl: string | null;
      totalPoints: number;
      achievements: number;
      badges: number;
      bestEvent: string | null;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHallOfFame() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getHallOfFame();
        if (!result.success) {
          setError(result.error ?? "Failed to load hall of fame");
          return;
        }
        setHallOfFame(result.data);
      } catch {
        setError("Something went wrong loading the hall of fame");
      } finally {
        setIsLoading(false);
      }
    }
    fetchHallOfFame();
  }, []);

  const top3 = hallOfFame.filter((e) => e.rank <= 3);
  const rest = hallOfFame.filter((e) => e.rank > 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          👑 Hall of Fame
        </h1>
        <p className="text-muted-foreground">
          The most legendary participants of the GameVerse Festival
        </p>
      </div>

      {isLoading ? (
        <>
          {/* Podium Skeleton */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex flex-col items-center p-6">
                  <Skeleton className="h-16 w-16 rounded-full mb-3" />
                  <Skeleton className="h-6 w-[120px] mb-2" />
                  <Skeleton className="h-4 w-[80px] mb-4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-[60px]" />
                    <Skeleton className="h-4 w-[60px]" />
                    <Skeleton className="h-4 w-[60px]" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Table Skeleton */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 rounded-lg border p-4"
                  >
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[60px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <span className="text-4xl">⚠️</span>
            <h3 className="mt-4 text-lg font-semibold">Error</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : hallOfFame.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <span className="text-4xl">🏟️</span>
            <h3 className="mt-4 text-lg font-semibold">No entries yet</h3>
            <p className="text-sm text-muted-foreground">
              The hall of fame will be populated as participants earn points
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length >= 3 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {PODIUM_ORDER.map((idx) => {
                const player = top3[idx];
                if (!player) return null;
                return (
                  <motion.div
                    key={player.userId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.15 }}
                  >
                    <Card
                      className={`text-center ${
                        player.rank === 1
                          ? "border-yellow-500/40 bg-gradient-to-b from-yellow-500/10 to-transparent"
                          : player.rank === 2
                          ? "border-gray-400/30" :"border-amber-600/30"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="text-5xl mb-3">
                          {RANK_EMOJIS[player.rank]}
                        </div>
                        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-muted text-2xl font-bold mb-3">
                          {player.username.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold">{player.username}</h3>
                        <p className="text-2xl font-bold text-primary mt-1">
                          {player.totalPoints.toLocaleString()} pts
                        </p>
                        <div className="mt-4 flex justify-center gap-3 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            🏅 {player.achievements} achievements
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            🎖️ {player.badges} badges
                          </Badge>
                        </div>
                        {player.bestEvent && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            🎮 {player.bestEvent}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Rest of List */}
          {rest.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>More Champions</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="space-y-2"
                >
                  {/* Header */}
                  <div className="flex items-center rounded-lg bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
                    <span className="w-12 text-center">#</span>
                    <span className="flex-1">Player</span>
                    <span className="w-24 text-right">Points</span>
                    <span className="hidden w-24 text-right md:block">
                      Achievements
                    </span>
                    <span className="hidden w-20 text-right md:block">
                      Badges
                    </span>
                    <span className="hidden w-[180px] text-right md:block">
                      Best Event
                    </span>
                  </div>

                  {rest.map((player) => (
                    <motion.div
                      key={player.userId}
                      variants={item}
                      className="flex items-center rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <span className="w-12 text-center text-lg font-bold text-muted-foreground">
                        #{player.rank}
                      </span>
                      <div className="flex flex-1 items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {player.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate font-medium">
                          {player.username}
                        </span>
                      </div>
                      <span className="w-24 text-right font-bold text-primary">
                        {player.totalPoints.toLocaleString()}
                      </span>
                      <span className="hidden w-24 text-right text-sm text-muted-foreground md:block">
                        {player.achievements}
                      </span>
                      <span className="hidden w-20 text-right text-sm text-muted-foreground md:block">
                        {player.badges}
                      </span>
                      <span className="hidden w-[180px] truncate text-right text-sm text-muted-foreground md:block">
                        {player.bestEvent || "—"}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
