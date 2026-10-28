"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, LogOut } from "@/components/ui/icons";
import { CommandPalette } from "@/components/search/command-palette";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationPanel } from "@/components/layout/notification-panel";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/types/database";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

interface TopbarProps {
  profile: Profile;
  unreadCount: number;
}

export function Topbar({ profile, unreadCount }: TopbarProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="flex items-center gap-3 px-6 py-3 border-b border-border bg-surface sticky top-0 z-10">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border rounded-md text-[13px] font-medium text-foreground bg-surface hover:border-border-strong transition-colors">
          Hamilton &amp; Associates
          <ChevronDown size={14} />
        </button>
        <span className="text-xs text-text-tertiary">Law Firm</span>

        <div className="flex-1" />

        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-text-tertiary text-[13px] bg-surface-alt min-w-[180px] hover:border-border-strong hover:text-foreground transition-colors"
        >
          <Search size={14} />
          Search…
          <kbd className="ml-auto text-[11px] px-1.5 py-px border border-border rounded bg-surface text-text-tertiary">
            ⌘K
          </kbd>
        </button>

        <ThemeToggle />

        <NotificationPanel initialCount={unreadCount} />

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-[30px] h-[30px] rounded-full bg-accent-subtle text-accent flex items-center justify-center text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="User menu"
          >
            {initials(profile.full_name)}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-[220px] bg-surface border border-border rounded-lg shadow-lg py-1 z-50">
              {/* Profile header */}
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-[13px] font-semibold text-foreground truncate">
                  {profile.full_name}
                </p>
                {profile.email && (
                  <p className="text-[12px] text-text-tertiary truncate mt-0.5">
                    {profile.email}
                  </p>
                )}
                <span className="inline-block mt-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-accent-subtle text-accent capitalize">
                  {profile.role}
                </span>
              </div>

              {/* Actions */}
              <div className="py-1">
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-text-secondary hover:bg-sidebar-hover hover:text-foreground transition-colors"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
