"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Settings, ExternalLink, Trash2, Archive, RefreshCw, CheckCircle2, XCircle, Globe, Lock, EyeOff,  } from "lucide-react";

import { Button } from "@gameverse/ui/button";
import { Badge } from "@gameverse/ui/badge";
import { Card, CardContent, CardHeader, CardTitle,  } from "@gameverse/ui/card";
import { Separator } from "@gameverse/ui/separator";
import { Skeleton } from "@gameverse/ui/skeleton";

import {
  getFestivalById,
  deleteFestival,
  archiveFestival,
  restoreFestival,
  updateFestival,
} from "../_actions/festival";
import type { Festival, FestivalStatus } from "@gameverse/types";

const STATUS_COLORS: Record<FestivalStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  UPCOMING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  LIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  COMPLETED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  ARCHIVED:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
};

const VISIBILITY_ICONS: Record<string, React.ReactNode> = {
  PUBLIC: <Globe className="h-4 w-4" />,
  PRIVATE: <Lock className="h-4 w-4" />,
  UNLISTED: <EyeOff className="h-4 w-4" />,
};

export default function FestivalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [festival, setFestival] = useState<Festival | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchFestival = async () => {
      const result = await getFestivalById(id);
      if (result.success && result.data) {
        setFestival(result.data);
      }
      setIsLoading(false);
    };
    fetchFestival();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this festival?")) return;
    const result = await deleteFestival(id);
    if (result.success) {
      router.push("/dashboard/admin/festivals");
    }
  };

  const handleArchive = async () => {
    const result = await archiveFestival(id);
    if (result.success) {
      setFestival((prev) =>
        prev ? { ...prev, status: "ARCHIVED", isActive: false } : null
      );
    }
  };

  const handleRestore = async () => {
    const result = await restoreFestival(id);
    if (result.success) {
      setFestival((prev) =>
        prev ? { ...prev, status: "DRAFT", isActive: true } : null
      );
    }
  };

  const handleToggleActive = async () => {
    if (!festival) return;
    setIsUpdating(true);
    const result = await updateFestival(id, { isActive: !festival.isActive });
    if (result.success) {
      setFestival((prev) =>
        prev ? { ...prev, isActive: !prev.isActive } : null
      );
    }
    setIsUpdating(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-[300px]" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Festival not found</h3>
        <p className="text-sm text-muted-foreground">
          The festival you're looking for doesn't exist or has been deleted.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/dashboard/admin/festivals")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Festivals
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/admin/festivals")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {festival.name}
              </h1>
              <Badge className={STATUS_COLORS[festival.status]}>
                {festival.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{festival.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/festivals/${festival.id}/edit`)
            }
          >
            <Settings className="mr-2 h-4 w-4" />
            Edit
          </Button>
          {festival.status === "DRAFT" && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
          {festival.status === "ARCHIVED" && (
            <Button variant="outline" onClick={handleRestore}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Restore
            </Button>
          )}
          <Button variant="outline" onClick={handleToggleActive} disabled={isUpdating}>
            {festival.isActive ? (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg">{festival.name}</p>
            </div>
            {festival.shortDescription && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Short Description
                </p>
                <p>{festival.shortDescription}</p>
              </div>
            )}
            {festival.fullDescription && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Full Description
                </p>
                <p className="whitespace-pre-wrap">
                  {festival.fullDescription}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Theme Color
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-full border"
                  style={{ backgroundColor: festival.themeColor }}
                />
                <span>{festival.themeColor}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates & Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Dates & Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Festival Dates
                </p>
                <p>
                  {formatDate(festival.startDate)} -{" "}
                  {formatDate(festival.endDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Timezone
                </p>
                <p>{festival.timezone}</p>
              </div>
            </div>
            {festival.registrationEnabled && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Registration Period
                  </p>
                  <p>
                    {festival.registrationStart
                      ? formatDateTime(festival.registrationStart)
                      : "Not set"}{" "}
                    -{" "}
                    {festival.registrationEnd
                      ? formatDateTime(festival.registrationEnd)
                      : "Not set"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {VISIBILITY_ICONS[festival.visibility]}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Visibility
                  </p>
                  <p className="capitalize">{festival.visibility.toLowerCase()}</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Registration
                </p>
                <p>{festival.registrationEnabled ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <p>{festival.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links & Media */}
        <Card>
          <CardHeader>
            <CardTitle>Links & Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {festival.discordInvite && (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Discord Invite
                  </p>
                  <a
                    href={festival.discordInvite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {festival.discordInvite}
                  </a>
                </div>
              </div>
            )}
            {festival.bannerUrl && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Banner
                </p>
                <img
                  src={festival.bannerUrl}
                  alt="Festival Banner"
                  className="mt-2 h-32 w-full rounded-lg object-cover"
                />
              </div>
            )}
            {festival.logoUrl && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Logo
                </p>
                <img
                  src={festival.logoUrl}
                  alt="Festival Logo"
                  className="mt-2 h-24 w-24 rounded-lg object-cover"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
