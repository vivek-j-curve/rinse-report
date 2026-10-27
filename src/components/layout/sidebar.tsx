"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Flag,
  Folder,
  FileText,
  Settings,
} from "@/components/ui/icons";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/suspicions", label: "Suspicions", icon: Flag },
  { href: "/cases", label: "Cases", icon: Folder },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] bg-sidebar-bg border-r border-border flex flex-col gap-1 p-3 sticky top-0 h-screen overflow-y-auto shrink-0">
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-2 pb-5 pt-1 no-underline text-foreground"
      >
        <div className="w-7 h-7 bg-accent rounded-[7px] flex items-center justify-center text-white shrink-0">
          <FileText size={14} />
        </div>
        <span className="font-sans text-base font-bold tracking-tight">
          Rinse Report
        </span>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13.5px] font-medium no-underline transition-colors ${
                isActive
                  ? "bg-sidebar-active text-foreground"
                  : "text-text-secondary hover:bg-sidebar-hover hover:text-foreground"
              }`}
            >
              <item.icon
                size={18}
                className={isActive ? "opacity-100" : "opacity-70"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />
      <div className="h-px bg-border mx-1" />
      <Link
        href="/settings"
        className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13.5px] font-medium no-underline transition-colors ${
          pathname.startsWith("/settings")
            ? "bg-sidebar-active text-foreground"
            : "text-text-secondary hover:bg-sidebar-hover hover:text-foreground"
        }`}
      >
        <Settings size={18} className="opacity-70" />
        Settings
      </Link>
    </aside>
  );
}
