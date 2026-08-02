import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER" && session.user.role !== "MODERATOR") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
