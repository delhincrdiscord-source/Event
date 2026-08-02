"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
import { Skeleton } from "@gameverse/ui/skeleton";

import { getLeaderboard } from "@/app/dashboard/_actions/gamification";

const RANK_EMOJIS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

const RANK_COLORS: Record<number, string> = {
  1: "bg-yellow-500/10 border-yellow-500/30",
  2: "bg-gray-300/10 border-gray-400/30",
  3: "bg-amber-600/10 border-amber-600/30",
};

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

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<
    Array<{
      rank: number;
      userId: string;
      username: string;
      avatarUrl: string | null;
      totalPoints: number;
      eventsJoined: number;
      wins: number;
      badges: number;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getLeaderboard();
        if (!result.success) {
          setError(result.error ?? "Failed to load leaderboard");
          return;
        }
        setLeaderboard(result.data);
      } catch {
        setError("Something went wrong loading the leaderboard");
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          🏆 Leaderboard
        </h1>
        <p className="text-muted-foreground">
          Top performers across all events and challenges
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 rounded-lg border p-4"
                >
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-[140px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[60px]" />
                  <Skeleton className="h-4 w-[60px]" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <span className="text-4xl">⚠️</span>
              <h3 className="mt-4 text-lg font-semibold">Error</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <span className="text-4xl">🏟️</span>
              <h3 className="mt-4 text-lg font-semibold">
                No rankings yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Rankings will appear once participants start earning points
              </p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {leaderboard.length >= 3 && (
                <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[leaderboard[1], leaderboard[0], leaderboard[2]].map(
                    (player, podiumIdx) => {
                      if (!player) return null;
                      const displayRank =
                        podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
                      return (
                        <motion.div
                          key={player.userId}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: podiumIdx * 0.15 }}
                          className={`rounded-xl border-2 p-6 text-center ${
                            RANK_COLORS[displayRank]
                          }`}
                        >
                          <div className="text-5xl mb-3">
                            {RANK_EMOJIS[displayRank]}
                          </div>
                          <h3 className="text-lg font-bold truncate">
                            {player.username}
                          </h3>
                          <p className="text-2xl font-bold text-primary mt-1">
                            {player.totalPoints.toLocaleString()} pts
                          </p>
                          <div className="mt-3 flex justify-center gap-4 text-sm text-muted-foreground">
                            <span>{player.eventsJoined} events</span>
                            <span>{player.wins} wins</span>
                            <span>{player.badges} badges</span>
                          </div>
                        </motion.div>
                      );
                    }
                  )}
                </div>
              )}

              {/* Full Table */}
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {/* Header */}
                <div className="flex items-center rounded-lg bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
                  <span className="w-16 text-center">#</span>
                  <span className="flex-1">Player</span>
                  <span className="w-24 text-right">Points</span>
                  <span className="hidden w-20 text-right md:block">
                    Events
                  </span>
                  <span className="hidden w-20 text-right md:block">
                    Wins
                  </span>
                  <span className="hidden w-20 text-right md:block">
                    Badges
                  </span>
                </div>

                {/* Rows */}
                {leaderboard.map((player) => {
                  const isTop3 = player.rank <= 3;
                  return (
                    <motion.div
                      key={player.userId}
                      variants={item}
                      className={`flex items-center rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                        isTop3 ? RANK_COLORS[player.rank] : ""
                      }`}
                    >
                      <span className="w-16 text-center text-lg font-bold">
                        {RANK_EMOJIS[player.rank] || `#${player.rank}`}
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
                      <span className="hidden w-20 text-right text-sm text-muted-foreground md:block">
                        {player.eventsJoined}
                      </span>
                      <span className="hidden w-20 text-right text-sm text-muted-foreground md:block">
                        {player.wins}
                      </span>
                      <span className="hidden w-20 text-right text-sm text-muted-foreground md:block">
                        {player.badges}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
