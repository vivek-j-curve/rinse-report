import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getProfile } from "@/lib/auth/get-profile";
import { getUnreadCount } from "@/lib/actions/notifications";

export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [profile, unreadCount] = await Promise.all([getProfile(), getUnreadCount()]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar profile={profile} unreadCount={unreadCount} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
