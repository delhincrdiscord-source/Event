import { Skeleton } from "@/components/ui/skeleton";

export function SidebarLoading() {
  return (
    <div className="space-y-4 p-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-24" />
      </div>
      {/* Navigation Items */}
      <div className="space-y-2">
        {Array.from({ length: 9 })?.map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md px-3 py-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
