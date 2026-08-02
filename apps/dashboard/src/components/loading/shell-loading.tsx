import { SidebarLoading } from "@/components/loading/sidebar-loading";
import { TopNavLoading } from "@/components/loading/top-nav-loading";

export function ShellLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarLoading />
      </div>

      {/* Main Content */}
      <div className="min-h-screen lg:ml-[280px]">
        <TopNavLoading />
        <div className="p-4 lg:p-6">
          <div className="animate-pulse space-y-6">
            <div className="space-y-2">
              <div className="h-8 w-48 rounded-md bg-muted" />
              <div className="h-4 w-96 rounded-md bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
