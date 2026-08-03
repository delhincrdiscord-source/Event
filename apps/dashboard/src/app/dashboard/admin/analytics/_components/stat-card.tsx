"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@gameverse/ui/card";
import { Skeleton } from "@gameverse/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import type { ElementType, ComponentType } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon | ElementType | ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  isLoading = false,
  className = "",
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[80px] mb-1" />
          <Skeleton className="h-3 w-[120px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && (
            <Icon className="h-4 w-4 text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {(description || trend) && (
            <p className="text-xs text-muted-foreground">
              {trend && (
                <span
                  className={
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  }
                >
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
              )}
              {description && (
                <span className={trend ? "ml-1" : ""}>{description}</span>
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
