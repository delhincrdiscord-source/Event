"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";

import { Card, CardContent,  } from "@gameverse/ui/card";
import { Badge } from "@gameverse/ui/badge";
import { Button } from "@gameverse/ui/button";
import { Skeleton } from "@gameverse/ui/skeleton";

import { getUserRewards } from "@/app/dashboard/_actions/gamification";

type AvailableReward = {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointCost: number;
  stock: number;
};

type RedeemedReward = {
  id: string;
  name: string;
  icon: string;
  redeemedAt: Date;
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

export default function RewardsPage() {
  const [available, setAvailable] = useState<AvailableReward[]>([]);
  const [redeemed, setRedeemed] = useState<RedeemedReward[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function fetchRewards() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getUserRewards();
        if (!result.success) {
          setError(result.error ?? "Failed to load rewards");
          return;
        }
        setAvailable(result.data.available);
        setRedeemed(result.data.redeemed);
        setUserPoints(result.data.userPoints);
      } catch {
        setError("Something went wrong loading rewards");
      } finally {
        setIsLoading(false);
      }
    }
    fetchRewards();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            🎁 Rewards
          </h1>
          <p className="text-muted-foreground">
            Redeem your hard-earned points for exclusive rewards
          </p>
        </div>
        <Badge variant="secondary" className="text-base px-4 py-1.5">
          ⭐ Your Points: {userPoints.toLocaleString()}
        </Badge>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-[140px]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-5 w-[60px] rounded-full" />
                      <Skeleton className="h-5 w-[50px] rounded-full" />
                    </div>
                    <Skeleton className="h-9 w-[100px] mt-2 rounded-full" />
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
          {/* Available Rewards */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                🛒 Available Rewards ({available.length})
              </h2>
            </div>
            {available.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <span className="text-3xl">📭</span>
                  <p className="mt-3 text-sm text-muted-foreground">
                    No rewards available right now. Check back later!
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
                {available.map((reward) => {
                  const canAfford = userPoints >= reward.pointCost;
                  const inStock = reward.stock > 0;
                  const isDisabled = !canAfford || !inStock || isPending;

                  return (
                    <motion.div key={reward.id} variants={item}>
                      <Card className="transition-all hover:border-primary/20">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                              {reward.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">
                                {reward.name}
                              </h3>
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                {reward.description}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  ⭐ {reward.pointCost} pts
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    inStock
                                      ? "text-green-600 border-green-600/30" :"text-red-600 border-red-600/30"
                                  }`}
                                >
                                  {inStock
                                    ? `${reward.stock} in stock`
                                    : "Out of stock"}
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                className="mt-3 rounded-full"
                                disabled={isDisabled}
                                onClick={() => {
                                  if (isDisabled) return;
                                  startTransition(async () => {
                                    setAvailable((prev) =>
                                      prev
                                        .map((r) =>
                                          r.id === reward.id
                                            ? { ...r, stock: r.stock - 1 }
                                            : r
                                        )
                                        .filter((r) => r.stock > 0)
                                    );
                                    setUserPoints((prev) => prev - reward.pointCost);
                                    setRedeemed((prev) => [
                                      {
                                        id: reward.id,
                                        name: reward.name,
                                        icon: reward.icon,
                                        redeemedAt: new Date(),
                                      },
                                      ...prev,
                                    ]);
                                  });
                                }}
                              >
                                {!canAfford
                                  ? "Not enough points"
                                  : !inStock
                                  ? "Out of stock" :"Redeem"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* Redeemed Rewards */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                🎉 Your Redeemed Rewards ({redeemed.length})
              </h2>
            </div>
            {redeemed.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <span className="text-3xl">🎁</span>
                  <p className="mt-3 text-sm text-muted-foreground">
                    You haven&apos;t redeemed any rewards yet
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
                {redeemed.map((reward) => (
                  <motion.div key={`${reward.id}-${reward.redeemedAt}`} variants={item}>
                    <Card className="border-green-500/20 bg-green-500/5">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-2xl">
                            {reward.icon}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">
                              {reward.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Redeemed on {formatDate(reward.redeemedAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
